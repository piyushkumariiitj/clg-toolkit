import React, { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Reorder, useDragControls } from 'framer-motion';
import { CheckCircle, GripVertical, Trash2 } from 'lucide-react';

// Common Worker Setup (Reusing the fix from Preview.jsx)
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PageGrid = ({ file, mode, onChange, initialOrder, initialSelection }) => {
    const [pages, setPages] = useState([]); // Array of { pageNum: 1, image: "data:..." }
    const [loading, setLoading] = useState(true);
    // Local state for 'Organise' (Reordering) - effectively the current visual list
    const [orderedPages, setOrderedPages] = useState([]); 
    // Local state for 'Split' (Selection) - Set of selected page numbers
    const [selected, setSelected] = useState(new Set(initialSelection ? initialSelection.split(',').map(Number).filter(n => n) : []));

    useEffect(() => {
        if (!file) return;

        const loadPdf = async () => {
            setLoading(true);
            try {
                const url = URL.createObjectURL(file);
                const loadingTask = pdfjsLib.getDocument(url);
                const pdf = await loadingTask.promise;
                const numPages = pdf.numPages;
                const loadedPages = [];

                // Render all pages (Thumbnail size)
                // Note: For large PDFs (50+ pages), this loop should be optimized/chunked.
                // For this toolkit, we assume reasonable usage (<20 pages usually).
                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 0.3 }); // Small thumbnail
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({ canvasContext: context, viewport }).promise;
                    loadedPages.push({
                        id: `page-${i}`, // Unique ID for framer-motion reorder
                        pageNum: i,
                        image: canvas.toDataURL(),
                        width: viewport.width,
                        height: viewport.height
                    });
                }

                setPages(loadedPages);
                // For organise: start with 1,2,3... default order
                if (mode === 'organise') {
                    // checks if we have an existing verified order string, else default
                    setOrderedPages(loadedPages);
                } else {
                     setOrderedPages(loadedPages); // Split just shows in order
                }

                setLoading(false);
            } catch (err) {
                console.error("Grid load failed", err);
                setLoading(false);
            }
        };

        loadPdf();
    }, [file]);

    // Handle Split Toggle
    const toggleSelection = (pageNum) => {
        const newSet = new Set(selected);
        if (newSet.has(pageNum)) newSet.delete(pageNum);
        else newSet.add(pageNum);
        setSelected(newSet);
        
        // Output format: "1,3,5"
        const sorted = Array.from(newSet).sort((a,b) => a-b);
        onChange(sorted.join(', '));
    };

    // Handle Reorder Update
    const onReorder = (newOrder) => {
        setOrderedPages(newOrder);
        // Output format: "1,3,2,4" (The page numbers in their new visual positions)
        const orderString = newOrder.map(p => p.pageNum).join(', ');
        onChange(orderString);
    };
    
    // Handle Delete (Organise Mode)
    const removePage = (id) => {
         const newOrder = orderedPages.filter(p => p.id !== id);
         onReorder(newOrder);
    };

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Generated thumbnails...</div>;

    if (mode === 'organise') {
        return (
            <div className="select-none">
                 <p className="text-xs text-gray-500 mb-3 text-center">Drag to reorder. Click trash to remove.</p>
                <Reorder.Group 
                    axis="y" 
                    values={orderedPages} 
                    onReorder={onReorder} 
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                    layoutScroll
                >
                    {orderedPages.map((page) => (
                        <Reorder.Item key={page.id} value={page} className="relative group touch-none cursor-grab active:cursor-grabbing">
                            <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">
                                <span className="absolute top-1 left-2 text-xs font-bold text-gray-400 bg-white/80 px-1 rounded">
                                    P{page.pageNum}
                                </span>
                                <button 
                                    onClick={() => removePage(page.id)}
                                    className="absolute top-1 right-1 p-1 text-red-400 hover:text-red-600 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <img src={page.image} alt={`Page ${page.pageNum}`} className="w-full h-auto rounded border border-gray-100" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                     <GripVertical className="text-gray-800 bg-white/50 rounded-full p-1 w-8 h-8" />
                                </div>
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            </div>
        );
    }

    // Split Mode (Selection Grid)
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 select-none">
            {pages.map((page) => {
                const isSelected = selected.has(page.pageNum);
                return (
                    <div 
                        key={page.id}
                        onClick={() => toggleSelection(page.pageNum)}
                        className={`
                            relative cursor-pointer rounded-lg border-2 p-2 transition-all
                            ${isSelected ? 'border-primary bg-blue-50/30' : 'border-transparent hover:bg-gray-50'}
                        `}
                    >
                         <div className={`absolute top-2 right-2 z-10 ${isSelected ? 'text-primary' : 'text-gray-200'}`}>
                            <CheckCircle size={20} fill={isSelected ? "currentColor" : "none"} className={isSelected ? "bg-white rounded-full" : ""}/>
                         </div>
                         <img 
                            src={page.image} 
                            alt={`Page ${page.pageNum}`} 
                            className={`w-full h-auto rounded shadow-sm transition-opacity ${isSelected ? 'opacity-100' : 'opacity-70 grayscale-[0.3]'}`} 
                        />
                        <p className="text-center text-xs font-medium text-gray-500 mt-2">Page {page.pageNum}</p>
                    </div>
                );
            })}
        </div>
    );
};

export default PageGrid;
