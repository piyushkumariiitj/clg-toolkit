import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source - using local build via Vite to match version exactly
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const Preview = ({ fileUrl }) => {
    const canvasRef = useRef(null);
    const renderTaskRef = useRef(null); // Track active render task
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const renderPage = async () => {
            if (!fileUrl) return;
            
            try {
                // Cancel previous render if active
                if (renderTaskRef.current) {
                    await renderTaskRef.current.cancel();
                }

                setLoading(true);
                setError(null);
                
                // Load the document
                const loadingTask = pdfjsLib.getDocument(fileUrl);
                const pdf = await loadingTask.promise;
                
                // Get first page
                const page = await pdf.getPage(1);
                
                const canvas = canvasRef.current;
                // Double check canvas exists (component might have unmounted)
                if (!canvas) return;

                const context = canvas.getContext('2d');
                
                // Calculate scale to fit container
                const viewport = page.getViewport({ scale: 1.5 });
                
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                
                // Store the render task
                const renderTask = page.render(renderContext);
                renderTaskRef.current = renderTask;

                await renderTask.promise;
                setLoading(false);
            } catch (err) {
                // Ignore cancellation errors
                if (err.name === 'RenderingCancelledException') {
                    // console.log('Render cancelled');
                    return;
                }
                console.error("Preview error:", err);
                setError("Failed to load PDF preview");
                setLoading(false);
            }
        };

        renderPage();

        // Cleanup on unmount or dependency change
        return () => {
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
        };
    }, [fileUrl]);

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200 min-h-[300px]">
            {loading && <div className="text-gray-500 animate-pulse">Loading preview...</div>}
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <canvas 
                key={fileUrl} // 🔑 Force re-mount on file change to ensure fresh context
                ref={canvasRef} 
                className={`max-w-full h-auto shadow-lg rounded-md ${loading ? 'hidden' : 'block'}`}
            />
        </div>
    );
};

export default Preview;
