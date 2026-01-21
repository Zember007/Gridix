import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandTap } from "@phosphor-icons/react";
import { useIsMobile } from '@/hooks/use-mobile';

interface InteractionHintProps {
    size?: number;
    color?: string;
    className?: string;
}

/**
 * A reusable hint component that shows a shaking hand icon on a semi-transparent background.
 * Disappears on any interaction (hover, click, touch).
 * Only shown on desktop devices.
 */
export const InteractionHint = ({
    size = 36,
    color = "#928787",
    className = ""
}: InteractionHintProps) => {
    const isMobile = useIsMobile();
    const [isVisible, setIsVisible] = useState(true);

    // Hidden on mobile or if already dismissed
    if (isMobile || !isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 z-[30] flex items-center justify-center bg-white/20 backdrop-blur-[1px] cursor-pointer ${className}`}
                    onMouseEnter={() => setIsVisible(false)}
                    onMouseDown={() => setIsVisible(false)}
                    onTouchStart={() => setIsVisible(false)}
                >
                    <motion.div
                        animate={{
                            x: [0, -8, 8, -8, 8, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            times: [0, 0.2, 0.4, 0.6, 0.8, 1]
                        }}
                        className="p-5 rounded-full bg-white/70 shadow-2xl border border-white/50"
                    >
                        <HandTap size={size} color={color} weight="duotone" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default InteractionHint;
