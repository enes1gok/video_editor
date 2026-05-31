import React, { useState } from 'react';
import { Scissors, Trash2, Plus, AudioLines, Sparkles } from 'lucide-react';
import type { MediaFile } from '../../../app/store/types';
import { detectSilences } from '../../../shared/utils/audio';

import { useAppStore } from '../../../app/store';
import { useAutoSync } from '../../audio-sync/hooks/useAutoSync';
import { Button, Popover, RangeField, Modal, useToast } from '../../../shared/ui';

interface CutToolbarProps {
    markIn: number | null;
    currentTime: number;
    handleMarkIn: () => void;
    handleCutOut: () => void;
    masterVideo: MediaFile | undefined;
    cuts: { id: string; start: number; end: number }[];
    setCuts: (cuts: { id: string; start: number; end: number }[]) => void;
    fmtTime: (s: number) => string;
}

export const CutToolbar: React.FC<CutToolbarProps> = ({
    markIn,
    handleMarkIn,
    handleCutOut,
    masterVideo,
    cuts,
    setCuts,
    fmtTime,
}) => {
    const { videoFiles, audioFiles, setVideoMuted } = useAppStore();
    const { runMagicSync, phase, progress } = useAutoSync();
    const toast = useToast();

    const [isDetectingSilences, setIsDetectingSilences] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);
    // VAD options
    const [speechProbThreshold, setSpeechProbThreshold] = useState(0.6);
    const [minSilenceSec, setMinSilenceSec] = useState(0.5);
    const [preRollSec, setPreRollSec] = useState(0.15);
    const [postRollSec, setPostRollSec] = useState(0.2);
    const [mergeGapSec, setMergeGapSec] = useState(0.4);

    const handleMagicSync = async () => {
        if (videoFiles.length !== 2 || audioFiles.length !== 2) {
            toast.warning('Sihirli Senkronizasyon için 2 video ve 2 mikrofon sesi gerekli.');
            return;
        }
        try {
            await runMagicSync(videoFiles, audioFiles);
            // Senkronizasyon bittikten sonra kamera seslerini kapat
            setVideoMuted(videoFiles[0].id, true);
            setVideoMuted(videoFiles[1].id, true);
            toast.success('Senkronizasyon tamamlandı', { description: 'Kamera sesleri kapatıldı.' });
        } catch (e) {
            toast.error('Senkronizasyon başarısız', { description: e instanceof Error ? e.message : String(e) });
        }
    };

    const handleDetectSilences = async (close: () => void) => {
        if (!masterVideo) return;
        setIsDetectingSilences(true);
        try {
            const newCuts = await detectSilences(masterVideo, {
                speechProbThreshold, minSilenceSec, preRollSec, postRollSec, mergeGapSec,
            });
            if (newCuts.length > 0) {
                setCuts([...cuts, ...newCuts]);
                toast.success(`${newCuts.length} sessiz bölüm bulundu ve eklendi`);
            } else {
                toast.info('Belirtilen ayarlara uygun sessiz bölüm bulunamadı');
            }
            close();
        } catch (e: unknown) {
            const err = e instanceof Error ? e : new Error(String(e));
            console.error('Silence detection failed:', err);
            toast.error('Sessizlik algılama başarısız', { description: err.message });
        } finally {
            setIsDetectingSilences(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2 w-full">
                <Button variant="ai" fullWidth icon={Sparkles} loading={phase === 'processing'} onClick={handleMagicSync}>
                    {phase === 'processing' ? `Eşitleniyor… %${Math.round(progress * 100)}` : 'Sihirli Senkronizasyon'}
                </Button>

                <div className="h-px bg-border my-1" />

                <Popover
                    align="start"
                    width={400}
                    triggerClassName="flex w-full"
                    trigger={<Button variant="secondary" fullWidth icon={AudioLines}>Otomatik Kes</Button>}
                >
                    {(close) => (
                        <AutoCutSettings
                            speechProbThreshold={speechProbThreshold} setSpeechProbThreshold={setSpeechProbThreshold}
                            minSilenceSec={minSilenceSec} setMinSilenceSec={setMinSilenceSec}
                            preRollSec={preRollSec} setPreRollSec={setPreRollSec}
                            postRollSec={postRollSec} setPostRollSec={setPostRollSec}
                            mergeGapSec={mergeGapSec} setMergeGapSec={setMergeGapSec}
                            isDetecting={isDetectingSilences}
                            onDetect={() => handleDetectSilences(close)}
                        />
                    )}
                </Popover>

                {cuts.length > 0 && (
                    <Button variant="subtle" fullWidth icon={Trash2} onClick={() => setConfirmReset(true)}>
                        Sıfırla
                    </Button>
                )}
            </div>

            <div className="flex flex-col gap-2 w-full border-t border-border pt-3">
                <Button
                    variant={markIn !== null ? 'secondary' : 'subtle'}
                    fullWidth
                    icon={markIn !== null ? Trash2 : Plus}
                    onClick={handleMarkIn}
                >
                    {markIn !== null ? `İptal: ${fmtTime(markIn)}` : 'Başlangıç'}
                </Button>
                <Button variant="danger" fullWidth icon={Scissors} disabled={markIn === null} onClick={handleCutOut}>
                    Kes
                </Button>
            </div>

            <Modal
                open={confirmReset}
                onClose={() => setConfirmReset(false)}
                title="Tüm kesimleri sil"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setConfirmReset(false)}>Vazgeç</Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                setCuts([]);
                                setConfirmReset(false);
                                toast.success('Tüm kesimler silindi');
                            }}
                        >
                            Sil
                        </Button>
                    </>
                }
            >
                <span className="font-semibold text-text">{cuts.length}</span> kesim kalıcı olarak silinecek. Emin misiniz?
            </Modal>
        </div>
    );
};

/* ── Auto Cut Settings (popover content) ── */

interface AutoCutSettingsProps {
    speechProbThreshold: number; setSpeechProbThreshold: (v: number) => void;
    minSilenceSec: number; setMinSilenceSec: (v: number) => void;
    preRollSec: number; setPreRollSec: (v: number) => void;
    postRollSec: number; setPostRollSec: (v: number) => void;
    mergeGapSec: number; setMergeGapSec: (v: number) => void;
    isDetecting: boolean;
    onDetect: () => void;
}

const AutoCutSettings: React.FC<AutoCutSettingsProps> = ({
    speechProbThreshold, setSpeechProbThreshold, minSilenceSec, setMinSilenceSec,
    preRollSec, setPreRollSec, postRollSec, setPostRollSec, mergeGapSec, setMergeGapSec,
    isDetecting, onDetect,
}) => (
    <div>
        <h4 className="font-semibold text-text mb-4 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Yapay Zekâ (AI) Analizi
        </h4>
        <div className="space-y-4">
            <RangeField
                label="Konuşma Olasılık Eşiği"
                value={speechProbThreshold} onChange={setSpeechProbThreshold}
                min={0.1} max={0.95} step={0.05}
                displayValue={`${Math.round(speechProbThreshold * 100)}%`}
                aria-label="Konuşma olasılık eşiği"
            />
            <div className="h-px bg-border" />
            <div className="grid grid-cols-2 gap-4">
                <RangeField label="Başlangıç Boşluğu" value={preRollSec} onChange={setPreRollSec} min={0} max={0.5} step={0.05} suffix="s" displayValue={preRollSec.toFixed(2)} aria-label="Başlangıç boşluğu" />
                <RangeField label="Bitiş Boşluğu" value={postRollSec} onChange={setPostRollSec} min={0} max={0.5} step={0.05} suffix="s" displayValue={postRollSec.toFixed(2)} aria-label="Bitiş boşluğu" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <RangeField label="Küçük Boşluk Birleştir" value={mergeGapSec} onChange={setMergeGapSec} min={0.1} max={1.5} step={0.1} suffix="s" displayValue={mergeGapSec.toFixed(2)} aria-label="Küçük boşlukları birleştir" />
                <RangeField label="Min Sessizlik Sil" value={minSilenceSec} onChange={setMinSilenceSec} min={0.1} max={2} step={0.1} suffix="s" displayValue={minSilenceSec.toFixed(2)} aria-label="Minimum sessizlik süresi" />
            </div>
            <Button variant="primary" fullWidth icon={Scissors} loading={isDetecting} onClick={onDetect}>
                Analiz Et
            </Button>
        </div>
    </div>
);
