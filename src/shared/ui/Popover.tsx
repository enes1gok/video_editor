import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { useFocusTrap } from './hooks/useFocusTrap';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';

export interface PopoverProps {
    /** The clickable trigger (e.g. a Button). Clicking it toggles the panel. */
    trigger: React.ReactNode;
    /** Panel content; receives a `close` callback when called as a function. */
    children: React.ReactNode | ((close: () => void) => React.ReactNode);
    align?: 'start' | 'end';
    width?: number;
    className?: string;
    /** Class for the trigger wrapper (e.g. "flex w-full" for a full-width trigger). */
    triggerClassName?: string;
}

/** Anchored floating panel with focus-trap, Escape and click-outside to close. */
export const Popover: React.FC<PopoverProps> = ({ trigger, children, align = 'start', width = 320, className, triggerClassName }) => {
    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const anchorRef = useRef<HTMLSpanElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const reduced = usePrefersReducedMotion();

    const close = useCallback(() => setOpen(false), []);
    const toggle = () => {
        const el = anchorRef.current;
        if (el) setRect(el.getBoundingClientRect());
        setOpen((o) => !o);
    };

    useFocusTrap(panelRef, open);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
            close();
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDown);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onDown);
        };
    }, [open, close]);

    const left = rect ? (align === 'end' ? rect.right - width : rect.left) : 0;
    const top = rect ? rect.bottom + 8 : 0;

    return (
        <>
            <span ref={anchorRef} className={cn('inline-flex', triggerClassName)} onClick={toggle}>
                {trigger}
            </span>
            {createPortal(
                <AnimatePresence>
                    {open && rect ? (
                        <motion.div
                            ref={panelRef}
                            role="dialog"
                            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                            transition={{ duration: 0.14 }}
                            style={{ position: 'fixed', left: Math.max(8, left), top, width, zIndex: 1000 }}
                            className={cn('bg-overlay border border-border rounded-card shadow-popover p-4', className)}
                        >
                            {typeof children === 'function' ? children(close) : children}
                        </motion.div>
                    ) : null}
                </AnimatePresence>,
                document.body,
            )}
        </>
    );
};
