import React, { useMemo, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, GripVertical } from 'lucide-react';
import type { CutSegment } from '../../../app/store/types';
import { fmtTime } from '../utils/timeFormat';
import { IconButton, Tooltip } from '../../../shared/ui';

interface WaveformTimelineProps {
    waveContainerRef: React.RefObject<HTMLDivElement | null>;
    timelineContainerRef: React.RefObject<HTMLDivElement | null>;
    zoom: number; // pixels per second
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    duration: number;
    currentTime: number;
    sortedCuts: CutSegment[];
    selectedCut: string | null;
    dragging: { cutId: string; edge: 'start' | 'end' } | null;
    handleEdgeDrag: (e: React.MouseEvent, cutId: string, edge: 'start' | 'end') => void;
    jumpToCut: (cut: CutSegment) => void;
    seekTo: (t: number) => void;
    isPlaying?: boolean;
    zoomToFit?: () => void;
}

const MIN_ZOOM = 10;
const MAX_ZOOM = 2000;
const RULER_H = 22;
const WAVE_H = 90;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Pick a "nice" tick interval (seconds) so major ticks sit ~90px apart. */
function niceStep(zoom: number): number {
    const target = 90 / zoom; // seconds per ~90px
    const steps = [0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800];
    return steps.find((s) => s >= target) ?? 3600;
}

export const WaveformTimeline: React.FC<WaveformTimelineProps> = ({
    waveContainerRef,
    timelineContainerRef,
    zoom,
    setZoom,
    duration,
    currentTime,
    sortedCuts,
    selectedCut,
    dragging,
    handleEdgeDrag,
    jumpToCut,
    seekTo,
    isPlaying,
    zoomToFit,
}) => {
    const timeToPixels = (t: number) => t * zoom;
    const pixelsToTime = (px: number) => px / zoom;

    const totalWidth = useMemo(() => duration * zoom, [duration, zoom]);
    const playheadLeft = useMemo(() => timeToPixels(currentTime), [currentTime, zoom]);

    const ticks = useMemo(() => {
        if (duration <= 0) return [];
        const step = niceStep(zoom);
        const arr: number[] = [];
        for (let t = 0; t <= duration + 1e-6; t += step) arr.push(Number(t.toFixed(3)));
        return arr;
    }, [duration, zoom]);

    const handleScrubStart = (e: React.MouseEvent) => {
        e.preventDefault();
        const onMove = (ev: MouseEvent) => {
            if (!timelineContainerRef.current) return;
            const rect = timelineContainerRef.current.getBoundingClientRect();
            const scrollLeft = timelineContainerRef.current.scrollLeft;
            const x = ev.clientX - rect.left + scrollLeft;
            seekTo(Math.max(0, Math.min(duration, pixelsToTime(x))));
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        onMove(e.nativeEvent);
    };

    // Keep the playhead in view while playing (the previous effect was a no-op).
    useEffect(() => {
        const container = timelineContainerRef.current;
        if (!container || !isPlaying) return;
        const margin = 80;
        const left = container.scrollLeft;
        const right = left + container.clientWidth;
        if (playheadLeft > right - margin || playheadLeft < left) {
            container.scrollLeft = Math.max(0, playheadLeft - container.clientWidth * 0.2);
        }
    }, [playheadLeft, isPlaying, timelineContainerRef]);

    // Ctrl/Cmd + wheel zooms anchored at the cursor (native listener so we can
    // preventDefault the browser page-zoom).
    useEffect(() => {
        const container = timelineContainerRef.current;
        if (!container) return;
        const onWheel = (e: WheelEvent) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            const cursorOffset = e.clientX - rect.left;
            const timeAtCursor = (cursorOffset + container.scrollLeft) / zoom;
            const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
            const newZoom = clamp(zoom * factor, MIN_ZOOM, MAX_ZOOM);
            setZoom(newZoom);
            requestAnimationFrame(() => {
                container.scrollLeft = timeAtCursor * newZoom - cursorOffset;
            });
        };
        container.addEventListener('wheel', onWheel, { passive: false });
        return () => container.removeEventListener('wheel', onWheel);
    }, [zoom, setZoom, timelineContainerRef]);

    return (
        <div className="relative select-none">
            {/* Toolbar: timecode + zoom */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="text-xs font-medium flex items-center gap-2">
                    <span className="bg-surface-2 text-text px-2 py-0.5 rounded-md font-mono">{fmtTime(currentTime)}</span>
                    <span className="text-text-muted">/</span>
                    <span className="text-text-muted font-mono">{fmtTime(duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Tooltip content="Uzaklaştır">
                        <IconButton icon={ZoomOut} aria-label="Uzaklaştır" size="sm" onClick={() => setZoom((z) => clamp(z * 0.8, MIN_ZOOM, MAX_ZOOM))} />
                    </Tooltip>
                    <Tooltip content="Ekrana sığdır">
                        <IconButton icon={Maximize2} aria-label="Ekrana sığdır" size="sm" onClick={() => zoomToFit?.()} />
                    </Tooltip>
                    <Tooltip content="Yakınlaştır · Ctrl+tekerlek">
                        <IconButton icon={ZoomIn} aria-label="Yakınlaştır" size="sm" onClick={() => setZoom((z) => clamp(z * 1.2, MIN_ZOOM, MAX_ZOOM))} />
                    </Tooltip>
                    <span className="text-[10px] font-mono text-text-muted min-w-[44px] text-right">{Math.round(zoom)}px/s</span>
                </div>
            </div>

            {/* Scroll container */}
            <div
                ref={timelineContainerRef}
                className="bg-timeline-bg rounded-card border border-border relative shadow-panel overflow-x-auto overflow-y-hidden scrollbar-thin"
                style={{ height: RULER_H + WAVE_H + 52 }}
            >
                <div style={{ width: totalWidth || '100%', height: '100%', position: 'relative' }} className="min-w-full">
                    {/* Ruler: grid lines (full height) + labels */}
                    <div className="absolute inset-0 pointer-events-none z-0">
                        {ticks.map((t) => {
                            const left = timeToPixels(t);
                            return (
                                <React.Fragment key={t}>
                                    <div className="absolute bg-timeline-grid opacity-40" style={{ left, top: RULER_H, bottom: 0, width: 1 }} />
                                    <span className="absolute top-1 text-[10px] font-mono text-text-muted leading-none whitespace-nowrap" style={{ left: left + 3 }}>
                                        {fmtTime(t)}
                                    </span>
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Waveform */}
                    <div ref={waveContainerRef} className="absolute left-0 w-full opacity-90 z-10" style={{ top: RULER_H, height: WAVE_H }} />

                    {/* Scrub band (below waveform) + ruler click-to-seek */}
                    <div
                        className="absolute left-0 w-full cursor-pointer z-0"
                        style={{ top: 0, height: RULER_H }}
                        onMouseDown={handleScrubStart}
                    />
                    <div
                        className="absolute left-0 w-full bg-surface-2/30 border-t border-border cursor-pointer z-0"
                        style={{ top: RULER_H + WAVE_H, bottom: 0 }}
                        onMouseDown={handleScrubStart}
                    />

                    {/* Cut regions */}
                    <div className="absolute left-0 w-full pointer-events-none z-20" style={{ top: RULER_H, height: WAVE_H }}>
                        {duration > 0 && sortedCuts.map((cut) => {
                            const left = timeToPixels(cut.start);
                            const width = timeToPixels(cut.end - cut.start);
                            const isActive = selectedCut === cut.id;
                            const isDraggingThis = dragging?.cutId === cut.id;
                            return (
                                <div
                                    key={cut.id}
                                    className="absolute top-0 h-full cursor-pointer pointer-events-auto group/cut border-x-2 transition-[background,box-shadow] duration-150"
                                    style={{
                                        left,
                                        width,
                                        background: isDraggingThis || isActive ? 'var(--cut-fill-active)' : 'var(--cut-fill)',
                                        borderColor: 'var(--cut-border)',
                                        boxShadow: isActive ? '0 0 0 1px var(--cut-border)' : undefined,
                                        zIndex: isActive ? 10 : 5,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        jumpToCut(cut);
                                    }}
                                >
                                    <DragHandle side="left" isActive={isDraggingThis && dragging?.edge === 'start'} onMouseDown={(e) => handleEdgeDrag(e, cut.id, 'start')} time={isDraggingThis && dragging?.edge === 'start' ? fmtTime(cut.start) : undefined} />
                                    <DragHandle side="right" isActive={isDraggingThis && dragging?.edge === 'end'} onMouseDown={(e) => handleEdgeDrag(e, cut.id, 'end')} time={isDraggingThis && dragging?.edge === 'end' ? fmtTime(cut.end) : undefined} />
                                    <div className="absolute bottom-1 left-2 text-[10px] font-semibold text-danger opacity-0 group-hover/cut:opacity-100 transition-opacity whitespace-nowrap">
                                        {fmtTime(cut.end - cut.start)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Playhead */}
                    <div className="absolute top-0 h-full pointer-events-none z-30" style={{ left: playheadLeft, width: 2, background: 'var(--playhead)' }}>
                        {/* Time chip */}
                        <div className="absolute -top-0 left-1 px-1 py-0.5 rounded bg-playhead text-timeline-bg text-[10px] font-mono leading-none whitespace-nowrap">
                            {fmtTime(currentTime)}
                        </div>
                        {/* Triangular head */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-3 h-2.5 bg-playhead clip-path-playhead" style={{ top: RULER_H - 2 }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Drag Handle sub-component ── */
const DragHandle: React.FC<{
    side: 'left' | 'right';
    isActive?: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    time?: string;
}> = ({ side, isActive, onMouseDown, time }) => (
    <div
        // Wide invisible grab zone, slim visible handle inside (bigger hit target).
        className="absolute top-0 h-full cursor-col-resize z-20 flex items-center justify-center group/handle"
        style={{ [side === 'left' ? 'left' : 'right']: -8, width: 16, pointerEvents: 'auto' }}
        onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDown(e);
        }}
    >
        <div
            className={`h-1/2 w-1.5 rounded-full transition-all flex items-center justify-center ${
                isActive ? 'h-2/3 scale-x-125' : 'group-hover/handle:h-2/3'
            }`}
            style={{ background: 'var(--cut-border)' }}
        >
            <GripVertical size={10} className="text-white opacity-70" />
        </div>
        {time && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-text text-surface text-[10px] font-mono px-2 py-0.5 rounded-md shadow-popover z-40 whitespace-nowrap">
                {time}
            </div>
        )}
    </div>
);
