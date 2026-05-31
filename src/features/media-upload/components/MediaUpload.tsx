import React, { useState } from 'react';
import { FileVideo, FileAudio, X, AlertCircle, Plus, Star } from 'lucide-react';
import { useAppStore, type MediaFile } from '../../../app/store';
import { useFilePicker } from '../hooks/useFilePicker';
import { isTauri } from '../../../shared/utils/tauri';
import { ask } from '@tauri-apps/plugin-dialog';
import { Modal, Button } from '../../../shared/ui';

const EmptyCard: React.FC<{
    type: 'video' | 'audio';
    onPick: () => void;
    isLoading: boolean;
    error?: string | null;
}> = ({ type, onPick, isLoading, error: errorMsg }) => {
    const isVideo = type === 'video';
    const label = isVideo ? 'Video Ekle (Kamera)' : 'Ses Ekle (Mikrofon)';

    return (
        <div
            className="relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer border-border hover:border-accent hover:bg-accent-muted"
            onClick={onPick}
        >
            <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-4">
                <Plus size={24} className="text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-1">{label}</h3>
            {!isVideo && <span className="text-xs text-accent font-medium mb-2">(İsteğe bağlı)</span>}
            <p className="text-sm text-text-muted text-center">
                Seçmek için tıklayın veya sürükleyip bırakın<br />
                <span className="text-xs opacity-75">
                    {isVideo ? 'MP4, MOV, WebM' : 'MP3, WAV, AAC'}
                </span>
            </p>
            {isLoading && <p className="text-sm text-accent mt-2">Yükleniyor...</p>}
            {errorMsg && (
                <div className="mt-3 flex items-start gap-2 bg-danger-muted border border-danger rounded-lg px-3 py-2 w-full">
                    <AlertCircle size={14} className="text-danger mt-0.5 shrink-0" />
                    <span className="text-xs text-danger">{errorMsg}</span>
                </div>
            )}
        </div>
    );
};

const FileItem: React.FC<{
    mediaFile: MediaFile;
    type: 'video' | 'audio';
    onRemove: () => void;
    onSetMaster?: () => void;
}> = ({ mediaFile, type, onRemove, onSetMaster }) => {
    const isVideo = type === 'video';
    const Icon = isVideo ? FileVideo : FileAudio;
    const { name, size, isMaster } = mediaFile;

    return (
        <div className={`relative border rounded-xl p-4 flex items-center gap-4 transition-all duration-200 bg-elevated
            ${isMaster ? 'border-warning shadow-control' : 'border-border'}
        `}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0
                ${isMaster ? 'bg-warning-muted text-warning' : 'bg-accent-muted text-accent'}
            `}>
                <Icon size={24} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text truncate">{name}</h3>
                    {isMaster && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-warning-muted text-warning">
                            <Star size={10} className="fill-warning" /> MASTER
                        </span>
                    )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">{(size / (1024 * 1024)).toFixed(2)} MB</p>

                {isVideo && !isMaster && onSetMaster && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onSetMaster(); }}
                        className="mt-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                    >
                        Master Olarak Belirle
                    </button>
                )}
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-danger-muted text-danger hover:bg-danger hover:text-danger-fg transition-colors shrink-0"
                title="Dosyayı kaldır"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export const MediaUpload: React.FC = () => {
    const {
        videoFiles, audioFiles,
        addVideoFile, removeVideoFile, setMasterVideo,
        addAudioFile, removeAudioFile,
        setStep
    } = useAppStore();

    const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; type: 'video' | 'audio' } | null>(null);

    const videoPicker = useFilePicker({
        accept: { 'video/*': ['.mp4', '.mov', '.webm', '.mkv'] },
        type: 'video',
    });

    const audioPicker = useFilePicker({
        accept: { 'audio/*': ['.mp3', '.wav', '.aac', '.m4a'] },
        type: 'audio',
    });

    const handleRemoveVideo = async (id: string, name: string) => {
        if (isTauri()) {
            const confirmed = await ask(`${name} videosunu silmek istediğinize emin misiniz?`, {
                title: 'Dosyayı Sil',
                kind: 'warning',
                okLabel: 'Sil',
                cancelLabel: 'İptal'
            });
            if (confirmed) removeVideoFile(id);
        } else {
            setConfirmDelete({ id, name, type: 'video' });
        }
    };

    const handleRemoveAudio = async (id: string, name: string) => {
        if (isTauri()) {
            const confirmed = await ask(`${name} ses dosyasını silmek istediğinize emin misiniz?`, {
                title: 'Dosyayı Sil',
                kind: 'warning',
                okLabel: 'Sil',
                cancelLabel: 'İptal'
            });
            if (confirmed) removeAudioFile(id);
        } else {
            setConfirmDelete({ id, name, type: 'audio' });
        }
    };

    const handleConfirmDelete = () => {
        if (!confirmDelete) return;
        if (confirmDelete.type === 'video') removeVideoFile(confirmDelete.id);
        else removeAudioFile(confirmDelete.id);
        setConfirmDelete(null);
    };

    const handlePickVideo = async () => {
        const file = await videoPicker.pickFile();
        if (file) addVideoFile(file);
    };

    const handlePickAudio = async () => {
        const file = await audioPicker.pickFile();
        if (file) addAudioFile(file);
    };

    const canProceed = videoFiles.length > 0;

    return (
        <>
        <Modal
            open={!!confirmDelete}
            onClose={() => setConfirmDelete(null)}
            title="Dosyayı Sil"
            width={400}
        >
            <p className="text-text-2 text-sm mb-6">
                <span className="font-semibold text-text">{confirmDelete?.name}</span> dosyasını silmek istediğinize emin misiniz?
            </p>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)}>İptal</Button>
                <Button variant="danger" size="sm" onClick={handleConfirmDelete}>Sil</Button>
            </div>
        </Modal>
        <div className="max-w-full mx-auto px-4 pt-6">

            <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Videos Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-text flex items-center gap-2">
                            <FileVideo size={20} className="text-accent" />
                            Videolar ({videoFiles.length})
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {videoFiles.map(vf => (
                            <FileItem
                                key={vf.id}
                                mediaFile={vf}
                                type="video"
                                onRemove={() => handleRemoveVideo(vf.id, vf.name)}
                                onSetMaster={() => setMasterVideo(vf.id)}
                            />
                        ))}
                        <EmptyCard
                            type="video"
                            onPick={handlePickVideo}
                            isLoading={videoPicker.isLoading}
                            error={videoPicker.error}
                        />
                    </div>
                </div>

                {/* Audios Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-text flex items-center gap-2">
                            <FileAudio size={20} className="text-success" />
                            Ses Dosyaları ({audioFiles.length})
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {audioFiles.map(af => (
                            <FileItem
                                key={af.id}
                                mediaFile={af}
                                type="audio"
                                onRemove={() => handleRemoveAudio(af.id, af.name)}
                            />
                        ))}
                        <EmptyCard
                            type="audio"
                            onPick={handlePickAudio}
                            isLoading={audioPicker.isLoading}
                            error={audioPicker.error}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <Button
                    variant="primary"
                    size="lg"
                    disabled={!canProceed}
                    onClick={() => {
                        if (canProceed) {
                            const needsSync = videoFiles.length > 1 || audioFiles.length > 0;
                            setStep(needsSync ? 2 : 3);
                        }
                    }}
                >
                    {(videoFiles.length > 1 || audioFiles.length > 0) ? 'Senkronizasyona Devam Et' : 'Düzenlemeye Devam Et'}
                </Button>
            </div>
        </div>
        </>
    );
};
