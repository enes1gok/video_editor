import { create } from 'zustand';

export interface CutSegment {
    id: string;
    start: number; // seconds
    end: number;   // seconds
}

interface AppState {
    currentStep: number;
    videoFile: File | null;
    audioFile: File | null;
    syncOffset: number;
    cuts: CutSegment[];
    setStep: (step: number) => void;
    setVideoFile: (file: File | null) => void;
    setAudioFile: (file: File | null) => void;
    setSyncOffset: (offset: number) => void;
    setCuts: (cuts: CutSegment[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
    currentStep: 1,
    videoFile: null,
    audioFile: null,
    syncOffset: 0,
    cuts: [],
    setStep: (step) => set({ currentStep: step }),
    setVideoFile: (file) => set({ videoFile: file }),
    setAudioFile: (file) => set({ audioFile: file }),
    setSyncOffset: (offset) => set({ syncOffset: offset }),
    setCuts: (cuts) => set({ cuts }),
}));
