import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import p5 from 'p5';

export default function ForceFieldLoader({ onComplete }) {
  const containerRef = useRef(null);
  const p5Ref = useRef(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p) => {
      let points = [];
      let palette = [];

      function generatePalette() {
        palette = [];
        p.push();
        p.colorMode(p.HSL);
        for (let i = 0; i < 12; i++) {
          let lightness = p.map(i, 0, 11, 95, 10);
          palette.push(p.color(210, 100, lightness));
        }
        p.pop();
      }

      function generatePoints() {
        points = [];
        const spacing = 12;
        for (let y = 0; y < p.height + spacing; y += spacing) {
          for (let x = 0; x < p.width + spacing; x += spacing) {
            if (p.random() > 0.55) continue;
            let nx = p.noise(x * 0.004, y * 0.004) - 0.5;
            let ny = p.noise((x + 500) * 0.004, (y + 500) * 0.004) - 0.5;
            let px = x + nx * spacing * 0.8;
            let py = y + ny * spacing * 0.8;
            points.push({
              pos: p.createVector(px, py),
              originalPos: p.createVector(px, py),
              vel: p.createVector(0, 0),
              brightness: p.map(p.noise(x * 0.008, y * 0.008), 0, 1, 30, 240),
            });
          }
        }
      }

      p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight);
        generatePalette();
        generatePoints();
        setReady(true);
      };

      p.draw = () => {
        p.background(0);

        const mx = p.mouseX || p.width / 2;
        const my = p.mouseY || p.height / 2;

        for (let pt of points) {
          let dir = p5.Vector.sub(pt.pos, p.createVector(mx, my));
          let d = dir.mag();

          if (d < 200) {
            dir.normalize();
            let force = dir.mult(8 / Math.max(1, d));
            pt.vel.add(force);
          }

          pt.vel.mult(0.92);
          let restore = p5.Vector.sub(pt.pos, pt.originalPos).mult(-0.04);
          pt.vel.add(restore);
          pt.pos.add(pt.vel);

          let shadeIndex = Math.floor(p.map(pt.brightness, 0, 255, 0, palette.length - 1));
          shadeIndex = p.constrain(shadeIndex, 0, palette.length - 1);
          let strokeSize = p.map(pt.brightness, 0, 255, 1.5, 5);

          if (palette[shadeIndex]) {
            p.stroke(palette[shadeIndex]);
            p.strokeWeight(strokeSize);
            p.point(pt.pos.x, pt.pos.y);
          }
        }
      };

      p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
        generatePoints();
      };
    };

    const myP5 = new p5(sketch, containerRef.current);
    p5Ref.current = myP5;

    const progressTimer = setTimeout(() => setProgress(100), 100);
    const exitTimer = setTimeout(() => setExiting(true), 2200);

    return () => {
      myP5.remove();
      clearTimeout(progressTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!exiting ? (
        <motion.div
          className="fixed inset-0 z-[99999]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div ref={containerRef} className="absolute inset-0" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xs uppercase tracking-[0.3em] mb-6 text-white/25 font-mono"
            >
              AI-Powered Job Analysis
            </motion.p>
            <h1 className="text-[clamp(44px,10vw,120px)] font-black tracking-tight leading-[0.85] mix-blend-difference">
              <span className="text-white">DEC</span>
              <span className="relative inline-block w-[0.5em] h-[0.5em] align-middle mx-1">
                <motion.span
                  className="absolute inset-0 border-[1.5px] border-white/70 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.span
                  className="absolute inset-[25%] bg-white/80 rounded-full"
                  animate={{ scale: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </span>
              <span className="text-white">DE</span>
            </h1>
            <motion.div
              className="mt-12 w-32 h-[2px] bg-white/5 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-[#ff0064] via-[#6400ff] to-[#0096ff]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-white/20 text-[10px] tracking-[0.3em] uppercase font-mono mt-3"
            >
              Initializing
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
