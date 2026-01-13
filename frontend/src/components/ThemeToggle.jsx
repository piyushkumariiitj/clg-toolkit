import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

const ThemeToggle = ({ theme, toggleTheme }) => {
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={`
                relative flex items-center p-2 rounded-full transition-all duration-300
                ${isDark ? 'bg-slate-700 text-yellow-400' : 'bg-blue-100 text-blue-600'}
                hover:shadow-lg active:scale-95
            `}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
            <motion.div
                initial={false}
                animate={{ rotate: isDark ? 180 : 0 }}
                transition={{ duration: 0.3 }}
            >
                {isDark ? <Moon size={20} /> : <Sun size={20} />}
            </motion.div>
        </button>
    );
};

export default ThemeToggle;
