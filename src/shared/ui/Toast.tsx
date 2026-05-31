import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, type LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
    title: string;
    description?: string;
    variant?: ToastVariant;
    /** ms; 0 disables auto-dismiss. Defaults to 4000 (6000 for errors). */
    duration?: number;
    action?: { label: string; onClick: () => void };
}

interface ToastItem extends ToastOptions {
    id: number;
}

export interface ToastApi {
    (opts: ToastOptions): void;
    success: (title: string, opts?: Partial<ToastOptions>) => void;
    error: (title: string, opts?: Partial<ToastOptions>) => void;
    info: (title: string, opts?: Partial<ToastOptions>) => void;
    warning: (title: string, opts?: Partial<ToastOptions>) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
    return ctx;
}

const ICONS: Record<ToastVariant, LucideIcon> = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const ACCENTS: Record<ToastVariant, string> = {
    success: 'text-success',
    error: 'text-danger',
    info: 'text-accent',
    warning: 'text-warning',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const idRef = useRef(0);

    const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

    const api = useMemo<ToastApi>(() => {
        const push = (opts: ToastOptions) => {
            const id = ++idRef.current;
            const duration = opts.duration ?? (opts.variant === 'error' ? 6000 : 4000);
            setToasts((t) => [...t, { ...opts, id }]);
            if (duration > 0) setTimeout(() => remove(id), duration);
        };
        const fn = ((opts: ToastOptions) => push(opts)) as ToastApi;
        fn.success = (title, o) => push({ ...o, title, variant: 'success' });
        fn.error = (title, o) => push({ ...o, title, variant: 'error' });
        fn.info = (title, o) => push({ ...o, title, variant: 'info' });
        fn.warning = (title, o) => push({ ...o, title, variant: 'warning' });
        return fn;
    }, [remove]);

    return (
        <ToastContext.Provider value={api}>
            {children}
            {createPortal(
                <div className="fixed top-4 right-4 z-[1100] flex flex-col gap-2 w-[min(92vw,360px)] pointer-events-none">
                    <AnimatePresence>
                        {toasts.map((t) => {
                            const variant = t.variant ?? 'info';
                            const Icon = ICONS[variant];
                            return (
                                <motion.div
                                    key={t.id}
                                    layout
                                    initial={{ opacity: 0, x: 24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 24 }}
                                    transition={{ duration: 0.18 }}
                                    role={variant === 'error' ? 'alert' : 'status'}
                                    className="pointer-events-auto flex items-start gap-3 bg-overlay border border-border rounded-card shadow-popover p-3"
                                >
                                    <Icon size={18} className={cn('mt-0.5 shrink-0', ACCENTS[variant])} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-text">{t.title}</p>
                                        {t.description ? <p className="text-xs text-text-2 mt-0.5">{t.description}</p> : null}
                                        {t.action ? (
                                            <button
                                                onClick={() => {
                                                    t.action?.onClick();
                                                    remove(t.id);
                                                }}
                                                className="text-xs font-semibold text-accent mt-1.5 hover:underline"
                                            >
                                                {t.action.label}
                                            </button>
                                        ) : null}
                                    </div>
                                    <button onClick={() => remove(t.id)} aria-label="Bildirimi kapat" className="text-text-muted hover:text-text-2 shrink-0">
                                        <X size={15} />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>,
                document.body,
            )}
        </ToastContext.Provider>
    );
};
