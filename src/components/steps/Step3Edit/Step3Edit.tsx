import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import WaveSurfer from 'wavesurfer.js';
import {
    Play, Pause, Scissors, Trash2, ChevronLeft, ChevronRight,
    SkipBack, SkipForward, ZoomIn, ZoomOut, Plus
} from 'lucide-react';
import { useAppStore, type CutSegment } from '../../../store/useAppStore';

/* ── helpers ── */
const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${String(sec).padStart(2, '0')}.${ms}`;
};

let idCounter = 0;
const uid = () => `seg-${++idCounter}-${Date.now()}`;

export const Step3Edit: React.FC = () => {
    const { videoFile, audioFile, syncOffset, cuts, setCuts, setStep } = useAppStore();

    /* ── refs ── */
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const waveContainerRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WaveSurfer | null>(null);
    const videoUrl = useRef('');
    const audioUrl = useRef('');

    /* ── state ── */
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [zoom, setZoom] = useState(80);
    const [markIn, setMarkIn] = useState<number | null>(null);
    const [selectedCut, setSelectedCut] = useState<string | null>(null);

    /* ── create object URLs ── */
    useEffect(() => {
        if (videoFile) videoUrl.current = URL.createObjectURL(videoFile);
        if (audioFile) audioUrl.current = URL.createObjectURL(audioFile);
        return () => {
            if (videoUrl.current) URL.revokeObjectURL(videoUrl.current);
            if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
        };
    }, [videoFile, audioFile]);

    /* ── WaveSurfer init (audio waveform on timeline) ── */
    useEffect(() => {
        if (!audioFile || !waveContainerRef.current) return;
        if (wsRef.current) { wsRef.current.destroy(); wsRef.current = null; }

        const url = URL.createObjectURL(audioFile);
        wsRef.current = WaveSurfer.create({
            container: waveContainerRef.current,
            waveColor: '#6366F1',
            progressColor: '#4338CA',
            cursorColor: '#EF4444',
            height: 80,
            normalize: true,
            minPxPerSec: 10,
            interact: true,
            hideScrollbar: false,
            autoScroll: true,
            barWidth: 2,
            barGap: 1,
            barRadius: 1,
        });

        wsRef.current.load(url);
        wsRef.current.on('ready', (d) => {
            setDuration(d);
            try { wsRef.current?.zoom(zoom); } catch (_) { /* */ }
        });
        wsRef.current.on('click', (progress: number) => {
            const t = progress * (wsRef.current?.getDuration() || 0);
            seekTo(t);
        });

        return () => {
            if (wsRef.current) { wsRef.current.destroy(); wsRef.current = null; }
            URL.revokeObjectURL(url);
        };
    }, [audioFile]);

    /* ── zoom ── */
    useEffect(() => {
        try { wsRef.current?.zoom(zoom); } catch (_) { /* */ }
    }, [zoom]);

    /* ── sync video/audio time ── */
    const seekTo = useCallback((t: number) => {
        setCurrentTime(t);
        if (videoRef.current) videoRef.current.currentTime = t;
        if (audioRef.current) audioRef.current.currentTime = Math.max(0, t - syncOffset);
    }, [syncOffset]);

    /* ── time update loop ── */
    useEffect(() => {
        if (!isPlaying) return;
        let raf: number;
        const tick = () => {
            if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [isPlaying]);

    /* ── play / pause ── */
    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
            audioRef.current?.pause();
            setIsPlaying(false);
        } else {
            // Sync audio position
            if (audioRef.current) {
                audioRef.current.currentTime = Math.max(0, videoRef.current.currentTime - syncOffset);
            }
            videoRef.current.play();
            audioRef.current?.play();
            setIsPlaying(true);
        }
    }, [isPlaying, syncOffset]);

    /* ── skip ── */
    const skip = useCallback((dt: number) => {
        seekTo(Math.max(0, Math.min(duration, currentTime + dt)));
    }, [seekTo, currentTime, duration]);

    /* ── cut operations ── */
    const handleMarkIn = () => setMarkIn(currentTime);

    const handleCutOut = () => {
        if (markIn === null) return;
        const start = Math.min(markIn, currentTime);
        const end = Math.max(markIn, currentTime);
        if (end - start < 0.1) return; // too short

        setCuts([...cuts, { id: uid(), start, end }]);
        setMarkIn(null);
    };

    const removeCut = (id: string) => {
        setCuts(cuts.filter(c => c.id !== id));
        if (selectedCut === id) setSelectedCut(null);
    };

    const jumpToCut = (cut: CutSegment) => {
        setSelectedCut(cut.id);
        seekTo(cut.start);
    };

    /* ── sorted cuts ── */
    const sortedCuts = useMemo(() =>
        [...cuts].sort((a, b) => a.start - b.start),
        [cuts]
    );

    /* ── timeline progress ── */
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    /* ── render ── */
    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Düzenle & Kes</h2>
                    <p className="text-sm text-gray-500">Kesim noktalarını belirleyerek videoyu düzenleyin.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setStep(2)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                        Geri
                    </button>
                    <button
                        onClick={() => setStep(4)}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl
                            hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                    >
                        Dışa Aktar →
                    </button>
                </div>
            </div>

            {/* ── Main Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Video Preview (left) ── */}
                <div className="lg:col-span-2">
                    {/* Video player */}
                    <div className="bg-black rounded-2xl overflow-hidden shadow-xl mb-4 aspect-video relative">
                        {videoFile && (
                            <video
                                ref={videoRef}
                                src={videoUrl.current}
                                className="w-full h-full object-contain"
                                onEnded={() => setIsPlaying(false)}
                                muted
                            />
                        )}
                        {audioFile && (
                            <audio ref={audioRef} src={audioUrl.current} preload="auto" />
                        )}

                        {/* Time overlay */}
                        <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded-lg font-mono text-sm">
                            {fmtTime(currentTime)} / {fmtTime(duration)}
                        </div>

                        {/* Mark In indicator */}
                        {markIn !== null && (
                            <div className="absolute top-3 right-3 bg-red-600/90 text-white px-3 py-1 rounded-lg text-xs font-semibold animate-pulse">
                                Başlangıç: {fmtTime(markIn)}
                            </div>
                        )}
                    </div>

                    {/* ── Transport Controls ── */}
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <button onClick={() => skip(-5)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="-5s">
                                <SkipBack size={20} />
                            </button>
                            <button onClick={() => skip(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="-1s">
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={togglePlay}
                                className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-600/30 hover:shadow-xl active:scale-95 transition-all"
                            >
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>
                            <button onClick={() => skip(1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="+1s">
                                <ChevronRight size={20} />
                            </button>
                            <button onClick={() => skip(5)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="+5s">
                                <SkipForward size={20} />
                            </button>
                        </div>

                        {/* Cut buttons */}
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <button
                                onClick={handleMarkIn}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${markIn !== null ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                <Plus size={16} />
                                {markIn !== null ? `Başlangıç: ${fmtTime(markIn)}` : 'Başlangıç İşaretle'}
                            </button>
                            <button
                                onClick={handleCutOut}
                                disabled={markIn === null}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white
                                    hover:bg-red-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-red-600/20"
                            >
                                <Scissors size={16} />
                                Kes
                            </button>
                        </div>

                        {/* ── Timeline / Waveform ── */}
                        <div className="relative">
                            {/* Zoom controls */}
                            <div className="flex items-center justify-end gap-1 mb-2">
                                <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="p-1 hover:bg-gray-100 rounded transition-colors">
                                    <ZoomOut size={14} />
                                </button>
                                <span className="text-[10px] font-mono text-gray-400 w-10 text-center">{zoom}px</span>
                                <button onClick={() => setZoom(z => Math.min(500, z + 10))} className="p-1 hover:bg-gray-100 rounded transition-colors">
                                    <ZoomIn size={14} />
                                </button>
                            </div>

                            {/* Waveform */}
                            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 relative">
                                <div ref={waveContainerRef} className="w-full h-[80px]" />

                                {/* Cut regions overlay */}
                                {duration > 0 && sortedCuts.map(cut => {
                                    const left = (cut.start / duration) * 100;
                                    const width = ((cut.end - cut.start) / duration) * 100;
                                    return (
                                        <div
                                            key={cut.id}
                                            className={`absolute top-0 h-full bg-red-500/30 border-x-2 border-red-500 cursor-pointer
                                                ${selectedCut === cut.id ? 'bg-red-500/50 ring-2 ring-red-400' : 'hover:bg-red-500/40'}`}
                                            style={{ left: `${left}%`, width: `${width}%` }}
                                            onClick={() => jumpToCut(cut)}
                                            title={`${fmtTime(cut.start)} → ${fmtTime(cut.end)}`}
                                        >
                                            <Scissors size={10} className="absolute top-1 left-1 text-red-300" />
                                        </div>
                                    );
                                })}

                                {/* Playhead */}
                                <div
                                    className="absolute top-0 h-full w-px bg-white/80 pointer-events-none z-10 shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                                    style={{ left: `${progressPercent}%` }}
                                />
                            </div>

                            {/* Simple scrubber bar below waveform */}
                            <div
                                className="mt-2 h-2 bg-gray-200 rounded-full cursor-pointer relative overflow-hidden"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const pct = (e.clientX - rect.left) / rect.width;
                                    seekTo(pct * duration);
                                }}
                            >
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-100"
                                    style={{ width: `${progressPercent}%` }}
                                />
                                {/* Cut markers */}
                                {sortedCuts.map(cut => (
                                    <div
                                        key={cut.id}
                                        className="absolute top-0 h-full bg-red-500/50"
                                        style={{
                                            left: `${(cut.start / duration) * 100}%`,
                                            width: `${((cut.end - cut.start) / duration) * 100}%`
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Cut List (right sidebar) ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sticky top-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Kesim Listesi</h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Çıkarılacak bölümler aşağıda listelenir. Kırmızı bölgeler son videoda olmayacaktır.
                        </p>

                        {sortedCuts.length === 0 ? (
                            <div className="text-center py-10">
                                <Scissors size={32} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-sm text-gray-400">Henüz kesim yok</p>
                                <p className="text-xs text-gray-300 mt-1">
                                    Başlangıç noktası belirleyip, bitiş noktasında "Kes" butonuna basın.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                {sortedCuts.map((cut, i) => (
                                    <div
                                        key={cut.id}
                                        onClick={() => jumpToCut(cut)}
                                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all
                                            ${selectedCut === cut.id
                                                ? 'bg-red-50 border-2 border-red-300'
                                                : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div>
                                            <span className="text-xs text-gray-400 font-medium">Kesim {i + 1}</span>
                                            <div className="font-mono text-sm font-semibold text-gray-800">
                                                {fmtTime(cut.start)} → {fmtTime(cut.end)}
                                            </div>
                                            <span className="text-[10px] text-gray-400">
                                                {(cut.end - cut.start).toFixed(1)}s süre
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeCut(cut.id); }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Summary */}
                        {sortedCuts.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Toplam kesim</span>
                                    <span className="font-semibold text-gray-800">{sortedCuts.length} bölüm</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-500">Çıkarılan süre</span>
                                    <span className="font-mono font-semibold text-red-600">
                                        {cuts.reduce((s, c) => s + (c.end - c.start), 0).toFixed(1)}s
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-500">Kalan süre</span>
                                    <span className="font-mono font-semibold text-green-600">
                                        {(duration - cuts.reduce((s, c) => s + (c.end - c.start), 0)).toFixed(1)}s
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
