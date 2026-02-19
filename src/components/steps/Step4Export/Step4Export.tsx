import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    Download, ArrowLeft, Film, Volume2, Settings, Check,
    Loader2, Play, FileVideo, HardDrive, Clock, Sparkles
} from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';

/* ── Types ── */
type ExportFormat = 'mp4' | 'webm';
type ExportQuality = 'high' | 'medium' | 'low';
type ExportPhase = 'config' | 'processing' | 'done';

interface ExportConfig {
    format: ExportFormat;
    quality: ExportQuality;
    includeAudio: boolean;
    applyCuts: boolean;
}

const QUALITY_LABELS: Record<ExportQuality, { label: string; desc: string; icon: string }> = {
    high: { label: 'Yüksek Kalite', desc: 'Orijinal çözünürlük, büyük dosya', icon: '🎬' },
    medium: { label: 'Orta Kalite', desc: 'Dengeli boyut ve kalite', icon: '📹' },
    low: { label: 'Düşük Kalite', desc: 'Hızlı dışa aktarım, küçük dosya', icon: '📱' },
};

const FORMAT_LABELS: Record<ExportFormat, { label: string; desc: string }> = {
    mp4: { label: 'MP4 (H.264)', desc: 'En yaygın format, her yerde oynatılır' },
    webm: { label: 'WebM (VP9)', desc: 'Web dostu, küçük boyut' },
};

const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
};

const fmtSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const Step4Export: React.FC = () => {
    const { videoFile, audioFile, syncOffset, cuts, setStep } = useAppStore();

    const [phase, setPhase] = useState<ExportPhase>('config');
    const [config, setConfig] = useState<ExportConfig>({
        format: 'mp4',
        quality: 'high',
        includeAudio: !!audioFile,
        applyCuts: cuts.length > 0,
    });
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState('');
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [outputUrl, setOutputUrl] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup URLs
    useEffect(() => {
        return () => {
            if (outputUrl) URL.revokeObjectURL(outputUrl);
        };
    }, [outputUrl]);

    // Timer for elapsed time during processing
    useEffect(() => {
        if (phase === 'processing') {
            setElapsedTime(0);
            timerRef.current = setInterval(() => setElapsedTime(t => t + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase]);

    /* ── Estimated file size ── */
    const estimatedSize = videoFile
        ? (() => {
            const baseSize = videoFile.size;
            const qualityMultiplier = config.quality === 'high' ? 1 : config.quality === 'medium' ? 0.6 : 0.3;
            const formatMultiplier = config.format === 'webm' ? 0.7 : 1;
            let cutReduction = 1;
            if (config.applyCuts && cuts.length > 0 && videoFile) {
                // Rough estimate: we don't know total duration here, so estimate ~80%
                cutReduction = 0.8;
            }
            return Math.round(baseSize * qualityMultiplier * formatMultiplier * cutReduction);
        })()
        : 0;

    /* ── Export handler (simulated — real FFmpeg would run here) ── */
    const handleExport = useCallback(async () => {
        if (!videoFile) return;

        setPhase('processing');
        setProgress(0);

        // Simulate export stages
        const stages = [
            { label: 'Medya dosyaları okunuyor...', duration: 800, to: 0.15 },
            { label: 'Ses senkronizasyonu uygulanıyor...', duration: 600, to: 0.25 },
            { label: 'Kesimler işleniyor...', duration: config.applyCuts ? 1200 : 200, to: 0.45 },
            { label: 'Video kodlanıyor...', duration: 2500, to: 0.85 },
            { label: 'Ses birleştiriliyor...', duration: config.includeAudio ? 800 : 200, to: 0.95 },
            { label: 'Son düzenlemeler...', duration: 400, to: 1.0 },
        ];

        for (const stage of stages) {
            setProgressLabel(stage.label);
            await new Promise(resolve => setTimeout(resolve, stage.duration));
            setProgress(stage.to);
        }

        // Create a dummy output blob (in a real app, this would be the FFmpeg output)
        const blob = new Blob([await videoFile.arrayBuffer()], {
            type: config.format === 'mp4' ? 'video/mp4' : 'video/webm',
        });
        const url = URL.createObjectURL(blob);

        setOutputBlob(blob);
        setOutputUrl(url);
        setPhase('done');
    }, [videoFile, config]);

    /* ── Download ── */
    const handleDownload = useCallback(() => {
        if (!outputUrl || !videoFile) return;
        const name = videoFile.name.replace(/\.[^/.]+$/, '');
        const ext = config.format;
        const a = document.createElement('a');
        a.href = outputUrl;
        a.download = `${name}_podcut.${ext}`;
        a.click();
    }, [outputUrl, config.format, videoFile]);

    /* ── Render ── */
    return (
        <div className="max-w-4xl mx-auto py-8 px-4">

            {/* ── Config Phase ── */}
            {phase === 'config' && (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Dışa Aktar</h2>
                            <p className="text-sm text-gray-500">Çıktı ayarlarını seçin ve videonuzu kaydedin.</p>
                        </div>
                        <button
                            onClick={() => setStep(3)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                        >
                            <ArrowLeft size={16} /> Geri
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Settings */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Format */}
                            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Film size={18} className="text-gray-500" />
                                    <h3 className="font-semibold text-gray-800">Video Formatı</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {(Object.entries(FORMAT_LABELS) as [ExportFormat, typeof FORMAT_LABELS['mp4']][]).map(([key, val]) => (
                                        <button
                                            key={key}
                                            onClick={() => setConfig(c => ({ ...c, format: key }))}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${config.format === key
                                                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                                                    : 'border-gray-100 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-sm text-gray-800">{val.label}</span>
                                                {config.format === key && <Check size={16} className="text-blue-600" />}
                                            </div>
                                            <span className="text-xs text-gray-400">{val.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Quality */}
                            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Settings size={18} className="text-gray-500" />
                                    <h3 className="font-semibold text-gray-800">Kalite</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {(Object.entries(QUALITY_LABELS) as [ExportQuality, typeof QUALITY_LABELS['high']][]).map(([key, val]) => (
                                        <button
                                            key={key}
                                            onClick={() => setConfig(c => ({ ...c, quality: key }))}
                                            className={`p-4 rounded-xl border-2 text-center transition-all ${config.quality === key
                                                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                                                    : 'border-gray-100 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <span className="text-2xl block mb-2">{val.icon}</span>
                                            <span className="font-semibold text-sm text-gray-800 block">{val.label}</span>
                                            <span className="text-[10px] text-gray-400">{val.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Options */}
                            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={18} className="text-gray-500" />
                                    <h3 className="font-semibold text-gray-800">Seçenekler</h3>
                                </div>
                                <div className="space-y-3">
                                    {audioFile && (
                                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Volume2 size={16} className="text-gray-500" />
                                                <div>
                                                    <span className="text-sm font-medium text-gray-800">Harici sesi dahil et</span>
                                                    <span className="text-xs text-gray-400 block">Senkronize edilen mikrofon kaydı</span>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={config.includeAudio}
                                                onChange={e => setConfig(c => ({ ...c, includeAudio: e.target.checked }))}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </label>
                                    )}
                                    {cuts.length > 0 && (
                                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <FileVideo size={16} className="text-gray-500" />
                                                <div>
                                                    <span className="text-sm font-medium text-gray-800">Kesimleri uygula</span>
                                                    <span className="text-xs text-gray-400 block">{cuts.length} kesim bölümü çıkarılacak</span>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={config.applyCuts}
                                                onChange={e => setConfig(c => ({ ...c, applyCuts: e.target.checked }))}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Summary & Export button */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sticky top-6">
                                <h3 className="font-semibold text-gray-800 mb-4">Özet</h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Kaynak</span>
                                        <span className="font-medium text-gray-800 truncate max-w-[150px]">
                                            {videoFile?.name || '—'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Format</span>
                                        <span className="font-medium text-gray-800">{FORMAT_LABELS[config.format].label}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Kalite</span>
                                        <span className="font-medium text-gray-800">{QUALITY_LABELS[config.quality].label}</span>
                                    </div>
                                    {audioFile && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Harici ses</span>
                                            <span className={`font-medium ${config.includeAudio ? 'text-green-600' : 'text-gray-400'}`}>
                                                {config.includeAudio ? 'Dahil' : 'Hariç'}
                                            </span>
                                        </div>
                                    )}
                                    {cuts.length > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Kesimler</span>
                                            <span className={`font-medium ${config.applyCuts ? 'text-green-600' : 'text-gray-400'}`}>
                                                {config.applyCuts ? `${cuts.length} bölüm` : 'Uygulanmayacak'}
                                            </span>
                                        </div>
                                    )}
                                    {syncOffset !== 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Ses kaydırma</span>
                                            <span className="font-mono font-medium text-blue-600">
                                                {syncOffset >= 0 ? '+' : ''}{syncOffset.toFixed(3)}s
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-6">
                                    <div className="flex items-center gap-2 text-sm">
                                        <HardDrive size={14} className="text-gray-400" />
                                        <span className="text-gray-500">Tahmini boyut:</span>
                                        <span className="font-semibold text-gray-800">{fmtSize(estimatedSize)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleExport}
                                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl
                                        hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/30
                                        active:scale-[0.98] transition-all text-lg"
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <Download size={22} />
                                        Dışa Aktar
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── Processing Phase ── */}
            {phase === 'processing' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 w-full max-w-lg text-center">
                        <div className="mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                                <Loader2 size={36} className="text-white animate-spin" />
                            </div>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Video İşleniyor
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            {progressLabel}
                        </p>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden mb-3 shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out relative"
                                style={{ width: `${Math.round(progress * 100)}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>%{Math.round(progress * 100)}</span>
                            <span className="flex items-center gap-1">
                                <Clock size={12} /> {fmtTime(elapsedTime)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Done Phase ── */}
            {phase === 'done' && outputBlob && (
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="bg-white rounded-2xl shadow-xl border border-green-100 p-10 w-full max-w-lg text-center">
                        <div className="mb-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 shadow-lg shadow-green-100">
                                <Check size={40} className="text-green-600" />
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Dışa Aktarım Tamamlandı! 🎉
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Videonuz başarıyla işlendi ve indirilmeye hazır.
                        </p>

                        {/* Video preview */}
                        {outputUrl && (
                            <div className="bg-black rounded-xl overflow-hidden mb-6 aspect-video">
                                <video
                                    src={outputUrl}
                                    className="w-full h-full object-contain"
                                    controls
                                    playsInline
                                />
                            </div>
                        )}

                        {/* File info */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 text-left">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-400 block text-xs">Format</span>
                                    <span className="font-medium text-gray-800">{config.format.toUpperCase()}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-xs">Boyut</span>
                                    <span className="font-medium text-gray-800">{fmtSize(outputBlob.size)}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-xs">Kalite</span>
                                    <span className="font-medium text-gray-800">{QUALITY_LABELS[config.quality].label}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block text-xs">Süre</span>
                                    <span className="font-medium text-gray-800">{fmtTime(elapsedTime)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <button
                            onClick={handleDownload}
                            className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl
                                hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-600/30
                                active:scale-[0.98] transition-all text-lg mb-3"
                        >
                            <div className="flex items-center justify-center gap-3">
                                <Download size={22} />
                                Videoyu İndir
                            </div>
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setPhase('config'); setOutputBlob(null); }}
                                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
                            >
                                Farklı Ayarlarla Dışa Aktar
                            </button>
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
                            >
                                Yeni Proje Başlat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
