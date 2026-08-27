import { Pause, Play, Volume2 } from "lucide-react";
import { motion, useReducedMotion, type Transition, type Variants } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const defaultTrack = {
  title: "渡月橋 ~君 想ふ~ (Remix)",
  artist: "Ayasa绚沙",
  src: "/sounds/togetsukyo-remix.flac",
};

type MusicPlayerProps = {
  isFocusable?: boolean;
  transition?: Transition;
  variants?: Variants;
};

export default function MusicPlayer({ isFocusable = true, transition, variants }: MusicPlayerProps) {
  const reduceMotion = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wasBlocked, setWasBlocked] = useState(false);

  const stopMusic = useCallback((reset = false) => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      if (reset) {
        audio.currentTime = 0;
      }
    }
    setIsPlaying(false);
  }, []);

  const startMusic = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      await audio.play();
      setWasBlocked(false);
      setIsPlaying(true);
    } catch {
      setWasBlocked(true);
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    const audio = new Audio(defaultTrack.src);
    audio.preload = "metadata";
    audio.loop = true;
    audio.volume = 0.42;
    audioRef.current = audio;

    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => {
      setWasBlocked(false);
      setIsPlaying(true);
    };
    const handleError = () => {
      setWasBlocked(true);
      setIsPlaying(false);
    };

    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("error", handleError);
      stopMusic(true);
      audioRef.current = null;
    };
  }, [stopMusic]);

  const toggleMusic = () => {
    if (isPlaying) {
      stopMusic();
    } else {
      void startMusic();
    }
  };

  return (
    <motion.button
      aria-label={isPlaying ? `暂停 ${defaultTrack.title}` : `播放 ${defaultTrack.title}`}
      className={`music-player${isPlaying ? " is-playing" : ""}${wasBlocked ? " is-blocked" : ""}`}
      onClick={toggleMusic}
      tabIndex={isFocusable ? 0 : -1}
      title={`${defaultTrack.title} - ${defaultTrack.artist}`}
      transition={transition ?? { duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
      type="button"
      variants={variants}
      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
    >
      <span className="music-player__bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="music-player__icon" aria-hidden="true">
        {isPlaying ? <Pause size={14} /> : wasBlocked ? <Play size={14} /> : <Volume2 size={15} />}
      </span>
    </motion.button>
  );
}
