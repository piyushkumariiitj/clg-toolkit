/**
 * ================================================================================================
 * 📄 FILE: pdfController.js
 * ------------------------------------------------------------------------------------------------
 * 🏗️ ARCHITECTURE ROLE: Core Request Handler (Business Logic Layer)
 * 
 * This controller serves as the primary business logic layer for PDF manipulations. 
 * In a Microservices architecture, this would likely be an independent "PDF Worker Service".
 * 
 * 🔄 DATA FLOW:
 * Client (React) --> Uploads File --> Express Middleware (Multer) --> Temp Disk Storage
 * --> Controller Action (Here) --> External Tools (Ghostscript/PDF-Lib) --> Processed File --> Client Download
 * 
 * 🛠️ KEY DESIGN DECISIONS:
 * 1. **Stateless Operations**: No DB is used. State is maintained on the filesystem (temp folder) 
 *    for a short TTL (Time To Live). This reduces costs and complexity for valid "utility" SaaS use cases.
 * 2. **Hybrid Processing Strategy**:
 *    - Uses **Ghostscript** (System Binary) for heavy compression (best-in-class, but requires dependency).
 *    - Uses **PDF-Lib** (Node.js Library) for manipulation (Metadata, Merging) and as a fallback.
 *    - This "Graceful Degradation" pattern ensures the service stays up even if the environment is imperfect.
 * 3. **Synchronous-over-HTTP**: Processing happens during the request. 
 *    - *Trade-off*: Simple to implement but limits scalability for massive files (timeouts).
 *    - *Scale Path*: Move to Async Job Queue (BullMQ/Redis) + WebSockets for production scale.
 * ================================================================================================
 */

const path = require('path');
const fs = require('fs-extra'); // Enhanced FS with promises/cleanup
const { PDFDocument } = require('pdf-lib'); // JS-native PDF manipulation (No C++ bindings needed)
const { exec } = require('child_process'); // To spawn Ghostscript processes
const { v4: uuidv4 } = require('uuid'); // Unique IDs for collision avoidance

// 📂 PERFORMANCE: Using an absolute path ensures reliability across different execution contexts (Docker vs Local)
const TEMP_DIR = path.join(__dirname, '../temp');

// Helper to get file path
const getFilePath = (filename) => path.join(TEMP_DIR, filename);

/**
 * --------------------------------------------------------------------------------------------
 * 🚀 FUNCTION: compress
 * --------------------------------------------------------------------------------------------
 * Logic: Reduces PDF size using Ghostscript with fallback to simple object stream optimization.
 * 
 * 🧠 COMPLEXITY:
 * - The "Iterative Compression" approach (trying multiple presets) is expensive (O(N) * FileSize).
 * - **Trade-off**: High CPU usage per request in exchange for meeting the user's "Target Size" requirement.
 * 
 * @param {object} req - Express request with `req.file` (Multer)
 * @param {object} res - Express response
 */
exports.compress = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const { targetSize } = req.body; // User's desired size in bytes
        const inputPath = req.file.path;
        const outputPath = path.join(TEMP_DIR, `compressed_${req.file.filename}`);

        // 📝 STRATEGY: Try presets from High Quality -> Low Quality until target size is met
        const presets = ['/prepress', '/printer', '/ebook', '/screen']; 
        let bestPath = null;
        let bestSize = Infinity;
        
        // 🔒 SECURITY/OPS: Detect Ghostscript presence to avoid crashing process
        const checkGsCommand = async () => {
            const commands = ['gswin64c', 'gswin32c', 'gs']; // Windows vs Linux binary names
            for (const cmd of commands) {
                try {
                    await new Promise((resolve, reject) => {
                        exec(`${cmd} --version`, (err) => err ? reject(err) : resolve());
                    });
                    return cmd;
                } catch (e) { continue; }
            }
            return null;
        };

        const gsCmd = await checkGsCommand();
        
        // --- 🛡️ FALLBACK MODE: Graceful Degradation ---
        // If the host server lacks Ghostscript (e.g., standard Node.js container), don't fail hard.
        if (!gsCmd) {
            console.log('⚠️ Ghostscript not found. Using fallback (pdf-lib) optimization.');
            
            try {
                // Read -> Load -> Resave. This strips unused objects but doesn't downsample images.
                const inputBuffer = await fs.readFile(inputPath);
                const pdfDoc = await PDFDocument.load(inputBuffer);
                
                // useObjectStreams: false is faster but less compressed. Default is usually better.
                // We just rely on pdf-lib's default cleaner writer here.
                const pdfBytes = await pdfDoc.save({ useObjectStreams: false }); 
                
                await fs.writeFile(outputPath, pdfBytes);
                
                const finalStats = await fs.stat(outputPath);
                
                // Return result with a specific "fallback" flag if we wanted to warn UI, 
                // but for now just return success so it doesn't crash.
                return res.json({
                    url: `/download/${path.basename(outputPath)}`,
                    filename: path.basename(outputPath),
                    size: finalStats.size,
                    originalSize: req.file.size,
                    warning: 'Basic optimization only. Install Ghostscript for max compression.'
                });
                
            } catch (err) {
                 console.error('Fallback compression failed:', err);
                 return res.status(500).json({ error: 'Compression failed (and Ghostscript is not installed).' });
            }
        }

        // --- ⚙️ GHOSTSCRIPT MODE (Performance Critical) ---
        // Helper to run external process
        const compressWithPreset = (preset, outPath) => {
            return new Promise((resolve, reject) => {
                 // 🔒 SECURITY: Path Injection mitigation is handled by basic quoting, 
                 // but ideally, we should avoid shell usage or use `execFile`.
                 // Input sanitization: convert backslashes (Windows) to forward slashes (GS requirement)
                 const safeInput = inputPath.replace(/\\/g, '/');
                 const safeOutput = outPath.replace(/\\/g, '/');
                 
                 // -dPDFSETTINGS: The magic switch that changes image DPI/compression
                 const command = `"${gsCmd}" -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${preset} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${safeOutput}" "${safeInput}"`;
                 
                 console.log(`Executing GS: ${command}`); // Debug log

                 exec(command, async (error, stdout, stderr) => {
                    if (error) {
                        console.error('GS Exec Error:', error);
                        console.error('GS Stderr:', stderr);
                        return reject(error);
                    }
                    if (!await fs.pathExists(outPath)) {
                        console.error('Output file missing after GS success');
                        return reject(new Error('Output file not created'));
                    }
                    const stats = await fs.stat(outPath);
                    console.log(`Compression successful: ${preset} -> ${(stats.size/1024).toFixed(2)}KB`);
                    resolve(stats.size);
                 });
            });
        };

        // ALGORITHM: Greedy Search
        // We iterate through quality levels. 
        // IF targetSize is defined: Stop as soon as we are small enough.
        // IF no targetSize: Default to '/ebook' (good balance).
        if (targetSize) {
            for (const preset of presets) {
                const stepOutputPath = path.join(TEMP_DIR, `comp_${preset.slice(1)}_${uuidv4()}.pdf`);
                try {
                    const size = await compressWithPreset(preset, stepOutputPath);
                    
                    if (size <= targetSize) {
                        bestPath = stepOutputPath;
                        bestSize = size;
                        break; // 🎯 Success: Found a valid size!
                    }
                    
                    // Keep track of the smallest we found so far just in case
                    if (size < bestSize) {
                        if (bestPath) await fs.remove(bestPath); // 🧹 Cleanup previous best
                        bestPath = stepOutputPath;
                        bestSize = size;
                    } else {
                        await fs.remove(stepOutputPath); // 🧹 Discard useless attempts
                    }
                } catch (e) {
                    console.error('Compression step failed:', e);
                }
            }
        } else {
            // Default strategy
            const defaultPath = path.join(TEMP_DIR, `comp_${uuidv4()}.pdf`);
            try {
                await compressWithPreset('/ebook', defaultPath);
                bestPath = defaultPath;
                bestSize = (await fs.stat(defaultPath)).size;
            } catch (e) {
                console.error('Default compression failed:', e);
            }
        }

        if (!bestPath) {
             return res.status(500).json({ error: 'Could not compress file' });
        }
        
        // Final move to ensure clean output filename
        await fs.move(bestPath, outputPath, { overwrite: true });

        const finalStats = await fs.stat(outputPath);
        // Returns relative URL. Frontend constructs full URL.
            res.json({
                url: `/download/${path.basename(outputPath)}`,
                filename: path.basename(outputPath),
                size: finalStats.size,
                originalSize: req.file.size
            });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during compression' });
    }
};

/**
 * --------------------------------------------------------------------------------------------
 * 🧩 FUNCTION: merge
 * --------------------------------------------------------------------------------------------
 * Merges multiple PDF files into a single ordered document.
 * 
 * 🧠 LOGIC:
 * - Loads all PDFs into memory (High RAM usage potential).
 * - Copies each page one by one to a new document.
 * - *Scale Note*: For 100+ MB files, this would crash the Node process. Stream processing needed for scale.
 */
exports.merge = async (req, res) => {
    try {
        if (!req.files || req.files.length < 2) return res.status(400).json({ error: 'At least 2 files required' });
        
        const mergedPdf = await PDFDocument.create();
        
        // Iterate sequentially to preserve array order (req.files order matters!)
        for (const file of req.files) {
            const pdfBytes = await fs.readFile(file.path);
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }
        
        const outputFilename = `merged_${uuidv4()}.pdf`;
        const outputPath = path.join(TEMP_DIR, outputFilename);
        const pdfBytes = await mergedPdf.save();
        await fs.writeFile(outputPath, pdfBytes);
        
        const stats = await fs.stat(outputPath);

        res.json({
            url: `/download/${outputFilename}`,
            filename: outputFilename,
            size: stats.size,
            pageCount: mergedPdf.getPageCount()
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Merge failed' });
    }
};

/**
 * --------------------------------------------------------------------------------------------
 * 🏷️ FUNCTION: rename
 * --------------------------------------------------------------------------------------------
 * A simple utility to standardize filenames for University submissions.
 * Does not modify PDF content, only the file entry on disk.
 */
exports.rename = async (req, res) => {
    // Just metadata handling, file is already "uploaded" or referenced
    // User might upload a file AND rename params.
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const { rollNo, subject, type, date } = req.body;
        
        // 🔒 SECURITY: Sanitize components to prevent Directory Traversal (e.g. "../")
        const newFilename = `${rollNo}_${subject}_${type}_${date}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, ''); 
        
        // We don't necessarily rename the temp file on disk immediately to avoid collisions,
        // but we send back the "suggested" name or rename it for download.
        // "mv" the file on the temp disk
        
        const oldPath = req.file.path;
        const newPath = path.join(TEMP_DIR, newFilename);
        
        await fs.rename(oldPath, newPath);
        
        res.json({
            url: `/download/${newFilename}`,
            filename: newFilename,
            originalName: req.file.originalname
        });
        
    } catch (err) {
         console.error(err);
        res.status(500).json({ error: 'Rename failed' });
    }
};

// ... existing exports ...

/**
 * --------------------------------------------------------------------------------------------
 * 🖼️ FUNCTION: imageToPdf
 * --------------------------------------------------------------------------------------------
 * Converts an array of Images (JPG/PNG) into a single PDF document.
 * Often requested by students who take photos of handwritten pages.
 */
exports.imageToPdf = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No images uploaded' });
        
        const doc = await PDFDocument.create();
        
        // Loop through images and embed them
        for (const file of req.files) {
            const imgBytes = await fs.readFile(file.path);
            let image;
            
            // PDF-Lib requires explicit embedding based on format
            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
                image = await doc.embedJpg(imgBytes);
            } else if (file.mimetype === 'image/png') {
                image = await doc.embedPng(imgBytes);
            } else {
                continue; // ⚠️ Silent skip of unsupported files
            }
            
            // Create page matching image dimensions
            const page = doc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height,
            });
        }
        
        const outputFilename = `converted_${uuidv4()}.pdf`;
        const outputPath = path.join(TEMP_DIR, outputFilename);
        const pdfBytes = await doc.save();
        await fs.writeFile(outputPath, pdfBytes);
        
        const stats = await fs.stat(outputPath);

        res.json({
            url: `/download/${outputFilename}`,
            filename: outputFilename,
            size: stats.size,
            pageCount: doc.getPageCount()
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Image conversion failed' });
    }
};

/**
 * --------------------------------------------------------------------------------------------
 * 📝 FUNCTION: updateMetadata
 * --------------------------------------------------------------------------------------------
 * Modifies the inner PDF properties (Author, Title) without changing visual content.
 * Critical for removing privacy leaks (e.g., "Scanned by CamScanner").
 */
exports.updateMetadata = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });
        const { title, author, subject, keywords } = req.body;
        
        const inputPath = req.file.path;
        const pdfBytes = await fs.readFile(inputPath);
        const doc = await PDFDocument.load(pdfBytes);
        
        // Set PDF Spec Metadata
        if (title) doc.setTitle(title);
        if (author) doc.setAuthor(author);
        if (subject) doc.setSubject(subject);
        if (keywords) doc.setKeywords(keywords.split(','));
        // Overwrite Producer line
        doc.setProducer('College Submission Toolkit');
        
        const outputFilename = `meta_${uuidv4()}.pdf`;
        const outputPath = path.join(TEMP_DIR, outputFilename);
        const savedBytes = await doc.save();
        await fs.writeFile(outputPath, savedBytes);
        
        const stats = await fs.stat(outputPath);
        
        res.json({
            url: `/download/${outputFilename}`,
            filename: req.file.originalname, // Keep original name or hint it's modified
            size: stats.size
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Metadata update failed' });
    }
};

/**
 * --------------------------------------------------------------------------------------------
 * 🔍 FUNCTION: validate
 * --------------------------------------------------------------------------------------------
 * Performs safety checks and basic analysis before processing.
 * - Checks for encryption (password protection).
 * - Checks for corruption.
 * - Flags hefty files.
 */
exports.validate = async (req, res) => {
     try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        
        const inputPath = req.file.path;
        const pdfBytes = await fs.readFile(inputPath);
        
        let pdfDoc;
        try {
            pdfDoc = await PDFDocument.load(pdfBytes);
        } catch (e) {
            return res.json({ status: 'INVALID', message: 'Corrupted or not a valid PDF' });
        }
        
        if (pdfDoc.isEncrypted) {
             return res.json({ status: 'INVALID', message: 'PDF is password protected' });
        }
        
        const pageCount = pdfDoc.getPageCount();
        const size = req.file.size;
        
        // Business Rule: Files larger than 5MB are marked "RISKY" for submission portals
        let status = 'READY';
        if (size > 5 * 1024 * 1024) status = 'RISKY';
        
        res.json({
            status,
            pageCount,
            size,
            filename: req.file.filename
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Validation failed' });
    }
};
