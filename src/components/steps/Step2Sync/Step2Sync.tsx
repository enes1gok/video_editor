import React, { useRef, useState, useCallback, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Wand2, Play, Pause, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Settings2, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { useAutoSync } from '../../../hooks/useAutoSync';

export const Step2Sync: React.FC = () => {
    const { videoFile, audioFile, setSyncOffset, syncOffset, setStep } = useAppStore();
    const { phase, progress, result, error, runSync, reset } = useAutoSync();

    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [zoom, setZoom] = useState(50);

    // Audio elements for preview playback
    const videoAudioRef = useRef<HTMLAudioElement | null>(null);
    const externalAudioRef = useRef<HTMLAudioElement | null>(null);
    const videoUrlRef = useRef<string>('');
    const audioUrlRef = useRef<string>('');

    // WaveSurfer refs for preview waveforms (read-only, shown in done state)
    const previewVideoContainer = useRef<HTMLDivElement>(null);
    const previewAudioContainer = useRef<HTMLDivElement>(null);
    const previewVideoWs = useRef<WaveSurfer | null>(null);
    const previewAudioWs = useRef<WaveSurfer | null>(null);

    // WaveSurfer refs for manual mode (interactive, draggable)
    const manualVideoContainer = useRef<HTMLDivElement>(null);
    const manualAudioContainer = useRef<HTMLDivElement>(null);
    const manualVideoWs = useRef<WaveSurfer | null>(null);
    const manualAudioWs = useRef<WaveSurfer | null>(null);

    // Drag state for manual mode
    const dragStartX = useRef<number | null>(null);
    const draggingOffsetStart = useRef<number>(0);
    const audioOffsetRef = useRef(syncOffset);

    // Create object URLs for preview playback
    useEffect(() => {
        if (videoFile) {
            videoUrlRef.current = URL.createObjectURL(videoFile);
        }
        if (audioFile) {
            audioUrlRef.current = URL.createObjectURL(audioFile);
        }
        return () => {
            if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
            if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        };
    }, [videoFile, audioFile]);

    // Apply sync result to store
    useEffect(() => {
        if (result) {
            setSyncOffset(result.offsetSeconds);
            audioOffsetRef.current = result.offsetSeconds;
        }
    }, [result, setSyncOffset]);

    // ── Preview Waveforms (read-only, shown in done state) ──
    useEffect(() => {
        if (phase !== 'done' || !videoFile || !audioFile) return;
        if (!previewVideoContainer.current || !previewAudioContainer.current) return;

        // Cleanup
        if (previewVideoWs.current) { previewVideoWs.current.destroy(); previewVideoWs.current = null; }
        if (previewAudioWs.current) { previewAudioWs.current.destroy(); previewAudioWs.current = null; }

        const videoUrl = URL.createObjectURL(videoFile);
        const audioUrl = URL.createObjectURL(audioFile);

        try {
            previewVideoWs.current = WaveSurfer.create({
                container: previewVideoContainer.current,
                waveColor: '#6366F1',
                progressColor: '#4338CA',
                cursorColor: 'transparent',
                height: 64,
                normalize: true,
                interact: false,
                hideScrollbar: true,
                barWidth: 2,
                barGap: 1,
                barRadius: 2,
            });
            previewVideoWs.current.load(videoUrl);

            previewAudioWs.current = WaveSurfer.create({
                container: previewAudioContainer.current,
                waveColor: '#10B981',
                progressColor: '#059669',
                cursorColor: 'transparent',
                height: 64,
                normalize: true,
                interact: false,
                hideScrollbar: true,
                barWidth: 2,
                barGap: 1,
                barRadius: 2,
            });
            previewAudioWs.current.load(audioUrl);
        } catch (e) {
            console.error('Preview waveform error:', e);
        }

        return () => {
            if (previewVideoWs.current) { previewVideoWs.current.destroy(); previewVideoWs.current = null; }
            if (previewAudioWs.current) { previewAudioWs.current.destroy(); previewAudioWs.current = null; }
            URL.revokeObjectURL(videoUrl);
            URL.revokeObjectURL(audioUrl);
        };
    }, [phase, videoFile, audioFile]);

    // ── Manual Mode Waveforms (interactive, draggable) ──
    useEffect(() => {
        if (!showManual || !videoFile || !audioFile) return;
        if (!manualVideoContainer.current || !manualAudioContainer.current) return;

        // Cleanup
        if (manualVideoWs.current) { manualVideoWs.current.destroy(); manualVideoWs.current = null; }
        if (manualAudioWs.current) { manualAudioWs.current.destroy(); manualAudioWs.current = null; }

        const videoUrl = URL.createObjectURL(videoFile);
        const audioUrl = URL.createObjectURL(audioFile);

        try {
            manualVideoWs.current = WaveSurfer.create({
                container: manualVideoContainer.current,
                waveColor: '#6366F1',
                progressColor: '#4338CA',
                cursorColor: '#EF4444',
                autoCenter: true,
                height: 100,
                normalize: true,
                minPxPerSec: 10,
                interact: true,
                hideScrollbar: false,
                autoScroll: true,
            });

            manualAudioWs.current = WaveSurfer.create({
                container: manualAudioContainer.current,
                waveColor: '#10B981',
                progressColor: '#059669',
                cursorColor: 'transparent',
                autoCenter: false,
                height: 100,
                normalize: true,
                minPxPerSec: 10,
                interact: false,
                hideScrollbar: true,
                autoScroll: false,
            });

            manualVideoWs.current.load(videoUrl);
            manualAudioWs.current.load(audioUrl);

            // Apply zoom once ready
            manualVideoWs.current.on('ready', () => {
                try { manualVideoWs.current?.zoom(zoom); } catch (_) { /* */ }
            });
            manualAudioWs.current.on('ready', () => {
                try { manualAudioWs.current?.zoom(zoom); } catch (_) { /* */ }
                updateAudioVisualPosition(audioOffsetRef.current);
            });
        } catch (e) {
            console.error('Manual waveform error:', e);
        }

        return () => {
            if (manualVideoWs.current) { manualVideoWs.current.destroy(); manualVideoWs.current = null; }
            if (manualAudioWs.current) { manualAudioWs.current.destroy(); manualAudioWs.current = null; }
            URL.revokeObjectURL(videoUrl);
            URL.revokeObjectURL(audioUrl);
        };
    }, [showManual, videoFile, audioFile]);

    // Zoom effect for manual mode
    useEffect(() => {
        if (!showManual) return;
        try {
            manualVideoWs.current?.zoom(zoom);
            manualAudioWs.current?.zoom(zoom);
        } catch (_) { /* */ }
        updateAudioVisualPosition(audioOffsetRef.current);
    }, [zoom, showManual]);

    const updateAudioVisualPosition = (offsetTime: number) => {
        if (manualAudioContainer.current) {
            const pixelOffset = offsetTime * zoom;
            manualAudioContainer.current.style.transform = `translateX(${pixelOffset}px)`;
        }
    };

    // ── Handlers ──

    const handleAutoSync = useCallback(() => {
        if (videoFile && audioFile) {
            runSync(videoFile, audioFile);
        }
    }, [videoFile, audioFile, runSync]);

    const handlePreviewToggle = useCallback(() => {
        if (!videoAudioRef.current || !externalAudioRef.current) return;

        if (isPreviewPlaying) {
            videoAudioRef.current.pause();
            externalAudioRef.current.pause();
            setIsPreviewPlaying(false);
        } else {
            const offset = syncOffset;
            if (offset >= 0) {
                externalAudioRef.current.currentTime = 0;
                videoAudioRef.current.currentTime = offset;
            } else {
                videoAudioRef.current.currentTime = 0;
                externalAudioRef.current.currentTime = -offset;
            }
            videoAudioRef.current.play();
            externalAudioRef.current.play();
            setIsPreviewPlaying(true);
        }
    }, [isPreviewPlaying, syncOffset]);

    const handleNudge = (amount: number) => {
        const newOffset = syncOffset + amount;
        setSyncOffset(newOffset);
        audioOffsetRef.current = newOffset;
        updateAudioVisualPosition(newOffset);
    };

    const handleConfirm = () => {
        videoAudioRef.current?.pause();
        externalAudioRef.current?.pause();
        setStep(3);
    };

    // Drag handlers for manual mode
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (dragStartX.current === null) return;
        const deltaPixels = e.clientX - dragStartX.current;
        const deltaSeconds = deltaPixels / zoom;
        const newOffset = draggingOffsetStart.current + deltaSeconds;
        audioOffsetRef.current = newOffset;
        setSyncOffset(newOffset);
        updateAudioVisualPosition(newOffset);
    }, [zoom, setSyncOffset]);

    const handleMouseUp = useCallback(() => {
        dragStartX.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        document.removeEventListener('mouseup', handleMouseUp);
    }, [handleMouseMove]);

    const handleMouseDown = (e: React.MouseEvent) => {
        dragStartX.current = e.clientX;
        draggingOffsetStart.current = audioOffsetRef.current;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // ── Render ──

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            {/* Hidden audio elements for preview */}
            <audio ref={videoAudioRef} src={videoUrlRef.current} preload="auto" />
            <audio ref={externalAudioRef} src={audioUrlRef.current} preload="auto" />

            {/* Header */}
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900">Ses Senkronizasyonu</h2>
                <p className="mt-2 text-gray-500">
                    Kamera sesini harici mikrofon kaydıyla hizalayın.
                </p>
            </div>

            {/* ── No audio file ── */}
            {!audioFile && (
                <div className="flex flex-col items-center">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 w-full max-w-md text-center">
                        <div className="mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50">
                                <CheckCircle size={32} className="text-blue-500" />
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Harici Ses Dosyası Yok
                        </h3>
                        <p className="text-gray-500 text-sm mb-8">
                            Harici mikrofon kaydı yüklenmediği için bu adımda bir işlem yapmanıza gerek yoktur.
                            Doğrudan düzenlemeye geçebilirsiniz.
                        </p>

                        <button
                            onClick={() => setStep(3)}
                            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl
                                hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/30
                                active:scale-[0.98] transition-all text-lg"
                        >
                            Düzenlemeye Devam Et
                        </button>
                    </div>
                </div>
            )}

            {/* ── Phase: Idle ── */}
            {audioFile && phase === 'idle' && (
                <div className="flex flex-col items-center">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 w-full max-w-md text-center">
                        <div className="mb-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                                <Wand2 size={36} className="text-white" />
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Otomatik Senkronizasyon
                        </h3>
                        <p className="text-gray-500 text-sm mb-8">
                            Ses dalgalarını analiz ederek otomatik hizalama yapacağız.
                        </p>

                        <button
                            onClick={handleAutoSync}
                            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl
                                hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/30
                                active:scale-[0.98] transition-all text-lg"
                        >
                            <div className="flex items-center justify-center gap-3">
                                <Wand2 size={22} />
                                Otomatik Eşle
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* ── Phase: Processing ── */}
            {phase === 'processing' && (
                <div className="flex flex-col items-center">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 w-full max-w-md text-center">
                        <div className="mb-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                                <Loader2 size={36} className="text-white animate-spin" />
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Ses Analiz Ediliyor...
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            En iyi hizalamayı bulmak için dalga formları karşılaştırılıyor.
                        </p>

                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">%{Math.round(progress * 100)}</p>
                    </div>
                </div>
            )}

            {/* ── Phase: Done ── */}
            {phase === 'done' && result && (
                <div className="flex flex-col items-center gap-6">
                    {/* Success header + offset */}
                    <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 w-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={24} className="text-green-600" />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Senkronizasyon Tamamlandı!
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        {result.confidence > 0.5 && 'Yüksek güvenilirlik ile eşleştirildi'}
                                        {result.confidence <= 0.5 && result.confidence > 0.2 && 'Orta güvenilirlik — manuel kontrol önerilir'}
                                        {result.confidence <= 0.2 && 'Düşük güvenilirlik — manuel düzenleme önerilir'}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl px-4 py-2 border border-gray-100 text-center">
                                <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Kayma</span>
                                <span className="text-lg font-mono font-bold text-blue-600">
                                    {syncOffset >= 0 ? '+' : ''}{syncOffset.toFixed(3)}s
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Waveform Preview (always visible) */}
                    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 w-full">
                        <div className="relative border-b border-slate-700 p-2">
                            <span className="absolute left-3 top-2 text-[10px] font-bold text-indigo-400 bg-slate-900/80 px-2 py-0.5 rounded z-10">
                                KAMERA
                            </span>
                            <div ref={previewVideoContainer} className="w-full h-[64px]" />
                        </div>
                        <div className="relative p-2">
                            <span className="absolute left-3 top-2 text-[10px] font-bold text-emerald-400 bg-slate-900/80 px-2 py-0.5 rounded z-10">
                                MİKROFON
                            </span>
                            <div ref={previewAudioContainer} className="w-full h-[64px]" />
                        </div>
                    </div>

                    {/* Manual adjust toggle */}
                    <button
                        onClick={() => setShowManual(!showManual)}
                        className={`flex items-center gap-2 text-sm transition-colors ${showManual ? 'text-blue-600 font-medium' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Settings2 size={14} />
                        {showManual ? 'Manuel Düzenlemeyi Gizle' : 'Olmadı, Manuel Düzenlemeye Geç'}
                    </button>

                    {/* ── Manual Mode: Full Interactive Waveforms ── */}
                    {showManual && (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 w-full">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center uppercase tracking-wider">
                                Manuel Hizalama
                            </h4>
                            <p className="text-xs text-gray-400 text-center mb-4">
                                Yeşil dalga formunu sürükleyerek kamera sesiyle hizalayın. Yakınlaştırarak hassas ayar yapabilirsiniz.
                            </p>

                            {/* Zoom controls */}
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <button
                                    onClick={() => setZoom(z => Math.max(10, z - 10))}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ZoomOut size={16} />
                                </button>
                                <span className="px-3 text-xs font-mono text-gray-500 w-14 text-center">{zoom}px</span>
                                <button
                                    onClick={() => setZoom(z => Math.min(500, z + 10))}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ZoomIn size={16} />
                                </button>
                            </div>

                            {/* Dual waveform editor */}
                            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 relative select-none">
                                {/* Center guideline */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                <div className="absolute left-1/2 top-2 -translate-x-1/2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded z-50 pointer-events-none font-mono">
                                    MERKEZ
                                </div>

                                {/* Video track (reference) */}
                                <div className="relative border-b border-slate-700 bg-slate-800/50">
                                    <span className="absolute left-3 top-2 text-[10px] font-bold text-indigo-400 bg-slate-900/80 px-2 py-0.5 rounded z-20">
                                        KAMERA (Referans)
                                    </span>
                                    <div ref={manualVideoContainer} className="w-full h-[100px]" />
                                </div>

                                {/* Audio track (draggable) */}
                                <div className="relative bg-slate-800/30">
                                    <span className="absolute left-3 top-2 text-[10px] font-bold text-emerald-400 bg-slate-900/80 px-2 py-0.5 rounded z-20 pointer-events-none">
                                        MİKROFON (Sürüklenebilir)
                                    </span>
                                    <div
                                        className="w-full overflow-hidden cursor-grab active:cursor-grabbing relative h-[100px]"
                                        onMouseDown={handleMouseDown}
                                    >
                                        <div ref={manualAudioContainer} className="w-full h-full transition-transform duration-75 ease-out will-change-transform" />
                                    </div>
                                </div>
                            </div>

                            {/* Fine tuning nudge buttons */}
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <button onClick={() => handleNudge(-0.1)} className="px-3 py-2 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-mono transition-colors">
                                    -0.1s
                                </button>
                                <button onClick={() => handleNudge(-0.01)} className="px-2 py-2 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-mono transition-colors">
                                    <ChevronLeft size={14} className="inline" /> -0.01s
                                </button>
                                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-center min-w-[100px]">
                                    <span className="block text-[10px] text-gray-400 uppercase">Kayma</span>
                                    <span className={`font-mono font-bold text-sm ${syncOffset !== 0 ? 'text-blue-600' : 'text-gray-700'}`}>
                                        {syncOffset >= 0 ? '+' : ''}{syncOffset.toFixed(3)}s
                                    </span>
                                </div>
                                <button onClick={() => handleNudge(0.01)} className="px-2 py-2 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-mono transition-colors">
                                    +0.01s <ChevronRight size={14} className="inline" />
                                </button>
                                <button onClick={() => handleNudge(0.1)} className="px-3 py-2 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-mono transition-colors">
                                    +0.1s
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Actions (always at bottom) ── */}
                    <div className="w-full max-w-md flex flex-col gap-3">
                        <button
                            onClick={handlePreviewToggle}
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl
                                hover:bg-gray-50 transition-colors font-medium shadow-sm"
                        >
                            {isPreviewPlaying ? <Pause size={18} /> : <Play size={18} />}
                            {isPreviewPlaying ? 'Önizlemeyi Durdur' : 'Sonucu Dinle'}
                        </button>

                        <button
                            onClick={handleConfirm}
                            className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl
                                hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-600/30
                                active:scale-[0.98] transition-all text-lg"
                        >
                            Onayla ve Devam Et
                        </button>
                    </div>
                </div>
            )}

            {/* ── Phase: Error ── */}
            {phase === 'error' && (
                <div className="flex flex-col items-center">
                    <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-10 w-full max-w-md text-center">
                        <div className="mb-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                                <AlertCircle size={32} className="text-red-600" />
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Senkronizasyon Başarısız
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            {error || 'Ses dosyaları otomatik olarak hizalanamadı.'}
                        </p>

                        <button
                            onClick={reset}
                            className="w-full py-3 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl
                                hover:bg-gray-200 transition-colors"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
