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
                border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                ${processing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-blue-50 rounded-full text-primary">
                    <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">
                    {isDragActive ? 'Drop files here' : 'Click to upload or drag & drop'}
                </h3>
                <p className="text-sm text-gray-500">PDFs or Images (JPG/PNG)</p>
            </div>
        </div>
    );
};

export default UploadArea;
