import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle, X } from 'lucide-react';

// Common Worker Setup
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// --- Helper: Parse Ranges like "1-3, 5" into [1, 2, 3, 5] ---
const parsePageRange = (input) => {
    if (!input) return new Set();
    const result = new Set();
    try {
        const parts = input.split(',');
        for (const part of parts) {
            const p = part.trim();
            if (p.includes('-')) {
                const [start, end] = p.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end) && start <= end) {
                    for (let i = start; i <= end; i++) result.add(i);
                }
            } else {
                const num = parseInt(p);
                if (!isNaN(num)) result.add(num);
            }
        }
    } catch(e) { console.error("Parse error", e); }
    return result;
};

// --- Sub-Component: Sortable Item ---
const SortablePage = ({ page, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 999 : 1,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group cursor-grab touch-none">
             <div className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">
                <span className="absolute top-1 left-2 text-xs font-bold text-gray-400 bg-white/80 px-1 rounded z-10">
                    P{page.pageNum}
                </span>
                <button 
                    onPointerDown={(e) => { e.stopPropagation(); onRemove(page.id); }} // Prevent drag start on click
                    className="absolute top-1 right-1 p-1 text-red-400 hover:text-red-600 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                >
                    <X size={14} />
                </button>
                <img src={page.image} alt={`Page ${page.pageNum}`} className="w-full h-auto rounded border border-gray-100 select-none pointer-events-none" />
            </div>
        </div>
    );
};

// --- Main Grid ---
const PageGrid = ({ file, mode, onChange, initialSelection }) => {
    const [pages, setPages] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(new Set());
    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

    // Load PDF
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

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 0.3 });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    await page.render({ canvasContext: context, viewport }).promise;
                    loadedPages.push({ id: `page-${i}`, pageNum: i, image: canvas.toDataURL() });
                }
                setPages(loadedPages);
            } finally { setLoading(false); }
        };
        loadPdf();
    }, [file]);

    // Sync external "1-5" string to internal Selection Set
    useEffect(() => {
        if (mode === 'split') {
            setSelected(parsePageRange(initialSelection));
        }
    }, [initialSelection, mode]);

    // Split: Toggle Logic
    const togglePage = (pageNum) => {
        const newSet = new Set(selected);
        if (newSet.has(pageNum)) newSet.delete(pageNum);
        else newSet.add(pageNum);
        
        setSelected(newSet); // Optimistic UI
        // Update parent with sorted list
        const sorted = Array.from(newSet).sort((a,b) => a-b);
        onChange(sorted.join(', '));
    };

    // Organise: Drag Logic
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setPages((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                
                onChange(newOrder.map(p => p.pageNum).join(', ')); // Propagate change
                return newOrder;
            });
        }
    };

    const handleRemove = (id) => {
        setPages(prev => {
            const newOrder = prev.filter(p => p.id !== id);
            onChange(newOrder.map(p => p.pageNum).join(', '));
            return newOrder;
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Generating thumbnails...</div>;

    // --- Mode: ORGANISE (Drag & Drop) ---
    if (mode === 'organise') {
        return (
            <div className="select-none">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={pages} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {pages.map((page) => (
                                <SortablePage key={page.id} page={page} onRemove={handleRemove} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-400">
                        {pages.length} pages remaining
                    </p>
                </div>
            </div>
        );
    }

    // --- Mode: SPLIT (Selection) ---
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 select-none">
            {pages.map((page) => {
                const isSelected = selected.has(page.pageNum);
                return (
                    <div 
                        key={page.id}
                        onClick={() => togglePage(page.pageNum)}
                        className={`
                            relative cursor-pointer rounded-lg border-2 p-2 transition-all duration-200
                            ${isSelected ? 'border-primary bg-blue-50/50 shadow-md transform scale-[1.02]' : 'border-transparent hover:bg-gray-50'}
                        `}
                    >
                         <div className={`absolute top-2 right-2 z-10 transition-colors ${isSelected ? 'text-primary' : 'text-gray-200'}`}>
                            <CheckCircle size={20} fill={isSelected ? "currentColor" : "white"} className={isSelected ? "text-white" : ""}/>
                         </div>
                         <img 
                            src={page.image} 
                            alt={`Page ${page.pageNum}`} 
                            className={`w-full h-auto rounded shadow-sm transition-all ${isSelected ? 'opacity-100' : 'opacity-60 grayscale-[0.5]'}`} 
                        />
                        <p className={`text-center text-xs font-medium mt-2 ${isSelected ? 'text-primary' : 'text-gray-400'}`}>
                            Page {page.pageNum}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};

export default PageGrid;
