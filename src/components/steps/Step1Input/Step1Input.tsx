import React from 'react';
import { FileVideo, FileAudio, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { useFilePicker } from '../../../hooks/useFilePicker';

const FileCard: React.FC<{
    type: 'video' | 'audio';
    file: File | null;
    onPick: () => void;
    isLoading: boolean;
}> = ({ type, file, onPick, isLoading }) => {
    const isVideo = type === 'video';
    const Icon = isVideo ? FileVideo : FileAudio;
    const label = isVideo ? 'Video Source (Camera)' : 'Audio Source (Microphone)';
    const accept = isVideo
        ? { 'video/*': ['.mp4', '.mov', '.webm', '.mkv'] }
        : { 'audio/*': ['.mp3', '.wav', '.aac', '.m4a'] };

    return (
        <div
            className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer
        ${file
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }
      `}
            onClick={onPick}
        >
            {file ? (
                <>
                    <div className="absolute top-4 right-4 text-green-600">
                        <CheckCircle size={24} />
                    </div>
                    <Icon size={48} className="text-green-600 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
                    <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </>
            ) : (
                <>
                    <Icon size={48} className="text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{label}</h3>
                    <p className="text-sm text-gray-500 text-center">
                        Click to select or drag & drop<br />
                        <span className="text-xs opacity-75">
                            {isVideo ? 'MP4, MOV, WebM' : 'MP3, WAV, AAC'}
                        </span>
                    </p>
                    {isLoading && <p className="text-sm text-blue-600 mt-2">Loading...</p>}
                </>
            )}
        </div>
    );
};

export const Step1Input: React.FC = () => {
    const { videoFile, audioFile, setVideoFile, setAudioFile, setStep } = useAppStore();

    const videoPicker = useFilePicker({
        accept: { 'video/*': ['.mp4', '.mov', '.webm', '.mkv'] }
    });

    const audioPicker = useFilePicker({
        accept: { 'audio/*': ['.mp3', '.wav', '.aac', '.m4a'] }
    });

    const handlePickVideo = async () => {
        const file = await videoPicker.pickFile();
        if (file) setVideoFile(file);
    };

    const handlePickAudio = async () => {
        const file = await audioPicker.pickFile();
        if (file) setAudioFile(file);
    };

    const canProceed = !!videoFile && !!audioFile;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900">Upload Your Media</h2>
                <p className="mt-2 text-gray-600">Select the camera recording and the high-quality microphone audio.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
                <FileCard
                    type="video"
                    file={videoFile}
                    onPick={handlePickVideo}
                    isLoading={videoPicker.isLoading}
                />
                <FileCard
                    type="audio"
                    file={audioFile}
                    onPick={handlePickAudio}
                    isLoading={audioPicker.isLoading}
                />
            </div>

            <div className="flex justify-center">
                <button
                    onClick={() => canProceed && setStep(2)}
                    disabled={!canProceed}
                    className={`
            flex items-center px-8 py-3 rounded-full text-lg font-semibold transition-all
            ${canProceed
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }
          `}
                >
                    Continue to Sync
                </button>
            </div>
        </div>
    );
};
