import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener("mousemove", onMove);

    const pTimer = setTimeout(() => setProgress(100), 80);
    const exitTimer = setTimeout(() => setExiting(true), 1800);

    return () => {
      window.removeEventListener("mousemove", onMove);
      clearTimeout(pTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  const decChars = "DEC".split("");
  const deChars = "DE".split("");

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!exiting ? (
        <motion.div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-15"
            style={{
              background: "radial-gradient(circle, #ff0064, transparent 70%)",
              left: "10%",
              top: "15%",
            }}
            animate={{
              x: [0, 20, -10, 0],
              y: [0, -15, 10, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-10"
            style={{
              background: "radial-gradient(circle, #6400ff, transparent 70%)",
              right: "15%",
              bottom: "20%",
            }}
            animate={{
              x: [0, -15, 10, 0],
              y: [0, 20, -10, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full blur-[80px] opacity-8"
            style={{
              background: "radial-gradient(circle, #0096ff, transparent 70%)",
              left: "50%",
              top: "60%",
            }}
            animate={{
              x: [0, 10, -15, 0],
              y: [0, -10, 15, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }} />

          <motion.div
            className="flex items-center justify-center gap-1 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <motion.div
              className="w-1 h-1 rounded-full bg-[#ff0064]"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs uppercase tracking-[0.3em] text-white/25 font-mono mx-2">
              AI-Powered Job Analysis
            </span>
            <motion.div
              className="w-1 h-1 rounded-full bg-[#0096ff]"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </motion.div>

          <h1 className="text-[clamp(44px,10vw,120px)] font-black tracking-tight leading-[0.85] mb-10 flex items-center justify-center">
            {decChars.map((ch, i) => (
              <motion.span
                key={`dec-${i}`}
                className="text-white inline-block"
                initial={{ opacity: 0, y: 60, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {ch}
              </motion.span>
            ))}
            <motion.span
              className="relative inline-block w-[0.5em] h-[0.5em] align-middle mx-2"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.65, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.span
                className="absolute inset-0 border-[1.5px] border-white/60 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.span
                className="absolute inset-[25%] bg-white/70 rounded-full"
                animate={{ scale: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.span>
            {deChars.map((ch, i) => (
              <motion.span
                key={`de-${i}`}
                className="text-white inline-block"
                initial={{ opacity: 0, y: 60, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 0.65 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>

          <motion.div
            className="w-40 h-[2px] bg-white/5 rounded-full overflow-hidden"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 160 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-[#ff0064] via-[#6400ff] to-[#0096ff]"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="text-white/15 text-[10px] tracking-[0.3em] uppercase font-mono mt-4"
          >
            Initializing
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
