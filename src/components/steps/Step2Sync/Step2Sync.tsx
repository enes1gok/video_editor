import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../../store/useAppStore';
import { formatTime } from '../../../utils/time';

// We'll use a simplified drag approach:
// Two waveforms. Top one is fixed (Video). Bottom one is draggable (Audio).
// We'll use a container with overflow-hidden for the view.
// The "offset" state tracks the time difference.

export const Step2Sync: React.FC = () => {
    const { videoFile, audioFile, setSyncOffset, syncOffset, setStep } = useAppStore();
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [zoom, setZoom] = useState(50); // px per second

    const videoWaveContainer = useRef<HTMLDivElement>(null);
    const audioWaveContainer = useRef<HTMLDivElement>(null);
    const videoWs = useRef<WaveSurfer | null>(null);
    const audioWs = useRef<WaveSurfer | null>(null);

    // Create refs for synchronization loop
    const isPlayingRef = useRef(false);
    const audioOffsetRef = useRef(syncOffset); // current offset in seconds

    useEffect(() => {
        if (!videoFile || !audioFile || !videoWaveContainer.current || !audioWaveContainer.current) return;

        // Initialize Video Waveform (Reference)
        videoWs.current = WaveSurfer.create({
            container: videoWaveContainer.current,
            waveColor: '#4F46E5', // Indigo-600
            progressColor: '#312E81',
            cursorColor: '#EF4444',
            height: 100,
            normalize: true,
            minPxPerSec: zoom,
            interact: false, // User clicks playhead on container wrapper, not individual waves usually?
            // Actually, we want shared interaction.
            hideScrollbar: false,
        });

        // Initialize Audio Waveform (Draggable/Offsetable)
        audioWs.current = WaveSurfer.create({
            container: audioWaveContainer.current,
            waveColor: '#10B981', // Emerald-500
            progressColor: '#065F46',
            cursorColor: 'transparent', // Hide cursor on second track to avoid confusion? Or show aligned?
            height: 100,
            normalize: true,
            minPxPerSec: zoom,
            interact: false,
            hideScrollbar: true,
        });

        // Load media
        const videoUrl = URL.createObjectURL(videoFile);
        const audioUrl = URL.createObjectURL(audioFile);

        videoWs.current.load(videoUrl);
        audioWs.current.load(audioUrl);

        videoWs.current.on('ready', (d) => {
            setDuration(prev => Math.max(prev, d));
        });
        audioWs.current.on('ready', (d) => {
            setDuration(prev => Math.max(prev, d));
        });

        // Sync Playback Logic
        // When video plays, checking time and updating audio pos
        videoWs.current.on('play', () => {
            setIsPlaying(true);
            isPlayingRef.current = true;
            // Start audio with offset
            const vidTime = videoWs.current?.getCurrentTime() || 0;
            const audTime = vidTime - audioOffsetRef.current;
            if (audTime >= 0) {
                audioWs.current?.setTime(audTime);
                audioWs.current?.play();
            } else {
                // Audio starts later. Schedule it? 
                // For simplicity, just play from 0 if offset is positive (audio later), 
                // but here offset relative to video start.
                // offset > 0 means audio is DELAYED (starts after video). 
                // offset < 0 means audio starts BEFORE video.
                // Let's standardise: syncOffset = amount of seconds to SHIFT audio RIGHT.

                // If vidTime is 0, and offset is 2s. Audio should wait 2s.
                // If vidTime is 2s, and offset is 2s. Audio should start at 0s.
                const delay = -1 * audTime; // if audTime is negative, we need to wait
                if (delay > 0) {
                    setTimeout(() => {
                        if (isPlayingRef.current) audioWs.current?.play();
                    }, delay * 1000);
                } else {
                    audioWs.current?.setTime(audTime);
                    audioWs.current?.play();
                }
            }
        });

        videoWs.current.on('pause', () => {
            setIsPlaying(false);
            isPlayingRef.current = false;
            audioWs.current?.pause();
        });

        videoWs.current.on('seeking', (currentTime) => {
            const offset = audioOffsetRef.current;
            const audTime = currentTime - offset;
            if (audTime >= 0) {
                audioWs.current?.setTime(audTime);
            } else {
                audioWs.current?.setTime(0);
            }
        });

        // Cleanup
        return () => {
            videoWs.current?.destroy();
            audioWs.current?.destroy();
            URL.revokeObjectURL(videoUrl);
            URL.revokeObjectURL(audioUrl);
        };
    }, [videoFile, audioFile, zoom]);

    // Drag / Nudge Handling
    // We'll use a simple slider for now to update offsetRef and verify visual sync.
    // Visual sync: We need to shift the rendering of the bottom waveform.
    // Wavesurfer doesn't natively support "shifting" existence on the timeline container easily without plugins or CSS transform.
    // CSS transform on the container is the smoothest visual cue.

    const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setSyncOffset(val);
        audioOffsetRef.current = val;

        // Update visual position
        // 1 sec = zoom pixels.
        const pixelOffset = val * zoom;
        if (audioWaveContainer.current) {
            audioWaveContainer.current.style.transform = `translateX(${pixelOffset}px)`;
        }

        // Also seek audio to match new time if playing/paused
        if (videoWs.current && audioWs.current) {
            const vidTime = videoWs.current.getCurrentTime();
            const audTime = vidTime - val;
            if (audTime >= 0) audioWs.current.setTime(audTime);
        }
    };

    const togglePlay = () => {
        if (videoWs.current) {
            videoWs.current.playPause();
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Synchronize Audio</h2>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 mr-4 bg-gray-100 p-2 rounded-lg">
                        <span className="text-xs font-semibold text-gray-500">ZOOM</span>
                        <input
                            type="range"
                            min="10"
                            max="200"
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-24 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <button onClick={togglePlay} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <button
                        onClick={() => setStep(3)}
                        className="px-6 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700"
                    >
                        Confirm Sync & Edit
                    </button>
                </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 mb-8 overflow-hidden relative" style={{ minHeight: '300px' }}>
                {/* Timeline Ruler (Simplified) */}
                <div className="text-gray-400 text-sm mb-2 text-right">{formatTime(duration)}</div>

                {/* Video Track */}
                <div className="relative mb-4">
                    <div className="absolute left-0 top-0 text-xs text-white bg-indigo-600 px-2 py-1 rounded z-10">Video Audio</div>
                    <div ref={videoWaveContainer} className="w-full" />
                </div>

                {/* External Audio Track */}
                <div className="relative overflow-hidden pl-[0px]" style={{ /* Padding if needed */ }}>
                    <div className="absolute left-0 top-0 text-xs text-white bg-emerald-600 px-2 py-1 rounded z-10">External Audio</div>
                    {/* This container moves */}
                    <div ref={audioWaveContainer} className="w-full transition-transform duration-75 ease-out" />
                </div>

                {/* Center Line for visual sync (optional) */}
                <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-red-500 opacity-50 pointer-events-none" style={{ left: '0%' }} />
            </div>

            {/* Controls */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sync Offset (seconds): {syncOffset.toFixed(2)}s
                </label>
                <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.05"
                    value={syncOffset}
                    onChange={handleOffsetChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>-5s (Audio earlier)</span>
                    <span>0s</span>
                    <span>+5s (Audio later)</span>
                </div>
                <p className="text-sm text-gray-500 mt-4 flex items-center">
                    <AlertCircle size={16} className="mr-2" />
                    Drag the slider to align the green waveform with the blue one. Look for similar peaks (e.g. "Iii" sounds).
                </p>
            </div>
        </div>
    );
};
