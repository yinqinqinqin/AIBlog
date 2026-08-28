import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HeroModelScene from "@/components/HeroModelScene";
import PixelBlast from "@/components/PixelBlast";
import { useThemeStore } from "@/store/themeStore";

type HeroSectionProps = {
  title: string;
  summary: string;
};

type ParticleFocus = {
  centerX: number;
  centerY: number;
  radius: number;
};

const defaultParticleFocus: ParticleFocus = {
  centerX: 0.73,
  centerY: 0.45,
  radius: 0.5,
};

export default function HeroSection({ title, summary }: HeroSectionProps) {
  const theme = useThemeStore((state) => state.theme);
  const reduceMotion = useReducedMotion();
  const [canUsePixelBlast, setCanUsePixelBlast] = useState(false);
  const [particleFocus, setParticleFocus] = useState(defaultParticleFocus);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const heroLabRef = useRef<HTMLElement | null>(null);
  const titleLines = useMemo(() => title.split("\n"), [title]);

  useEffect(() => {
    if (
      reduceMotion ||
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      typeof WebGLRenderingContext === "undefined" ||
      /jsdom/i.test(navigator.userAgent)
    ) {
      setCanUsePixelBlast(false);
      return undefined;
    }

    const mediaQuery = window.matchMedia("(min-width: 961px) and (pointer: fine)");
    const updateAvailability = () => setCanUsePixelBlast(mediaQuery.matches);
    updateAvailability();
    mediaQuery.addEventListener("change", updateAvailability);

    return () => mediaQuery.removeEventListener("change", updateAvailability);
  }, [reduceMotion]);

  useLayoutEffect(() => {
    if (!canUsePixelBlast) {
      return undefined;
    }

    const section = heroSectionRef.current;
    const lab = heroLabRef.current;

    if (!section || !lab) {
      return undefined;
    }

    const updateParticleFocus = () => {
      const sectionRect = section.getBoundingClientRect();
      const labRect = lab.getBoundingClientRect();
      const shortestSide = Math.min(sectionRect.width, sectionRect.height);

      if (sectionRect.width <= 0 || sectionRect.height <= 0 || shortestSide <= 0) {
        return;
      }

      const centerX = (labRect.left + labRect.width / 2 - sectionRect.left) / sectionRect.width;
      const centerFromTop = (labRect.top + labRect.height / 2 - sectionRect.top) / sectionRect.height;
      const radius = Math.min(0.52, Math.max(0.12, (labRect.width * 0.96) / shortestSide));
      const nextFocus = {
        centerX: Math.min(0.94, Math.max(0.06, centerX)),
        centerY: Math.min(0.94, Math.max(0.06, 1 - centerFromTop)),
        radius,
      };

      setParticleFocus((current) => {
        const hasMeaningfulChange =
          Math.abs(current.centerX - nextFocus.centerX) > 0.002 ||
          Math.abs(current.centerY - nextFocus.centerY) > 0.002 ||
          Math.abs(current.radius - nextFocus.radius) > 0.002;

        return hasMeaningfulChange ? nextFocus : current;
      });
    };

    const resizeObserver = new ResizeObserver(updateParticleFocus);
    resizeObserver.observe(section);
    resizeObserver.observe(lab);
    window.addEventListener("resize", updateParticleFocus);

    const animationFrame = window.requestAnimationFrame(updateParticleFocus);
    const settleTimer = window.setTimeout(updateParticleFocus, reduceMotion ? 0 : 850);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateParticleFocus);
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
    };
  }, [canUsePixelBlast, reduceMotion]);

  return (
    <section
      className="hero-section"
      id="hero"
      ref={heroSectionRef}
    >
      {canUsePixelBlast ? (
        <PixelBlast
          className="hero-section__pixelblast"
          color={theme === "light" ? "#8b5cf6" : "#a855f7"}
          edgeFade={0}
          enableRipples
          focusCenterX={particleFocus.centerX}
          focusCenterY={particleFocus.centerY}
          focusInnerRadius={0.44}
          focusRadius={particleFocus.radius}
          liquid
          liquidRadius={0.7}
          liquidStrength={0.045}
          noiseAmount={0}
          particleLifetime={2.35}
          particleMotion={1.15}
          particleRespawnDelay={0.86}
          patternDensity={0.58}
          patternScale={3}
          pixelSize={6}
          rippleIntensityScale={0.72}
          rippleLifetime={2.9}
          rippleSpeed={0.22}
          rippleThickness={0.078}
          speed={0.24}
          variant="square"
        />
      ) : (
        <div aria-hidden="true" className="hero-section__fallback" />
      )}

      <div aria-hidden="true" className="hero-section__overlay" />
      <div aria-hidden="true" className="hero-section__orb hero-section__orb--one" />
      <div aria-hidden="true" className="hero-section__orb hero-section__orb--two" />
      <div aria-hidden="true" className="hero-section__horizon" />

      <div className="content-shell hero-section__content">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="hero-section__intro"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="hero-section__eyebrow">
            <span>TA JOURNAL / 2026</span>
            <span className="hero-section__availability">
              <i aria-hidden="true" />
              持续更新中
            </span>
          </div>

          <div className="hero-section__copy">
            <p className="hero-section__kicker">TECHNICAL ART · REAL-TIME VISUAL SYSTEMS</p>
            <h1>
              {titleLines.map((line, lineIndex) => (
                <span className="hero-section__title-line" key={`${line}-${lineIndex}`}>
                  {line}
                </span>
              ))}
            </h1>
            <p className="hero-section__statement">把视觉判断，转译为实时系统。</p>
            <p className="hero-section__summary">{summary}</p>

            <div className="hero-section__actions">
              <Link className="button button--primary hero-section__primary" to="/category/portfolio">
                浏览作品
                <ArrowUpRight size={17} />
              </Link>
              <Link className="hero-section__text-link" to="/category/learning-notes">
                阅读方法记录
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.aside
          aria-label="交互式 3D 技术美术模型"
          animate={{ opacity: 1, scale: 1, x: 0 }}
          className="hero-lab hero-lab--model"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96, x: 28 }}
          ref={heroLabRef}
          transition={{ delay: reduceMotion ? 0 : 0.16, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroModelScene reduceMotion={Boolean(reduceMotion)} theme={theme} />
        </motion.aside>
      </div>
    </section>
  );
}
