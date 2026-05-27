import { Children, cloneElement, forwardRef, isValidElement, useCallback, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';

const makeSlot = (i, distX, distY, total) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i
});

const placeNow = (el, slot, skew) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });

export const Card = forwardRef(({ customClass, ...rest }, ref) => (
  <div
    ref={ref}
    {...rest}
    className={`absolute top-1/2 left-1/2 rounded-xl border border-app bg-card shadow-lg [transform-style:preserve-3d] [will-change:transform] [backface-visibility:hidden] ${customClass ?? ''} ${rest.className ?? ''}`.trim()}
  />
));

Card.displayName = 'Card';

export default function CardSwap({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  children
}) {
  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2
        };

  const childArr = useMemo(() => Children.toArray(children), [children]);

  const refs = useMemo(
    () => childArr.map(() => ({ current: null })),
    [childArr.length]
  );

  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));
  const tlRef = useRef(null);
  const intervalRef = useRef(0);
  const container = useRef(null);
  const expandedRef = useRef(-1);
  const savedSlots = useRef([]);

  const collapseCard = useCallback((cb) => {
    const idx = expandedRef.current;
    if (idx < 0) { cb?.(); return; }
    expandedRef.current = -1;
    const el = refs[idx].current;
    if (!el) { cb?.(); return; }
    const slot = savedSlots.current[idx];
    gsap.to(el, {
      x: slot.x,
      y: slot.y,
      z: slot.z,
      scale: 1,
      width,
      height,
      duration: 0.5,
      ease: 'power3.out',
      clearProps: 'position,top,left',
      onComplete: () => {
        gsap.set(el, { clearProps: 'position,top,left,zIndex' });
        cb?.();
      }
    });
  }, [width, height, refs]);

  const expandCard = useCallback((idx) => {
    if (expandedRef.current >= 0) return;
    const el = refs[idx].current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scaleX = (vw * 0.85) / rect.width;
    const scaleY = (vh * 0.8) / rect.height;
    const scale = Math.min(scaleX, scaleY, 1.8);
    expandedRef.current = idx;
    gsap.to(el, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      xPercent: -50,
      yPercent: -50,
      x: 0,
      y: 0,
      z: 0,
      scale,
      width: rect.width,
      height: rect.height,
      zIndex: 9999,
      duration: 0.6,
      ease: 'power3.out',
      overwrite: 'auto'
    });
  }, [refs]);

  useEffect(() => {
    const total = refs.length;
    if (total === 0) return;

    refs.forEach((r, i) => {
      if (r.current) {
        const slot = makeSlot(i, cardDistance, verticalDistance, total);
        savedSlots.current[i] = slot;
        placeNow(r.current, slot, skewAmount);
      }
    });

    const swap = () => {
      if (order.current.length < 2) return;
      collapseCard(() => {
        const [front, ...rest] = order.current;
        const elFront = refs[front].current;
        if (!elFront) return;

        const tl = gsap.timeline();
        tlRef.current = tl;

        tl.to(elFront, {
          y: '+=500',
          duration: config.durDrop,
          ease: config.ease
        });

        tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
        rest.forEach((idx, i) => {
          const el = refs[idx].current;
          if (!el) return;
          const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
          savedSlots.current[idx] = slot;
          tl.set(el, { zIndex: slot.zIndex }, 'promote');
          tl.to(
            el,
            {
              x: slot.x,
              y: slot.y,
              z: slot.z,
              duration: config.durMove,
              ease: config.ease
            },
            `promote+=${i * 0.15}`
          );
        });

        const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
        savedSlots.current[front] = backSlot;
        tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
        tl.call(
          () => {
            gsap.set(elFront, { zIndex: backSlot.zIndex });
          },
          undefined,
          'return'
        );

        tl.to(
          elFront,
          {
            x: backSlot.x,
            y: backSlot.y,
            z: backSlot.z,
            duration: config.durReturn,
            ease: config.ease
          },
          'return'
        );

        tl.call(() => {
          order.current = [...rest, front];
        });
      });
    };

    intervalRef.current = window.setInterval(swap, delay);

    if (pauseOnHover && container.current) {
      const node = container.current;
      const pause = () => {
        tlRef.current?.pause();
        clearInterval(intervalRef.current);
      };
      const resume = () => {
        tlRef.current?.play();
        intervalRef.current = window.setInterval(swap, delay);
      };
      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);
      return () => {
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
        clearInterval(intervalRef.current);
      };
    }

    return () => clearInterval(intervalRef.current);
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing, refs, collapseCard]);

  const rendered = childArr.map((child, i) =>
    isValidElement(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: (e) => {
            child.props.onClick?.(e);
            if (expandedRef.current === i) {
              collapseCard(() => {});
            } else if (expandedRef.current < 0 && order.current[0] === i) {
              expandCard(i);
            }
            onCardClick?.(i);
          }
        })
      : child
  );

  return (
    <div
      ref={container}
      className="relative perspective-[1200px] transform-gpu"
      style={{ width, height }}
    >
      <div className="absolute inset-0 [transform-style:preserve-3d]">
        {rendered}
      </div>
    </div>
  );
}
