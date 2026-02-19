/**
 * Web Worker for CPU-intensive sync correlation.
 *
 * Receives two Float32Arrays (reference + target), runs normalize + findBestLag,
 * and posts back the result. This keeps the main thread free for UI.
 */

/* ── Constants (duplicated from autoSync.ts to keep worker self-contained) ── */
const TARGET_SAMPLE_RATE = 8000;
const ANALYSIS_CHUNK_SECONDS = 30;

/* ── Pure functions (same as autoSync.ts exports) ── */

function normalize(signal: Float32Array): Float32Array {
    let max = 0;
    for (let i = 0; i < signal.length; i++) {
        const abs = Math.abs(signal[i]);
        if (abs > max) max = abs;
    }
    if (max === 0) return signal;

    const result = new Float32Array(signal.length);
    for (let i = 0; i < signal.length; i++) {
        result[i] = signal[i] / max;
    }
    return result;
}

function computeCorrelation(
    ref: Float32Array,
    target: Float32Array,
    lag: number
): number {
    let sum = 0;
    let count = 0;

    for (let i = 0; i < ref.length; i++) {
        const targetIdx = i + lag;
        if (targetIdx < 0 || targetIdx >= target.length) continue;
        sum += ref[i] * target[targetIdx];
        count++;
    }

    return count > 0 ? sum / count : 0;
}

function findBestLag(
    reference: Float32Array,
    target: Float32Array,
    maxLagSamples: number
): { bestLag: number; confidence: number } {
    const chunkSize = Math.min(
        reference.length,
        target.length,
        TARGET_SAMPLE_RATE * ANALYSIS_CHUNK_SECONDS
    );
    const refChunk = reference.slice(0, chunkSize);

    let bestCorrelation = -Infinity;
    let bestLag = 0;
    let sumCorrelations = 0;
    let correlationCount = 0;

    const step = Math.max(1, Math.floor(maxLagSamples / 2000));

    // Phase 1: Coarse search
    for (let lag = -maxLagSamples; lag <= maxLagSamples; lag += step) {
        const corr = computeCorrelation(refChunk, target, lag);
        sumCorrelations += Math.abs(corr);
        correlationCount++;

        if (corr > bestCorrelation) {
            bestCorrelation = corr;
            bestLag = lag;
        }
    }

    // Phase 2: Fine search around best coarse candidate
    const fineRange = step * 2;
    for (let lag = bestLag - fineRange; lag <= bestLag + fineRange; lag++) {
        if (lag < -maxLagSamples || lag > maxLagSamples) continue;
        const corr = computeCorrelation(refChunk, target, lag);

        if (corr > bestCorrelation) {
            bestCorrelation = corr;
            bestLag = lag;
        }
    }

    const avgCorrelation = sumCorrelations / correlationCount;
    const confidence = avgCorrelation > 0
        ? Math.min(1, bestCorrelation / (avgCorrelation * 3))
        : 0;

    return { bestLag, confidence };
}

/* ── Worker message handler ── */

export interface SyncWorkerInput {
    videoSamples: Float32Array;
    audioSamples: Float32Array;
    maxOffsetSeconds: number;
    sampleRate: number;
}

export interface SyncWorkerOutput {
    offsetSeconds: number;
    confidence: number;
}

self.onmessage = (e: MessageEvent<SyncWorkerInput>) => {
    const { videoSamples, audioSamples, maxOffsetSeconds, sampleRate } = e.data;

    // Step 1: Normalize
    const normVideo = normalize(videoSamples);
    const normAudio = normalize(audioSamples);

    // Step 2: Cross-correlate
    const maxLagSamples = Math.floor(maxOffsetSeconds * sampleRate);
    const { bestLag, confidence } = findBestLag(normVideo, normAudio, maxLagSamples);

    // Step 3: Convert to seconds
    const offsetSeconds = bestLag / sampleRate;

    const result: SyncWorkerOutput = { offsetSeconds, confidence };
    self.postMessage(result);
};
