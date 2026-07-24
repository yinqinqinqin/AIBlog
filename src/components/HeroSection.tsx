import { useCallback, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import PixelBlast from "@/components/PixelBlast";
import { useThemeStore } from "@/store/themeStore";

type HeroSectionProps = {
  title: string;
  poster: string;
  titleHref: string;
};

export default function HeroSection({
  title,
  poster,
  titleHref,
}: HeroSectionProps) {
  const theme = useThemeStore((state) => state.theme);
  const hoverSoundSrc = "/sounds/select.wav";
  const canUsePixelBlast = useMemo(() => {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      typeof WebGLRenderingContext === "undefined"
    ) {
      return false;
    }

    return !/jsdom/i.test(navigator.userAgent);
  }, [hoverSoundSrc]);

  const charRefs = useRef<HTMLSpanElement[]>([]);
  const hoverAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef(false);

  const titleLines = useMemo(() => title.split("\n"), [title]);

  const unlockHoverAudio = useCallback(async () => {
    const hoverAudio = hoverAudioRef.current;

    if (!hoverAudio) {
      return false;
    }

    if (audioUnlockedRef.current) {
      return true;
    }

    try {
      if (!hoverAudio.src) {
        hoverAudio.src = hoverSoundSrc;
        hoverAudio.load();
      }

      hoverAudio.muted = true;
      hoverAudio.currentTime = 0;
      await hoverAudio.play();
      hoverAudio.pause();
      hoverAudio.currentTime = 0;
      hoverAudio.muted = false;
      audioUnlockedRef.current = true;
      return true;
    } catch {
      hoverAudio.muted = false;
      return false;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const audio = new Audio();
    audio.preload = "none";
    audio.volume = 0.9;
    hoverAudioRef.current = audio;

    const unlockAudio = async () => {
      await unlockHoverAudio();
    };

    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      hoverAudioRef.current?.pause();
      hoverAudioRef.current = null;
    };
    }, [unlockHoverAudio]);

  const playHoverSound = useCallback(async () => {
    const hoverAudio = hoverAudioRef.current;

    if (!hoverAudio) {
      return;
    }

    if (!hoverAudio.src) {
      hoverAudio.src = hoverSoundSrc;
      hoverAudio.load();
    }

    if (!audioUnlockedRef.current) {
      const unlocked = await unlockHoverAudio();

      if (!unlocked) {
        return;
      }
    }

    hoverAudio.pause();
    hoverAudio.currentTime = 0;
    hoverAudio.volume = 0.9;
    await hoverAudio.play().catch(() => {
      audioUnlockedRef.current = false;
    });
  }, [hoverSoundSrc, unlockHoverAudio]);

  const animateTitle = useCallback(() => {
    const chars = charRefs.current.filter(Boolean);
    const total = chars.length;

    chars.forEach((char, index) => {
      char.getAnimations().forEach((animation) => animation.cancel());
      char.animate(
        [
          {
            transform: "translate3d(-30px, 0, 0)",
            clipPath: "inset(0% 100% 120% -5%)",
          },
          {
            transform: "translate3d(0, 0, 0)",
            clipPath: "inset(0% -100% -100% -5%)",
          },
        ],
        {
          duration: 1200,
          delay: (total - index - 1) * 40,
          easing: "cubic-bezier(0.215, 0.61, 0.355, 1)",
          fill: "both",
        },
      );
    });
  }, []);

  const triggerTitleInteraction = useCallback(() => {
    animateTitle();
    void playHoverSound();
  }, [animateTitle, playHoverSound]);

  return (
    <section className="hero-section" id="hero">
      {canUsePixelBlast ? (
        <PixelBlast
          className="hero-section__pixelblast"
          color="#c08bff"
          edgeFade={0.25}
          enableRipples
          liquid
          liquidRadius={1}
          liquidStrength={0.1}
          noiseAmount={0}
          patternDensity={1}
          patternScale={2}
          pixelSize={4}
          rippleIntensityScale={1}
          rippleSpeed={0.3}
          rippleThickness={0.1}
          speed={0.5}
          variant="square"
        />
      ) : (
        <div
          aria-hidden="true"
          className="hero-section__fallback"
          style={{ backgroundImage: `url(${poster})` }}
        />
      )}

      <div className="hero-section__overlay" />

      <div className="content-shell hero-section__content">
        <div className="hero-section__copy">
          <h1>
            <Link
              aria-label={`打开 ${title} 页面`}
              className="hero-section__title-link"
              onFocus={triggerTitleInteraction}
              onPointerEnter={triggerTitleInteraction}
              to={titleHref}
            >
              {titleLines.map((line, lineIndex) => (
                <span className="hero-section__title-line" key={`${line}-${lineIndex}`}>
                  {Array.from(line).map((char, charIndex) => (
                    <span
                      className="hero-section__title-char"
                      key={`${lineIndex}-${charIndex}-${char}`}
                      ref={(node) => {
                        const flatIndex =
                          titleLines
                            .slice(0, lineIndex)
                            .reduce((count, currentLine) => count + currentLine.length, 0) +
                          charIndex;

                        if (node) {
                          charRefs.current[flatIndex] = node;
                        }
                      }}
                    >
                      {char === " " ? "\u00A0" : char}
                    </span>
                  ))}
                </span>
              ))}
            </Link>
          </h1>
        </div>
      </div>
    </section>
  );
}
