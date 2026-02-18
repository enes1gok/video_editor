import { create } from 'zustand';

interface AppState {
    currentStep: number;
    videoFile: File | null;
    audioFile: File | null;
    syncOffset: number;
    setStep: (step: number) => void;
    setVideoFile: (file: File | null) => void;
    setAudioFile: (file: File | null) => void;
    setSyncOffset: (offset: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
    currentStep: 1,
    videoFile: null,
    audioFile: null,
    syncOffset: 0,
    setStep: (step) => set({ currentStep: step }),
    setVideoFile: (file) => set({ videoFile: file }),
    setAudioFile: (file) => set({ audioFile: file }),
    setSyncOffset: (offset) => set({ syncOffset: offset }),
}));
