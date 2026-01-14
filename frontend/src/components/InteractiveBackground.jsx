import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// Sub-component to safely use hooks per particle
const Particle = ({ p, mouseX, mouseY }) => {
    // Hooks MUST be at the top level of a component
    const x = useTransform(mouseX, [-500, 500], [p.x * -0.5, p.x * 0.5]);
    const y = useTransform(mouseY, [-500, 500], [p.y * -0.5, p.y * 0.5]);

    return (
        <motion.div
            className="absolute rounded-full bg-blue-300/40 dark:bg-blue-500/30"
            style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                x, 
                y,
            }}
            animate={{
                y: [0, -100, 0],
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
            }}
            transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        />
    );
};

const InteractiveBackground = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 50 };
    const x1 = useSpring(mouseX, springConfig);
    const y1 = useSpring(mouseY, springConfig);
    const x2 = useSpring(mouseX, { ...springConfig, damping: 30 });
    const y2 = useSpring(mouseY, { ...springConfig, damping: 30 });

    const [particles, setParticles] = useState([]);
    useEffect(() => {
        const newParticles = Array.from({ length: 15 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 6 + 2,
            duration: Math.random() * 20 + 10,
        }));
        setParticles(newParticles);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            const x = clientX - innerWidth / 2;
            const y = clientY - innerHeight / 2;
            mouseX.set(x);
            mouseY.set(y);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            {/* 1. Large Gradient Blobs */}
            <motion.div 
                style={{ x: x1, y: y1 }}
                className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-blue-500/30 dark:bg-blue-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse-slow" 
            />
            <motion.div 
                style={{ x: x2, y: y2 }}
                className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-purple-500/30 dark:bg-purple-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen"
            />

            {/* 2. Static Ambient Light */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-200/20 dark:bg-indigo-900/10 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-sky-200/20 dark:bg-sky-900/10 rounded-full blur-[150px]" />

            {/* 3. Floating Particles Layer */}
            {particles.map((p) => (
                <Particle key={p.id} p={p} mouseX={mouseX} mouseY={mouseY} />
            ))}
        </div>
    );
};

export default InteractiveBackground;
