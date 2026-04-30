import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconHandClick } from "@tabler/icons-react";
import { useIsMobile } from "@gridix/ui";

interface InteractionHintProps {
  size?: number;
  color?: string;
  className?: string;
  storageKey: string;
}

const STORAGE_PREFIX = "interaction-hint-";

/**
 * A reusable hint component that shows a shaking hand icon on a semi-transparent background.
 * Disappears on any interaction (hover, click, touch).
 * Only shown on desktop devices.
 * Uses localStorage to remember if the hint was already shown for the given storageKey.
 */
export const InteractionHint = ({
  size = 36,
  color = "#928787",
  className = "",
  storageKey,
}: InteractionHintProps) => {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isMobile) return;

    const storageKeyName = `${STORAGE_PREFIX}${storageKey}`;
    const wasShown = localStorage.getItem(storageKeyName);

    if (!wasShown) {
      setIsVisible(true);
    }
  }, [storageKey, isMobile]);

  const handleDismiss = () => {
    setIsVisible(false);
    const storageKeyName = `${STORAGE_PREFIX}${storageKey}`;
    localStorage.setItem(storageKeyName, "true");
  };

  // Hidden on mobile or if already dismissed
  if (isMobile || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 z-[30] flex cursor-pointer items-center justify-center bg-white/20 backdrop-blur-[1px] ${className}`}
          onMouseEnter={handleDismiss}
          onMouseDown={handleDismiss}
          onTouchStart={handleDismiss}
        >
          <motion.div
            animate={{
              x: [0, -8, 8, -8, 8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.2, 0.4, 0.6, 0.8, 1],
            }}
            className="rounded-full border border-white/50 bg-white/70 p-5 shadow-2xl"
          >
            <IconHandClick size={size} color={color} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InteractionHint;
