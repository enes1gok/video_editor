import React from 'react';
import { FileVideo, FileAudio, CheckCircle, X, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { useFilePicker } from '../../../hooks/useFilePicker';

const FileCard: React.FC<{
    type: 'video' | 'audio';
    file: File | null;
    onPick: () => void;
    onRemove: () => void;
    isLoading: boolean;
    warning?: string | null;
    error?: string | null;
}> = ({ type, file, onPick, onRemove, isLoading, warning, error: errorMsg }) => {
    const isVideo = type === 'video';
    const Icon = isVideo ? FileVideo : FileAudio;
    const label = isVideo ? 'Video Kaynağı (Kamera)' : 'Ses Kaynağı (Mikrofon)';

    return (
        <div
            className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
                ${file
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
            onClick={file ? undefined : onPick}
        >
            {file ? (
                <>
                    <div className="absolute top-3 left-3 text-green-600">
                        <CheckCircle size={20} />
                    </div>

                    {/* Remove button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full
                            bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600
                            transition-colors"
                        title="Dosyayı kaldır"
                    >
                        <X size={16} />
                    </button>

                    <Icon size={44} className="text-green-600 mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 text-center truncate max-w-full">{file.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>

                    {/* Size warning banner */}
                    {warning && (
                        <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 w-full">
                            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                            <span className="text-xs text-amber-700">{warning}</span>
                        </div>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); onPick(); }}
                        className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                    >
                        Değiştir
                    </button>
                </>
            ) : (
                <>
                    <Icon size={48} className="text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{label}</h3>
                    {!isVideo && <span className="text-xs text-blue-500 font-medium mb-2">(İsteğe bağlı)</span>}
                    <p className="text-sm text-gray-500 text-center">
                        Seçmek için tıklayın veya sürükleyip bırakın<br />
                        <span className="text-xs opacity-75">
                            {isVideo ? 'MP4, MOV, WebM' : 'MP3, WAV, AAC'}
                        </span>
                    </p>
                    {isLoading && <p className="text-sm text-blue-600 mt-2">Yükleniyor...</p>}
                    {/* Error banner (e.g. file too large) */}
                    {errorMsg && (
                        <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-full">
                            <AlertCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                            <span className="text-xs text-red-700">{errorMsg}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export const Step1Input: React.FC = () => {
    const { videoFile, audioFile, setVideoFile, setAudioFile, setStep } = useAppStore();

    const videoPicker = useFilePicker({
        accept: { 'video/*': ['.mp4', '.mov', '.webm', '.mkv'] },
        type: 'video',
    });

    const audioPicker = useFilePicker({
        accept: { 'audio/*': ['.mp3', '.wav', '.aac', '.m4a'] },
        type: 'audio',
    });

    const handlePickVideo = async () => {
        const file = await videoPicker.pickFile();
        if (file) setVideoFile(file);
    };

    const handlePickAudio = async () => {
        const file = await audioPicker.pickFile();
        if (file) setAudioFile(file);
    };

    const canProceed = !!videoFile;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900">Medya Dosyalarını Yükle</h2>
                <p className="mt-2 text-gray-600">Kamera kaydını ve isteğe bağlı olarak harici mikrofon sesini seçin.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
                <FileCard
                    type="video"
                    file={videoFile}
                    onPick={handlePickVideo}
                    onRemove={() => setVideoFile(null)}
                    isLoading={videoPicker.isLoading}
                    warning={videoPicker.warning}
                    error={videoPicker.error}
                />
                <FileCard
                    type="audio"
                    file={audioFile}
                    onPick={handlePickAudio}
                    onRemove={() => setAudioFile(null)}
                    isLoading={audioPicker.isLoading}
                    warning={audioPicker.warning}
                    error={audioPicker.error}
                />
            </div>

            <div className="flex justify-center">
                <button
                    onClick={() => {
                        if (canProceed) {
                            setStep(audioFile ? 2 : 3);
                        }
                    }}
                    disabled={!canProceed}
                    className={`
                        flex items-center px-8 py-3 rounded-full text-lg font-semibold transition-all
                        ${canProceed
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }
                    `}
                >
                    {audioFile ? 'Senkronizasyona Devam Et' : 'Düzenlemeye Devam Et'}
                </button>
            </div>
        </div>
    );
};
