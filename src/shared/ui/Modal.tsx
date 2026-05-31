import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import { useFocusTrap } from './hooks/useFocusTrap';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { IconButton } from './IconButton';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: number;
    className?: string;
}

/** Centered dialog with backdrop, focus-trap and Escape-to-close. */
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, footer, width = 440, className }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const reduced = usePrefersReducedMotion();

    useFocusTrap(panelRef, open);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    return createPortal(
        <AnimatePresence>
            {open ? (
                <motion.div
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ duration: 0.16 }}
                        style={{ width }}
                        className={cn('relative bg-overlay border border-border rounded-card shadow-popover max-w-[calc(100vw-2rem)]', className)}
                    >
                        {title ? (
                            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
                                <h3 className="text-base font-bold text-text">{title}</h3>
                                <IconButton icon={X} aria-label="Kapat" size="sm" onClick={onClose} />
                            </div>
                        ) : null}
                        <div className="px-5 py-4 text-sm text-text-2">{children}</div>
                        {footer ? <div className="flex justify-end gap-2 px-5 pb-4 pt-1">{footer}</div> : null}
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>,
        document.body,
    );
};
