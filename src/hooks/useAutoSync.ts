import { useState, useCallback } from 'react';
import { autoSyncFiles, type AutoSyncResult } from '../utils/autoSync';

export type SyncPhase = 'idle' | 'processing' | 'done' | 'error';

interface UseAutoSyncReturn {
    phase: SyncPhase;
    progress: number;
    result: AutoSyncResult | null;
    error: string | null;
    runSync: (videoFile: File, audioFile: File) => Promise<void>;
    reset: () => void;
}

export function useAutoSync(): UseAutoSyncReturn {
    const [phase, setPhase] = useState<SyncPhase>('idle');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<AutoSyncResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runSync = useCallback(async (videoFile: File, audioFile: File) => {
        setPhase('processing');
        setProgress(0);
        setResult(null);
        setError(null);

        try {
            const syncResult = await autoSyncFiles(videoFile, audioFile, (p) => {
                setProgress(p);
            });

            setResult(syncResult);
            setPhase('done');
        } catch (err) {
            console.error('Auto-sync failed:', err);
            setError(err instanceof Error ? err.message : 'Auto-sync failed');
            setPhase('error');
        }
    }, []);

    const reset = useCallback(() => {
        setPhase('idle');
        setProgress(0);
        setResult(null);
        setError(null);
    }, []);

    return { phase, progress, result, error, runSync, reset };
}
