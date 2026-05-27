import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const pTimer = setTimeout(() => setProgress(100), 80);
    const exitTimer = setTimeout(() => setExiting(true), 2000);
    return () => {
      clearTimeout(pTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!exiting ? (
        <motion.div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-app overflow-hidden"
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
            animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-10"
            style={{
              background: "radial-gradient(circle, #6400ff, transparent 70%)",
              right: "15%",
              bottom: "20%",
            }}
            animate={{ x: [0, -15, 10, 0], y: [0, 20, -10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />

          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }} />

          <div className="relative flex flex-col items-center">
            <motion.div
              className="relative w-16 h-16 mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                className="absolute inset-0 rounded-full border border-[var(--text)]/20"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-2 rounded-full border border-[var(--text)]/10"
                animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ fontFamily: '"Instrument Serif", serif', fontStyle: "italic" }}
              >
                <motion.span
                  className="text-2xl text-app"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  jd
                </motion.span>
              </div>
            </motion.div>

            <motion.div
              className="w-32 h-px bg-[var(--text)]/10 rounded-full overflow-hidden mb-4"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-[#ff0064] via-[#6400ff] to-[#0096ff]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.div>

            <motion.p
              className="text-[10px] tracking-[0.3em] uppercase text-[var(--text)]/20 font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              loading
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
