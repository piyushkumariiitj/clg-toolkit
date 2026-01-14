import React, { useRef } from 'react'; // Added useRef
import PageGrid from './PageGrid';
import { FileText, ArrowUp, ArrowDown, X, Plus } from 'lucide-react'; // ➕ Added Plus icon

// Simple File Item Component with Move Controls
const FileItem = ({ file, index, total, onMove, onRemove }) => {
    return (
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:border-blue-200 dark:hover:border-slate-600 transition-all group">
           
           {/* Icon */}
           <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
               <FileText size={18} className="text-blue-500 dark:text-blue-400" />
           </div>
           
           {/* File Info */}
           <div className="flex-1 min-w-0">
               <p className="text-sm font-semibold truncate text-gray-700 dark:text-gray-200">{file.name}</p>
               <p className="text-xs text-gray-400 font-medium">{(file.size / 1024).toFixed(1)} KB</p>
           </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
                <button 
                    type="button"
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        onMove(index, -1); 
                    }}
                    disabled={index === 0}
                    className="relative z-10 cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                    title="Move Up"
                >
                    <ArrowUp size={16} className="pointer-events-none" />
                </button>
                <button 
                    type="button"
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        onMove(index, 1); 
                    }}
                    disabled={index === total - 1}
                    className="relative z-10 cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                    title="Move Down"
                >
                    <ArrowDown size={16} className="pointer-events-none" />
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 mx-1" />
                <button 
                    type="button"
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        onRemove(index); 
                    }}
                    className="relative z-10 cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
                    title="Remove"
                >
                    <X size={16} className="pointer-events-none" />
                </button>
            </div>
        </div>
    );
};

const ToolConfig = ({ mode, setMode, config, setConfig, processing, files, setFiles }) => {
    const fileInputRef = useRef(null); // Ref for hidden input

    // Logic: Analyze files to determine available tools
    const hasPdf = files?.some(f => f.type === 'application/pdf');
    const hasImage = files?.some(f => f.type.startsWith('image/'));

    const tabs = [
        { id: 'compress', label: 'Compress', disabled: hasImage }, // Tools for PDF only
        { id: 'merge', label: 'Merge', disabled: hasImage },       // Merge usually for PDFs
        { id: 'split', label: 'Split', disabled: hasImage },
        { id: 'organise', label: 'Organise', disabled: hasImage },
        { id: 'rotate', label: 'Rotate', disabled: hasImage },
        { id: 'pdf-to-word', label: 'Pdf > Word', disabled: hasImage },
        { id: 'image-to-pdf', label: 'Img > PDF', disabled: hasPdf } // Tool for Images only
    ];

    // File Reordering Logic
    const moveFile = (index, direction) => {
        const newFiles = [...files];
        if (index + direction < 0 || index + direction >= newFiles.length) return;
        
        const temp = newFiles[index];
        newFiles[index] = newFiles[index + direction];
        newFiles[index + direction] = temp;
        setFiles(newFiles);
    };

    const removeFile = (index) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
    };

    // Add More Files Logic
    const handleAddFiles = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(f => {
                f.id = crypto.randomUUID(); // Essential for reordering!
                return f;
            });
            setFiles(prev => [...prev, ...newFiles]);
        }
        // Reset input so same file can be added again if needed
        e.target.value = ''; 
    };

    return (
        <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300">
            {/* Scrollable Tabs Container */}
            <div className="p-2 bg-gray-50/80 dark:bg-slate-900/80 border-b border-gray-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
                <div className="flex gap-2 min-w-max">
                    {tabs.map(tab => {
                        const isActive = mode === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setMode(tab.id)}
                                disabled={processing || tab.disabled}
                                className={`
                                    relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                                    ${isActive 
                                        ? 'text-white shadow-md' 
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                                    }
                                    ${tab.disabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
                                `}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl -z-10" />
                                )}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-6 dark:text-gray-200">
                {mode === 'compress' && (
                    <div className="space-y-4">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Target File Size</label>
                        {/* Student-Focused Presets */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {[
                                { label: '🎓 College Portal (≤200KB)', size: 200 },
                                { label: '📧 Email Ready (≤1MB)', size: 1024 },
                                { label: '🖨️ Print Friendly (High)', size: 5120 }
                            ].map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={() => setConfig({...config, targetSize: preset.size * 1024})}
                                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[200, 500, 1024, 2048].map(size => (
                                <button
                                    key={size}
                                    onClick={() => setConfig({...config, targetSize: size * 1024})}
                                    className={`
                                        py-2 px-3 rounded-lg border text-sm font-medium transition-all
                                        ${config.targetSize === size * 1024 
                                            ? 'border-primary bg-primary text-white shadow-md ring-2 ring-primary/30' 
                                            : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'
                                        }
                                    `}
                                >
                                    {size >= 1024 ? `${size/1024} MB` : `${size} KB`}
                                </button>
                            ))}
                            <div className="relative group flex items-center col-span-2 lg:col-span-4">
                                <span className="absolute left-3 text-gray-400 text-sm">Custom:</span>
                                <input 
                                    type="number" 
                                    className="w-full pl-20 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all 
                                               border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 
                                               bg-white dark:bg-slate-800 placeholder-gray-400" 
                                    placeholder="Enter size..."
                                    value={config.targetSize ? Math.round(config.targetSize / 1024) : ''}
                                    onChange={(e) => {
                                        const ky = parseInt(e.target.value) || 0;
                                        setConfig({...config, targetSize: ky * 1024});
                                    }}
                                />
                                <span className="absolute right-3 text-gray-400 text-sm">KB</span>
                            </div>
                        </div>

                        {/* Real-Time Output Size Estimation */}
                        {files && files.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Original: <span className="font-medium text-gray-700 dark:text-gray-200">{(files[0].size / 1024).toFixed(0)} KB</span></span>
                                    
                                    {(() => {
                                        const original = files[0].size / 1024;
                                        const target = config.targetSize / 1024;
                                        const reduction = ((original - target) / original) * 100;
                                        const isReduction = reduction > 0;
                                        
                                        return isReduction ? (
                                            <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                                Target: ~{target.toFixed(0)} KB 
                                                <span className="text-xs bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded">
                                                    -{reduction.toFixed(0)}%
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 font-medium">No reduction</span>
                                        );
                                    })()}
                                </div>
                                {config.targetSize < files[0].size * 0.2 && (
                                    <p className="text-xs text-amber-500 mt-1 font-medium">
                                        ⚠️ Aggressive compression may reduce readability.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {mode === 'merge' && (
                    <div className="space-y-4">
                         <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                💡 Use <span className="font-bold">Up/Down arrows</span> to set merge order.
                            </p>
                            
                            {/* Add Files Button - Only in Merge Section */}
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-100 dark:border-slate-700 shadow-sm transition-all"
                            >
                                <Plus size={14} /> Add Files
                            </button>
                            <input 
                                type="file" 
                                multiple 
                                accept="application/pdf"
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleAddFiles}
                            />
                         </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
                            {files.map((file, index) => (
                                <FileItem 
                                    key={file.id || index} // Fallback index if id missing (safety)
                                    index={index}
                                    total={files.length}
                                    file={file}
                                    onMove={moveFile}
                                    onRemove={removeFile}
                                />
                            ))}
                        </div>
                    </div>
                )}

                
                {mode === 'image-to-pdf' && (
                    <div className="text-center text-gray-500 py-4">
                        <p>Convert your screenshots or photos into a single PDF.</p>
                        <p className="text-xs mt-1">Supports JPG, PNG.</p>
                    </div>
                )}

                {mode === 'split' && (
                    <div className="space-y-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-lg text-sm border border-purple-100 dark:border-purple-800">
                            Extract specific pages or ranges to a new PDF.
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Page Ranges</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-gray-300 dark:placeholder-gray-600
                                           bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white"
                                placeholder="e.g. 1-5, 8, 11-13"
                                value={config.split?.pages || ''}
                                onChange={(e) => setConfig({...config, split: {...config.split, pages: e.target.value}})}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-4">
                                Click pages below to select, or type ranges above.
                            </p>
                            
                            {/* Visual Selector */}
                            {files && files.length > 0 && files[0].type === 'application/pdf' && (
                                <div className="max-h-[400px] overflow-y-auto p-2 border rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 custom-scrollbar">
                                    <PageGrid 
                                        file={files[0]} 
                                        mode="split" 
                                        initialSelection={config.split?.pages}
                                        onChange={(val) => setConfig({...config, split: {...config.split, pages: val}})}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {mode === 'organise' && (
                    <div className="space-y-4">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 rounded-lg text-sm border border-orange-100 dark:border-orange-800">
                            Reorder pages in your PDF.
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Page Order</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-gray-300 dark:placeholder-gray-600
                                           bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white"
                                placeholder="e.g. 1, 3, 2, 4"
                                value={config.organise?.pageOrder || ''}
                                onChange={(e) => setConfig({...config, organise: {...config.organise, pageOrder: e.target.value}})}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-4">
                                Drag pages below to reorder.
                            </p>

                            {/* Visual Sorter */}
                            {files && files.length > 0 && files[0].type === 'application/pdf' && (
                                <div className="max-h-[400px] overflow-y-auto p-4 border rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 custom-scrollbar">
                                    <PageGrid 
                                        file={files[0]} 
                                        mode="organise" 
                                        onChange={(val) => setConfig({...config, organise: {...config.organise, pageOrder: val}})}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {mode === 'rotate' && (
                    <div className="space-y-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 rounded-lg text-sm border border-indigo-100 dark:border-indigo-800">
                            Rotate individual pages.
                        </div>
                        {files && files.length > 0 && files[0].type === 'application/pdf' && (
                            <div className="max-h-[400px] overflow-y-auto p-4 border rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border-gray-200 dark:border-slate-700 custom-scrollbar">
                                <PageGrid 
                                    file={files[0]} 
                                    mode="rotate" 
                                    onChange={(val) => setConfig({...config, rotate: { rotations: val }})}
                                />
                            </div>
                        )}
                    </div>
                )}

                {mode === 'pdf-to-word' && (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                        <p>Convert your PDF into an editable Word document.</p>
                        <p className="text-xs mt-1">Uses LibreOffice for high-quality conversion.</p>
                    </div>
                )}




            </div>
        </div>
    );
};

export default ToolConfig;
