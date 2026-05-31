import React, { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../utils/cn';

type Side = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
    content: React.ReactNode;
    side?: Side;
    delay?: number;
    children: React.ReactElement;
    className?: string;
}

const TRANSFORMS: Record<Side, string> = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0, -50%)',
};

const OFFSETS: Record<Side, React.CSSProperties> = {
    top: { marginTop: -8 },
    bottom: { marginTop: 8 },
    left: { marginLeft: -8 },
    right: { marginLeft: 8 },
};

/** Hover/focus tooltip (portaled, opacity-fade so it never fights positioning). */
export const Tooltip: React.FC<TooltipProps> = ({ content, side = 'top', delay = 350, children, className }) => {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLSpanElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const id = useId();

    const show = () => {
        timer.current = setTimeout(() => {
            const el = triggerRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            const points: Record<Side, { x: number; y: number }> = {
                top: { x: r.left + r.width / 2, y: r.top },
                bottom: { x: r.left + r.width / 2, y: r.bottom },
                left: { x: r.left, y: r.top + r.height / 2 },
                right: { x: r.right, y: r.top + r.height / 2 },
            };
            setCoords(points[side]);
            setOpen(true);
        }, delay);
    };
    const hide = () => {
        clearTimeout(timer.current);
        setOpen(false);
    };

    return (
        <>
            <span
                ref={triggerRef}
                aria-describedby={open ? id : undefined}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                className="inline-flex"
            >
                {children}
            </span>
            {createPortal(
                <AnimatePresence>
                    {open && content ? (
                        <motion.div
                            id={id}
                            role="tooltip"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            style={{
                                position: 'fixed',
                                left: coords.x,
                                top: coords.y,
                                transform: TRANSFORMS[side],
                                ...OFFSETS[side],
                                zIndex: 1000,
                            }}
                            className={cn(
                                'pointer-events-none max-w-xs px-2 py-1 rounded-md bg-text text-surface text-[11px] font-medium shadow-popover whitespace-nowrap',
                                className,
                            )}
                        >
                            {content}
                        </motion.div>
                    ) : null}
                </AnimatePresence>,
                document.body,
            )}
        </>
    );
};
