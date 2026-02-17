import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect } from "react";

interface SuccessNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  message?: string;
  duration?: number;
}

export const SuccessNotification = ({
  isVisible,
  onClose,
  message = "Форма успешно отправлена!",
  duration = 2000,
}: SuccessNotificationProps) => {
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, onClose, duration]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Success content */}
          <div className="pointer-events-none fixed inset-0 z-[10000] flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="pointer-events-auto flex min-w-[280px] flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800"
            >
              {/* Animated checkmark circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                className="relative mb-6"
              >
                {/* Circle background */}
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  {/* Checkmark icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.3,
                      type: "spring",
                      stiffness: 200,
                      damping: 12,
                    }}
                  >
                    <Check
                      className="h-10 w-10 text-green-600 dark:text-green-400"
                      strokeWidth={3}
                    />
                  </motion.div>
                </div>

                {/* Animated ring */}
                <motion.div
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.3, opacity: 0 }}
                  transition={{
                    delay: 0.2,
                    duration: 0.6,
                    ease: "easeOut",
                  }}
                  className="absolute inset-0 rounded-full border-4 border-green-400 dark:border-green-500"
                />
              </motion.div>

              {/* Success message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                {message}
              </motion.p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
