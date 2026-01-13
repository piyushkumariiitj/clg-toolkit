import React from 'react';
import PageGrid from './PageGrid';

const ToolConfig = ({ mode, setMode, config, setConfig, processing, files }) => {
    
    // 🧠 LOGIC: Analyze files to determine available tools
    const hasPdf = files?.some(f => f.type === 'application/pdf');
    const hasImage = files?.some(f => f.type.startsWith('image/'));
    const isMixed = hasPdf && hasImage;

    const tabs = [
        { id: 'compress', label: 'Compress', disabled: hasImage }, // Tools for PDF only
        { id: 'merge', label: 'Merge', disabled: hasImage },       // Merge usually for PDFs
        { id: 'split', label: 'Split', disabled: hasImage },
        { id: 'organise', label: 'Organise', disabled: hasImage },
        { id: 'rotate', label: 'Rotate', disabled: hasImage },
        { id: 'pdf-to-word', label: 'Pdf > Word', disabled: hasImage },
        { id: 'image-to-pdf', label: 'Img > PDF', disabled: hasPdf } // Tool for Images only
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setMode(tab.id)}
                        disabled={processing || tab.disabled}
                        className={`
                            flex-1 min-w-[100px] py-4 text-sm font-medium transition-colors whitespace-nowrap
                            ${mode === tab.id ? 'text-primary border-b-2 border-primary bg-blue-50/50' : ''}
                            ${tab.disabled ? 'text-gray-300 cursor-not-allowed bg-gray-50' : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-6">
                {mode === 'compress' && (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target File Size</label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[200, 500, 1024, 2048].map(size => (
                                <button
                                    key={size}
                                    onClick={() => setConfig({...config, targetSize: size * 1024})}
                                    className={`
                                        py-2 px-3 rounded-lg border text-sm font-medium transition-all
                                        ${config.targetSize === size * 1024 ? 'border-primary bg-primary text-white shadow-md' : 'border-gray-200 text-gray-600 hover:border-gray-300'}
                                    `}
                                >
                                    {size >= 1024 ? `${size/1024} MB` : `${size} KB`}
                                </button>
                            ))}
                            <div className="relative group flex items-center col-span-2 lg:col-span-4">
                                <span className="absolute left-3 text-gray-400 text-sm">Custom:</span>
                                <input 
                                    type="number" 
                                    className="w-full pl-20 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all border-gray-200 text-gray-700" 
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
                         <p className="text-xs text-gray-500 mt-2">
                            Select a size. We'll try our best to get under this limit while preserving quality.
                        </p>
                    </div>
                )}

                {mode === 'merge' && (
                    <div className="text-center text-gray-500 py-4">
                        <p>Upload multiple files to merge them in order.</p>
                        <p className="text-xs mt-1">(Drag files to reorder feature coming soon)</p>
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
                        <div className="p-3 bg-purple-50 text-purple-800 rounded-lg text-sm">
                            Extract specific pages or ranges to a new PDF.
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Page Ranges</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-gray-300"
                                placeholder="e.g. 1-5, 8, 11-13"
                                value={config.split?.pages || ''}
                                onChange={(e) => setConfig({...config, split: {...config.split, pages: e.target.value}})}
                            />
                            <p className="text-xs text-gray-500 mt-2 mb-4">
                                Click pages below to select, or type ranges above.
                            </p>
                            
                            {/* Visual Selector */}
                            {files && files.length > 0 && files[0].type === 'application/pdf' && (
                                <div className="max-h-[400px] overflow-y-auto p-2 border rounded-xl bg-gray-50/50 custom-scrollbar">
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
                        <div className="p-3 bg-orange-50 text-orange-800 rounded-lg text-sm">
                            Reorder pages in your PDF.
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Page Order</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-gray-300"
                                placeholder="e.g. 1, 3, 2, 4"
                                value={config.organise?.pageOrder || ''}
                                onChange={(e) => setConfig({...config, organise: {...config.organise, pageOrder: e.target.value}})}
                            />
                            <p className="text-xs text-gray-500 mt-2 mb-4">
                                Drag pages below to reorder.
                            </p>

                            {/* Visual Sorter */}
                            {files && files.length > 0 && files[0].type === 'application/pdf' && (
                                <div className="max-h-[400px] overflow-y-auto p-4 border rounded-xl bg-gray-50/50 custom-scrollbar">
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
                        <div className="p-3 bg-indigo-50 text-indigo-800 rounded-lg text-sm">
                            Rotate individual pages.
                        </div>
                        {files && files.length > 0 && files[0].type === 'application/pdf' && (
                            <div className="max-h-[400px] overflow-y-auto p-4 border rounded-xl bg-gray-50/50 custom-scrollbar">
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
                    <div className="text-center text-gray-500 py-4">
                        <p>Convert your PDF into an editable Word document.</p>
                        <p className="text-xs mt-1">Uses LibreOffice for high-quality conversion.</p>
                    </div>
                )}




            </div>
        </div>
    );
};

export default ToolConfig;
