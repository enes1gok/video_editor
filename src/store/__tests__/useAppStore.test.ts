import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
    beforeEach(() => {
        // Reset the store state before each test
        const { setState } = useAppStore;
        setState({
            currentStep: 1,
            videoFile: null,
            audioFile: null,
            syncOffset: 0,
            cuts: [],
        });
    });

    it('has correct initial state', () => {
        const state = useAppStore.getState();
        expect(state.currentStep).toBe(1);
        expect(state.videoFile).toBeNull();
        expect(state.audioFile).toBeNull();
        expect(state.syncOffset).toBe(0);
        expect(state.cuts).toEqual([]);
    });

    it('setStep updates currentStep', () => {
        useAppStore.getState().setStep(3);
        expect(useAppStore.getState().currentStep).toBe(3);
    });

    it('setSyncOffset updates syncOffset', () => {
        useAppStore.getState().setSyncOffset(1.5);
        expect(useAppStore.getState().syncOffset).toBe(1.5);
    });

    it('setSyncOffset handles negative values', () => {
        useAppStore.getState().setSyncOffset(-2.3);
        expect(useAppStore.getState().syncOffset).toBeCloseTo(-2.3);
    });

    it('setCuts stores and retrieves cut array', () => {
        const cuts = [
            { id: 'c1', start: 5, end: 10 },
            { id: 'c2', start: 20, end: 30 },
        ];
        useAppStore.getState().setCuts(cuts);
        expect(useAppStore.getState().cuts).toEqual(cuts);
    });

    it('setCuts replaces previous cuts entirely', () => {
        useAppStore.getState().setCuts([{ id: 'c1', start: 0, end: 5 }]);
        useAppStore.getState().setCuts([{ id: 'c2', start: 10, end: 15 }]);
        const { cuts } = useAppStore.getState();
        expect(cuts).toHaveLength(1);
        expect(cuts[0].id).toBe('c2');
    });

    it('multiple updates compose correctly', () => {
        const { setStep, setSyncOffset, setCuts } = useAppStore.getState();
        setStep(2);
        setSyncOffset(3.14);
        setCuts([{ id: 'x', start: 1, end: 2 }]);

        const state = useAppStore.getState();
        expect(state.currentStep).toBe(2);
        expect(state.syncOffset).toBeCloseTo(3.14);
        expect(state.cuts).toHaveLength(1);
    });
});
