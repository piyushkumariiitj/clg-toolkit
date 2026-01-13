import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source - using local build via Vite to match version exactly
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const Preview = ({ fileUrl }) => {
    const canvasRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const renderPage = async () => {
            if (!fileUrl) return;
            
            try {
                setLoading(true);
                setError(null);
                
                // Load the document
                const loadingTask = pdfjsLib.getDocument(fileUrl);
                const pdf = await loadingTask.promise;
                
                // Get first page
                const page = await pdf.getPage(1);
                
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                
                // Calculate scale to fit container (approx width 600px ?)
                // We'll use a fixed scale or container width approach.
                // Let's render at scale 1.5 for quality, then CSS scales it down.
                const viewport = page.getViewport({ scale: 1.5 });
                
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;
                setLoading(false);
            } catch (err) {
                console.error("Preview error:", err);
                setError("Failed to load PDF preview");
                setLoading(false);
            }
        };

        renderPage();
    }, [fileUrl]);

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-[300px]">
            {loading && <div className="text-gray-500 animate-pulse">Loading preview...</div>}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <canvas 
                ref={canvasRef} 
                className={`max-w-full h-auto shadow-lg rounded-md ${loading ? 'hidden' : 'block'}`}
            />
        </div>
    );
};

export default Preview;
