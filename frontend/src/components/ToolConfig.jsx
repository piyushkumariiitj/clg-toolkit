import React from 'react';

const ToolConfig = ({ mode, setMode, config, setConfig, processing }) => {
    
    const tabs = [
        { id: 'compress', label: 'Compress' },
        { id: 'merge', label: 'Merge' },
        { id: 'rename', label: 'Rename' },
        { id: 'image-to-pdf', label: 'Img > PDF' },
        { id: 'metadata', label: 'Metadata' }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setMode(tab.id)}
                        disabled={processing}
                        className={`
                            flex-1 min-w-[100px] py-4 text-sm font-medium transition-colors whitespace-nowrap
                            ${mode === tab.id ? 'text-primary border-b-2 border-primary bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}
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

                {mode === 'rename' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Roll Number</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="12345"
                                    value={config.rename?.rollNo || ''}
                                    onChange={(e) => setConfig({...config, rename: {...config.rename, rollNo: e.target.value}})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="CS101"
                                    value={config.rename?.subject || ''}
                                    onChange={(e) => setConfig({...config, rename: {...config.rename, subject: e.target.value}})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                                <select 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={config.rename?.type || 'ASSIGNMENT'}
                                    onChange={(e) => setConfig({...config, rename: {...config.rename, type: e.target.value}})}
                                >
                                    <option value="ASSIGNMENT">Assignment</option>
                                    <option value="LAB">Lab Record</option>
                                    <option value="PROJECT">Project Report</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                                <input 
                                    type="date" 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={config.rename?.date || ''}
                                    onChange={(e) => setConfig({...config, rename: {...config.rename, date: e.target.value}})}
                                />
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                             <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Preview</p>
                             <p className="font-mono text-sm text-gray-700 font-medium">
                                {config.rename?.rollNo || 'ROLL'}_{config.rename?.subject || 'SUB'}_{config.rename?.type || 'TYPE'}_{config.rename?.date || 'DATE'}.pdf
                             </p>
                        </div>
                    </div>
                )}

                {mode === 'metadata' && (
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm mb-4">
                            Remove "scanned by camscanner" tags and set yourself as the author.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Assignment 1"
                                    value={config.metadata?.title || ''}
                                    onChange={(e) => setConfig({...config, metadata: {...config.metadata, title: e.target.value}})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Author</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Your Name"
                                    value={config.metadata?.author || ''}
                                    onChange={(e) => setConfig({...config, metadata: {...config.metadata, author: e.target.value}})}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Keywords (comma separated)</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="college, assignment, submission"
                                    value={config.metadata?.keywords || ''}
                                    onChange={(e) => setConfig({...config, metadata: {...config.metadata, keywords: e.target.value}})}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToolConfig;
