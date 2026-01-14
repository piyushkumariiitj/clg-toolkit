/**
 * ================================================================================================
 * FILE: App.jsx
 * ------------------------------------------------------------------------------------------------
 * ARCHITECTURE ROLE: Main Application Entry Point & State Container
 * 
 * This is a "Smart Component" or Container pattern in React. 
 * It manages the global state of the application for this Single Page Application (SPA).
 * 
 * DATA FLOW:
 * User Action --> Local State Update (setFiles/setMode) --> API Call (services/api.js)
 * --> Async Wait (Processing UI) --> Result State Update --> Completion UI
 * 
 * KEY COMPONENTS:
 * - UploadArea: Handles Drag & Drop + native file selection.
 * - ToolConfig: Context-aware configuration panel (changes based on mode).
 * - Preview: Renders PDF first page (Client-side via pdfjs-dist).
 * 
 * DESIGN PATTERN:
 * - Mode-Based Switching: Instead of routing (React Router), we use a simple state machine (mode)
 *   to switch views. This keeps the app lightweight and "tool-like".
 * ================================================================================================
 */

import React, { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, AlertCircle, CheckCircle, RotateCcw, Image as ImageIcon } from 'lucide-react';
import logo from './assets/logo.png';
import { motion, AnimatePresence } from 'framer-motion';

import UploadArea from './components/UploadArea';
import ToolConfig from './components/ToolConfig';
import FAQ from './components/FAQ';
import Preview from './components/Preview';
import ThemeToggle from './components/ThemeToggle';
import InteractiveBackground from './components/InteractiveBackground';
import { uploadFile, compressFile, mergeFiles, convertImagesToPdf, splitFile, organiseFile, rotateFile, pdfToWord } from './api';

const App = () => {
    // --------------------------------------------------------------------------------------------
    // STATE MANAGEMENT
    // --------------------------------------------------------------------------------------------
    
    // Core data: Array of files selected by user
    const [files, setFiles] = useState([]);
    
    // UI State Machine: Controls which 'Tool' is active
    // Options: 'compress' | 'merge' | 'split' | 'organise' | 'image-to-pdf'
    const [mode, setMode] = useState('compress'); 
    
    // Configuration Object: Stores settings for ALL tools.
    // *Design Decision*: Centralizing config prevents data loss when switching tabs.
    const [config, setConfig] = useState({ 
        targetSize: 200 * 1024, 
        split: { pages: '' },
        organise: { pageOrder: '' },
        rotate: { rotations: '{}' }
    });
    
    // Theme Management
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    // Request/Response Lifecycle State
    const [processing, setProcessing] = useState(false); // Validates async state
    const [processingStep, setProcessingStep] = useState('Starting...'); // 3️⃣ Lifecycle State Text
    const [result, setResult] = useState(null); // Stores server response (download URL)
    const [error, setError] = useState(null); // Error boundary message
    const [validation, setValidation] = useState(null); // Metadata from /validate endpoint

    // --------------------------------------------------------------------------------------------
    // HANDLERS
    // --------------------------------------------------------------------------------------------

    /**
     * Handles file addition from Dropzone.
     * Implements "Smart Mode Switching" - guesses intent based on file type/count.
     */
    const handleFilesSelected = (newFiles) => {
        // Assign unique ID to each file for React keys
        const taggedFiles = newFiles.map(f => {
            f.id = crypto.randomUUID();
            return f;
        });
        
        
        setFiles(prev => [...prev, ...taggedFiles]);
        setResult(null); // Reset previous results on new input
        setError(null);
        
        // LOGIC: Auto-detect user intent
        // 1. If Image -> Switch to Converter
        // 2. If Multiple Files -> Switch to Merger
        const isImage = newFiles.some(f => f.type.startsWith('image/'));
        if (isImage) {
            setMode('image-to-pdf');
        } else if (files.length > 0 || newFiles.length > 1) {
            if (mode !== 'image-to-pdf') setMode('merge');
        }
    };

    /**
     * Calls backend to "check" file health (Encryption, Size, etc.)
     * Does not block UI, but improves User Trust with status badges.
     */
    const validateFile = async (file) => {
        try {
            const data = await uploadFile(file);
            setValidation(data);
        } catch (err) {
            console.error('Validation Warning:', err);
            // We silent fail validation generally as it's non-blocking
        }
    };

    /**
     * Main Action Dispatcher.
     * Routes the current `mode` + `files` + `config` to the correct API endpoint.
     */
    /**
     * Main Action Dispatcher.
     * Routes the current `mode` + `files` + `config` to the correct API endpoint.
     */
    const handleProcess = async () => {
        if (files.length === 0) return;
        
        setProcessing(true);
        setProcessingStep('Uploading...'); // Initial Step
        setError(null);
        
        // Simulated Lifecycle Progress (since backend is fast/opaque)
        const progressTimer = setTimeout(() => setProcessingStep('Processing...'), 1500);

        try {
            let res;
            // Strategy Pattern: execution logic depends on `mode` string
            if (mode === 'compress') {
                res = await compressFile(files[0], config.targetSize);
                if(res.warning) setError(res.warning); 
            } else if (mode === 'merge') {
                setProcessingStep('Merging...');
                res = await mergeFiles(files);
            } else if (mode === 'image-to-pdf') {
                setProcessingStep('Converting...');
                res = await convertImagesToPdf(files);
            } else if (mode === 'split') {
                setProcessingStep('Splitting...');
                res = await splitFile(files[0], config.split.pages);
            } else if (mode === 'organise') {
                res = await organiseFile(files[0], config.organise.pageOrder);
            } else if (mode === 'rotate') {
                res = await rotateFile(files[0], JSON.parse(config.rotate.rotations));
            } else if (mode === 'pdf-to-word') {
                setProcessingStep('Converting to Word...');
                res = await pdfToWord(files[0]);
            }
            
            setProcessingStep('Finalizing...');
            setResult(res);
            
        } catch (err) {
            console.error(err);
            // Extract readable message from Axios error object
            setError(err.response?.data?.error || 'Processing failed');
        } finally {
            clearTimeout(progressTimer);
            setProcessing(false);
            setProcessingStep('Starting...');
            // UX Polish: Auto-scroll to result
            setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
        }
    };

    /**
     * Resets the interaction loop to initial state.
     */
    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setError(null);
        setValidation(null);
        setMode('compress');
    };

    // --------------------------------------------------------------------------------------------
    // RENDER
    // --------------------------------------------------------------------------------------------

    return (
        <div className="min-h-screen py-10 px-4 font-sans antialiased text-gray-800 dark:text-gray-100 transition-colors duration-300 relative">
            <InteractiveBackground />
            
            {/* ↖️ Brand Logo - Top Left Corner */}
            <div className="absolute top-6 left-6 z-50">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="cursor-pointer"
                    onClick={() => window.location.href = '/'}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <img src={logo} alt="College Submission Toolkit" className="h-16 md:h-20 drop-shadow-md" />
                </motion.div>
            </div>

            {/* ↗️ Theme Toggle - Top Right Corner */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>

            <div className="max-w-3xl mx-auto space-y-8 relative z-10">
                
                {/* Header */}
                <header className="text-center space-y-3 pt-12">
                    
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm leading-tight">
                        Compress, Merge & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Submit Instantly.</span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                        The all-in-one student toolkit. Fix <span className="font-bold text-red-500">"File Too Large"</span> errors, combine assignments, and convert images for Moodle & Google Classroom.
                    </p>
                </header>

                {/* Main Content Area */}
                <div className="space-y-6">
                    
                    {/* SECTION 1: Input / Upload */}
                    <div className="glass-card p-1 rounded-3xl dark:bg-slate-900/50 dark:border-slate-700">
                         <div className="p-6">
                             {files.length === 0 ? (
                                <UploadArea onFilesSelected={handleFilesSelected} processing={processing} />
                             ) : (
                                // File List View
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg flex items-center gap-2 dark:text-white">
                                            Selected Files 
                                            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-bold">{files.length}</span>
                                        </h3>
                                        <button 
                                            onClick={handleReset} 
                                            className="text-sm font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            disabled={processing}
                                        >
                                            <RotateCcw size={14} /> Reset
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {files.map((f, i) => (
                                            <motion.div 
                                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                                key={i} 
                                                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm"
                                            >
                                                {/* Icon determination logic */}
                                                {f.type.startsWith('image/') ? (
                                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                                        <ImageIcon size={20} className="text-purple-500 dark:text-purple-400" />
                                                    </div>
                                                ) : (
                                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                                        <FileText size={20} className="text-blue-500 dark:text-blue-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate text-gray-700 dark:text-gray-200">{f.name}</p>
                                                    <p className="text-xs text-gray-400 font-medium">{(f.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                             )}
                         </div>
                    </div>

                    {/* SECTION 2: Tool Configuration Panel */}
                    {/* Conditionally rendered only when files exist */}
                    {/* SECTION 2: Tool Configuration Panel */}
                    {/* Conditionally rendered only when files exist */}
                    {files.length > 0 && (
                        <ToolConfig 
                            mode={mode} 
                            setMode={setMode} 
                            config={config} 
                            setConfig={setConfig} 
                            processing={processing}
                            files={files}
                            setFiles={setFiles}
                        />
                    )}

                    {/* SECTION 3: Action Trigger */}
                    {/* SECTION 3: Action Trigger */}
                    {/* Dynamic Primary Action Button & Lifecycle States */}
                    {files.length > 0 && !result && (
                        <div className="space-y-3">
                            <motion.button
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                onClick={handleProcess}
                                disabled={processing || 
                                    (mode === 'compress' && !config.targetSize) ||
                                    (mode === 'split' && !config.split.pages)
                                }
                                className={`
                                    w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]
                                    ${processing || (mode === 'compress' && !config.targetSize) || (mode === 'split' && !config.split.pages)
                                        ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/25 hover:shadow-xl'
                                    }
                                `}
                            >
                                {processing ? (
                                    <>
                                        <RefreshCw className="animate-spin" /> 
                                        {/* Simulated Lifecycle State */}
                                        <span className="animate-pulse">
                                            {processingStep || 'Processing...'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        {/* Dynamic Label */}
                                        {mode === 'compress' ? 'Compress PDF' :
                                         mode === 'merge' ? 'Merge PDFs' :
                                         mode === 'split' ? 'Split PDF' :
                                         mode === 'organise' ? 'Save New Order' :
                                         mode === 'rotate' ? 'Save Rotation' :
                                         mode === 'image-to-pdf' ? 'Convert to PDF' :
                                         mode === 'pdf-to-word' ? 'Convert to Word' : 'Process Files'}
                                    </>
                                )}
                            </motion.button>
                            
                            {/* Trust & Privacy Indicator */}
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span>No data saved. Files auto-deleted after 5min.</span>
                            </div>
                        </div>
                    )}

                    {/* SECTION 4: Feedback / Error Boundary */}
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100">
                             <AlertCircle size={20} />
                             <span className="text-sm font-medium">{error}</span>
                        </motion.div>
                    )}

                    {/* SECTION 5: Success & Download */}
                    <AnimatePresence>
                        {result && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700 overflow-hidden relative"
                            >
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
                                
                                <div className="p-8 text-center pb-6">
                                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Ready to Submit!</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Your file has been optimized successfully.</p>
                                </div>
                                
                                <div className="px-8 pb-8 space-y-6">
                                    {/* Before vs After Comparison Panel */}
                                    <div className="bg-gray-50/50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 p-4 mx-4">
                                        {(() => {
                                            const originalSize = files.reduce((acc, f) => acc + f.size, 0);
                                            const finalSize = result.size;
                                            const reduction = ((originalSize - finalSize) / originalSize) * 100;
                                            const isReduction = reduction > 0;
                                            
                                            // Format bytes helper
                                            const fmt = (b) => b > 1024*1024 ? `${(b/1024/1024).toFixed(2)} MB` : `${(b/1024).toFixed(1)} KB`;

                                            return (
                                                <div className="flex flex-col gap-4">
                                                    {/* Row 1: Sizes */}
                                                    <div className="flex items-center justify-center gap-6 text-center">
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Original</p>
                                                            <p className="text-lg font-bold text-gray-500 dark:text-gray-400 line-through decoration-red-400/50">
                                                                {fmt(originalSize)}
                                                            </p>
                                                        </div>
                                                        
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-8 h-px bg-gray-300 dark:bg-slate-600 mb-1" />
                                                            <span className="text-gray-400 text-[10px] font-mono">TO</span>
                                                            <div className="w-8 h-px bg-gray-300 dark:bg-slate-600 mt-1" />
                                                        </div>

                                                        <div>
                                                            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Final</p>
                                                            <p className="text-xl font-black text-gray-800 dark:text-white">
                                                                {fmt(finalSize)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Row 2: Badges (Reduction & Pages) */}
                                                    <div className="flex justify-center gap-3">
                                                        {Math.abs(reduction) > 1 && (
                                                            <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${isReduction ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'}`}>
                                                                {isReduction ? '⬇' : '⬆'} {Math.abs(reduction).toFixed(0)}% {isReduction ? 'Saved' : 'Change'}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Backend Addition Plan: Add 'pageCount' to response json in /compress endpoint */}
                                                        {result.pageCount && (
                                                            <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                                                <FileText size={12} /> {result.pageCount} Pages
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Live Preview Component - Proves the file is valid */}
                                    {result.url && (
                                        <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-inner bg-gray-50 dark:bg-slate-900">
                                            <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-slate-700">
                                                Final Document Preview
                                            </div>
                                            <Preview fileUrl={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')}${result.url}`} />
                                        </div>
                                    )}

                                    {/* Primary CTA */}
                                    <div className="space-y-3 pt-2">
                                        <a 
                                            href={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')}${result.url}`} 
                                            download={result.filename}
                                            className="block w-full py-4 text-center bg-gray-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <Download size={20} /> Download PDF
                                            </span>
                                        </a>
                                        <button 
                                            onClick={handleReset} 
                                            className="block w-full text-center py-2 text-sm font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        >
                                            Process Another File
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>

            </div>

            {/* Wide FAQ Section */}
            <div className="relative z-10 w-full px-4">
                 <FAQ />
            </div>
            
            {/* Footer */}
            <div className="max-w-3xl mx-auto relative z-10 pb-10 px-4">
                <footer className="text-center space-y-2 pt-8 border-t border-gray-200/20 dark:border-slate-700/50">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        No data is stored permanently.
                        <br />
                        Made with ♡ by Piyush.
                    </p>
                    <p className="text-[10px] text-blue-300 dark:text-slate-600 font-medium tracking-widest uppercase">
                        College Submission Toolkit v2.0
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default App;
