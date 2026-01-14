import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQItem = ({ question, answer, isOpen, onClick }) => {
    return (
        <div className="border-b border-gray-200 dark:border-slate-700 last:border-0">
            <button 
                onClick={onClick}
                className="w-full flex items-start gap-4 py-6 text-left group transition-colors"
            >
                <div className={`mt-1 text-blue-600 dark:text-blue-400 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}>
                    <ChevronRight size={20} />
                </div>
                <div className="flex-1">
                    <h3 className={`text-lg font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${isOpen ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {question}
                    </h3>
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <p className="pt-3 text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                                    {answer}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </button>
        </div>
    );
};

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(0);

    const questions = [
        {
            q: "How do I reduce a PDF below 200KB?",
            a: "Upload your file and select the 'College Portal (≤200KB)' preset. Our algorithm aggressively compresses images and removes unseen metadata to meet strict upload limits without making text unreadable."
        },
        {
            q: "Will my handwriting remain readable?",
            a: "Yes. We use intelligent compression that prioritizes high-contrast areas like text and ink. While the file size drops by up to 90%, your handwriting remains sharp enough for professors to grade."
        },
        {
            q: "Can I compress for Google Classroom?",
            a: "Absolutely. Use the 'Email Ready (≤1MB)' preset. It's optimized to prevent timeout errors on slow connections while keeping the quality perfect for screen reading."
        },
        {
            q: "Is it safe to upload my homework?",
            a: "Yes. Your privacy is our priority. Files are processed securely on encrypted servers and are automatically deleted after 5 minutes. We never store, read, or share your assignments."
        },
        {
            q: "Can I combine multiple lab reports?",
            a: "Yes. Switch to the 'Merge' tool, select your PDF files or images, arrange them in the correct order, and download them as a single submission file."
        },
        {
            q: "Does this work on mobile?",
            a: "Yes! The toolkit is fully responsive and optimized for touch. You can snap photos of your work, convert them to PDF, and compress them directly from your iPhone, iPad, or Android device."
        },
        {
            q: "How do I convert photos to PDF?",
            a: "Simply drag and drop your JPG or PNG images onto the upload area. The tool automatically detects image files and switches to 'Image to PDF' mode."
        },
        {
            q: "Is there a file limit?",
            a: "You can process files up to 50MB per document. This generous limit covers almost all scanned assignments, long lab manuals, and even graphics-heavy project reports."
        }
    ];

    return (
        <section className="max-w-[1600px] mx-auto mt-32 px-6 md:px-12 pb-20">
            <div className="grid md:grid-cols-12 gap-12 lg:gap-20">
                {/* Title Column */}
                <div className="md:col-span-4 lg:col-span-3">
                    <div className="sticky top-10">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
                            Frequently Asked <br className="hidden md:block"/> Questions
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Everything you need to know about preparing your files for submission.
                        </p>
                    </div>
                </div>

                {/* Questions Column */}
                <div className="md:col-span-8 lg:col-span-9 bg-white dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                    {questions.map((item, index) => (
                        <FAQItem 
                            key={index}
                            question={item.q}
                            answer={item.a}
                            isOpen={openIndex === index}
                            onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
