import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

const UploadArea = ({ onFilesSelected, processing }) => {
    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles?.length) {
            onFilesSelected(acceptedFiles);
        }
    }, [onFilesSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop, 
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        },
        disabled: processing
    });

    return (
        <div 
            {...getRootProps()} 
            className={`
                relative overflow-hidden group cursor-pointer transition-all duration-300
                border-2 border-dashed rounded-3xl p-10 text-center
                ${isDragActive 
                    ? 'border-primary bg-blue-50/90 dark:bg-blue-900/40' 
                    : 'border-slate-300 dark:border-slate-600 hover:border-primary/60 dark:hover:border-primary/60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm'
                }
                ${processing ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
            `}
        >
            <input {...getInputProps()} />
            
            {/* Animated Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative flex flex-col items-center gap-4 z-10">
                <div className={`
                    p-6 rounded-2xl transition-all duration-300 shadow-xl
                    ${isDragActive ? 'bg-primary text-white scale-110' : 'bg-white dark:bg-slate-700 text-primary dark:text-blue-400 group-hover:scale-105 group-hover:-translate-y-1'}
                `}>
                    <UploadCloud size={48} strokeWidth={1.5} />
                </div>
                
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">
                        {isDragActive ? 'Drop it like it\'s hot!' : 'Upload Documents'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Drag & drop or click to browse
                    </p>
                </div>

                <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold border border-red-100 dark:border-red-800">
                        PDF
                    </span>
                    <span className="px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold border border-purple-100 dark:border-purple-800">
                        JPG
                    </span>
                    <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800">
                        PNG
                    </span>
                </div>
            </div>
        </div>
    );
};

export default UploadArea;
