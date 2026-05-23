"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className={`relative panel-strong w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-hidden flex flex-col`}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h2 className="text-lg font-semibold">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-ink-mute hover:text-ink p-1 rounded-lg hover:bg-white/[0.05]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
