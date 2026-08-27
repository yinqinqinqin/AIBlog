import { motion, useReducedMotion, type Transition, type Variants } from "motion/react";
import { ArrowUp } from "lucide-react";

type ScrollToTopButtonProps = {
  isFocusable?: boolean;
  transition?: Transition;
  variants?: Variants;
};

export default function ScrollToTopButton({ isFocusable = true, transition, variants }: ScrollToTopButtonProps) {
  const reduceMotion = useReducedMotion();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <motion.button
      aria-label="回到页面顶部"
      className="scroll-to-top"
      onClick={scrollToTop}
      tabIndex={isFocusable ? 0 : -1}
      title="回到顶部"
      transition={transition ?? { duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
      type="button"
      variants={variants}
      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
    >
      <ArrowUp size={16} />
    </motion.button>
  );
}
