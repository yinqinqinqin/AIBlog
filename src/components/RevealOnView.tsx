import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

type RevealOnViewProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  enabled?: boolean;
  margin?: string;
  amount?: number;
};

export default function RevealOnView({
  children,
  className,
  delay = 0,
  enabled = true,
  margin = "0px 0px 0px 0px",
  amount = 0,
}: RevealOnViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const canObserveViewport = typeof IntersectionObserver !== "undefined";
  const [isVisible, setIsVisible] = useState(() => reduceMotion || !canObserveViewport);

  useEffect(() => {
    if (reduceMotion || !canObserveViewport) {
      setIsVisible(true);
      return undefined;
    }

    if (!enabled) {
      setIsVisible(false);
      return undefined;
    }

    const node = ref.current;
    if (!node) return undefined;

    const normalizedAmount = Math.max(0, Math.min(amount, 1));
    const observer = new IntersectionObserver(
      ([entry]) => {
        const rootBottom = entry.rootBounds?.bottom ?? window.innerHeight;
        const rootTop = entry.rootBounds?.top ?? 0;
        const topHasReachedViewport =
          normalizedAmount === 0 && entry.boundingClientRect.top <= rootBottom && entry.boundingClientRect.bottom >= rootTop;
        const hasMetRatio = normalizedAmount > 0 && entry.intersectionRatio >= normalizedAmount;

        if (entry.isIntersecting || topHasReachedViewport || hasMetRatio) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: margin,
        threshold: normalizedAmount,
      },
    );

    const frame = window.requestAnimationFrame(() => observer.observe(node));

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [amount, canObserveViewport, enabled, margin, reduceMotion]);

  return (
    <div className={className} ref={ref}>
      <motion.div
        animate={isVisible ? "visible" : "hidden"}
        initial={reduceMotion ? false : "hidden"}
        style={{ height: "100%", width: "100%" }}
        transition={{
          duration: reduceMotion ? 0 : 0.56,
          delay: reduceMotion ? 0 : delay,
          ease: [0.22, 1, 0.36, 1],
        }}
        variants={{
          hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 26, filter: "blur(10px)" },
          visible: { opacity: 1, y: 0, filter: "blur(0px)" },
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
