import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type SpringOptions, type Variants } from "motion/react";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import "./Dock.css";

type DockItemData = {
  content: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
  active?: boolean;
};

type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
  position?: "top" | "bottom";
  showLabels?: boolean;
  scrollVisibility?: "revealed" | "hidden";
};

type DockItemProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  spring: SpringOptions;
  distance: number;
  magnification: number;
  baseItemSize: number;
  label: string;
  active?: boolean;
};

type DockLabelProps = {
  children: ReactNode;
  className?: string;
  isHovered?: ReturnType<typeof useMotionValue<number>>;
  position: "top" | "bottom";
};

function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  label,
  active = false,
}: DockItemProps) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (value) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return value - rect.x - rect.width / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize],
  );
  const scale = useSpring(useTransform(targetSize, (value) => value / baseItemSize), spring);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <motion.div className="dock-item-motion" variants={dockItemVariants}>
      <motion.button
        ref={ref}
        aria-current={active ? "page" : undefined}
        aria-label={label}
        className={`dock-item ${active ? "dock-item--active" : ""} ${className}`.trim()}
        onBlur={() => isHovered.set(0)}
        onClick={onClick}
        onFocus={() => isHovered.set(1)}
        onHoverEnd={() => isHovered.set(0)}
        onHoverStart={() => isHovered.set(1)}
        onKeyDown={handleKeyDown}
        style={{ minWidth: baseItemSize, height: baseItemSize, scale }}
        type="button"
      >
        {Children.map(children, (child) => {
          if (!isValidElement(child)) {
            return child;
          }

          return cloneElement(child as ReactElement<{ isHovered?: ReturnType<typeof useMotionValue<number>> }>, { isHovered });
        })}
      </motion.button>
    </motion.div>
  );
}

function DockLabel({ children, className = "", isHovered, position }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) {
      return undefined;
    }

    const unsubscribe = isHovered.on("change", (value) => {
      setIsVisible(value === 1);
    });

    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          animate={{ opacity: 1, y: position === "top" ? 10 : -10 }}
          className={`dock-label dock-label--${position} ${className}`.trim()}
          exit={{ opacity: 0, y: 0 }}
          initial={{ opacity: 0, y: 0 }}
          role="tooltip"
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function DockIcon({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`dock-icon ${className}`.trim()}>{children}</div>;
}

const dockPanelVariants: Variants = {
  hidden: {
    opacity: 0.2,
    y: -18,
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.035,
      staggerDirection: -1,
    },
  },
  revealed: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.34,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

const dockItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -18,
    filter: "blur(10px)",
    scale: 0.92,
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  revealed: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      duration: 0.36,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function Dock({
  items,
  className = "",
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 72,
  distance = 180,
  panelHeight = 70,
  dockHeight = 116,
  baseItemSize = 50,
  position = "bottom",
  showLabels = true,
  scrollVisibility = "revealed",
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 8),
    [dockHeight, magnification],
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return (
    <motion.div className={`dock-outer dock-outer--${position}`} style={{ height }}>
      <motion.div
        animate={scrollVisibility}
        aria-label="Application dock"
        className={`dock-panel dock-panel--${position} ${className}`.trim()}
        initial={false}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        role="toolbar"
        style={{ height: panelHeight }}
        variants={dockPanelVariants}
      >
        {items.map((item) => (
          <DockItem
            active={item.active}
            baseItemSize={baseItemSize}
            className={item.className}
            distance={distance}
            key={item.label}
            label={item.label}
            magnification={magnification}
            mouseX={mouseX}
            onClick={item.onClick}
            spring={spring}
          >
            <DockIcon>{item.content}</DockIcon>
            {showLabels ? <DockLabel position={position}>{item.label}</DockLabel> : null}
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}
