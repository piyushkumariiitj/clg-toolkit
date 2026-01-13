const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure temp directory exists
const TEMP_DIR = path.join(__dirname, 'temp');
fs.ensureDirSync(TEMP_DIR);

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'College Submission Toolkit API Running' });
});

const multer = require('multer');
const pdfController = require('./controllers/pdfController');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, TEMP_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}_${file.originalname}`);
    }
});
const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// API Endpoints
app.post('/api/compress', upload.single('file'), pdfController.compress);
app.post('/api/merge', upload.array('files'), pdfController.merge);
app.post('/api/rename', upload.single('file'), pdfController.rename);
app.post('/api/image-to-pdf', upload.array('files'), pdfController.imageToPdf);
app.post('/api/split', upload.single('file'), pdfController.split);
app.post('/api/organise', upload.single('file'), pdfController.organise);
app.post('/api/rotate', upload.single('file'), pdfController.rotate);
app.post('/api/pdf-to-word', upload.single('file'), pdfController.pdfToWord);
app.post('/api/metadata', upload.single('file'), pdfController.updateMetadata);
app.post('/api/validate', upload.single('file'), pdfController.validate);

// Download endpoint
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(TEMP_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'File not found or expired' });
    }
});

// Auto cleanup temp files older than 5 minutes
setInterval(async () => {
    try {
        const files = await fs.readdir(TEMP_DIR);
        const now = Date.now();
        for (const file of files) {
            const filePath = path.join(TEMP_DIR, file);
            const stats = await fs.stat(filePath);
            if (now - stats.mtimeMs > 5 * 60 * 1000) {
                await fs.remove(filePath);
                console.log(`Deleted old temp file: ${file}`);
            }
        }
    } catch (err) {
        console.error('Cleanup error:', err);
    }
}, 60 * 1000); // Check every minute

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Check for Ghostscript
    const { exec } = require('child_process');
    const commands = ['gswin64c', 'gswin32c', 'gs'];
    console.log('Checking for Ghostscript...');
    let found = false;
    (async () => {
        for (const cmd of commands) {
            try {
                await new Promise((resolve, reject) => {
                    exec(`${cmd} --version`, (err) => err ? reject(err) : resolve());
                });
                console.log(`✅ Ghostscript found: ${cmd}`);
                found = true;
                break;
            } catch (e) { continue; }
        }
        if (!found) {
            console.error('❌ Ghostscript NOT found. PDF compression will fail.');
            console.error('Please install Ghostscript and add it to your PATH.');
        }
    })();
});
