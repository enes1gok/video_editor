/**
 * Auto-sync utility: finds the time offset between two audio tracks
 * using cross-correlation in the time domain.
 *
 * Both tracks should contain the same audio content recorded from
 * different sources (e.g., camera mic vs. external mic).
 */

export interface AutoSyncResult {
    /** Offset in seconds. Positive = audio starts later than video. */
    offsetSeconds: number;
    /** Confidence score 0–1. Higher = more reliable. */
    confidence: number;
}

const TARGET_SAMPLE_RATE = 8000; // Downsample to 8kHz for speed
const MAX_OFFSET_SECONDS = 30;  // Maximum expected drift between tracks

/**
 * Decode a File to mono Float32Array at a target sample rate.
 */
async function decodeToMono(file: File, sampleRate: number): Promise<Float32Array> {
    const arrayBuffer = await file.arrayBuffer();

    // Use OfflineAudioContext to decode & resample in one step
    const tempCtx = new AudioContext();
    const decoded = await tempCtx.decodeAudioData(arrayBuffer);
    await tempCtx.close();

    const duration = decoded.duration;
    const length = Math.ceil(duration * sampleRate);

    const offlineCtx = new OfflineAudioContext(1, length, sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();
    return rendered.getChannelData(0);
}

/**
 * Normalize a signal to [-1, 1] range.
 */
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

/**
 * Compute cross-correlation between two signals at various lag values.
 * Returns the lag (in samples) that produces the maximum correlation.
 */
function findBestLag(
    reference: Float32Array,
    target: Float32Array,
    maxLagSamples: number
): { bestLag: number; confidence: number } {
    // Use a chunk of the reference signal for correlation
    // (don't need the entire signal, just enough to find the pattern)
    const chunkSize = Math.min(reference.length, target.length, TARGET_SAMPLE_RATE * 10); // 10s chunk
    const refChunk = reference.slice(0, chunkSize);

    let bestCorrelation = -Infinity;
    let bestLag = 0;
    let sumCorrelations = 0;
    let correlationCount = 0;

    // Test lags from -maxLagSamples to +maxLagSamples
    // Negative lag = target starts before reference
    // Positive lag = target starts after reference
    const step = Math.max(1, Math.floor(maxLagSamples / 2000)); // Coarse search first

    // Phase 1: Coarse search
    const coarseCandidates: number[] = [];
    for (let lag = -maxLagSamples; lag <= maxLagSamples; lag += step) {
        const corr = computeCorrelation(refChunk, target, lag);
        sumCorrelations += Math.abs(corr);
        correlationCount++;

        if (corr > bestCorrelation) {
            bestCorrelation = corr;
            bestLag = lag;
        }
        coarseCandidates.push(lag);
    }

    // Phase 2: Fine search around the best coarse candidate
    const fineRange = step * 2;
    for (let lag = bestLag - fineRange; lag <= bestLag + fineRange; lag++) {
        if (lag < -maxLagSamples || lag > maxLagSamples) continue;
        const corr = computeCorrelation(refChunk, target, lag);

        if (corr > bestCorrelation) {
            bestCorrelation = corr;
            bestLag = lag;
        }
    }

    // Compute confidence: ratio of best correlation to average
    const avgCorrelation = sumCorrelations / correlationCount;
    const confidence = avgCorrelation > 0
        ? Math.min(1, bestCorrelation / (avgCorrelation * 3))
        : 0;

    return { bestLag, confidence };
}

/**
 * Compute normalized cross-correlation at a specific lag.
 */
function computeCorrelation(
    ref: Float32Array,
    target: Float32Array,
    lag: number
): number {
    const start = Math.max(0, -lag);
    const end = Math.min(ref.length, target.length - lag);

    if (start >= end) return 0;

    let sum = 0;
    for (let i = start; i < end; i++) {
        sum += ref[i] * target[i + lag];
    }

    return sum / (end - start);
}

/**
 * Main entry point: auto-sync two media files.
 *
 * @param videoFile - The video file (reference track)
 * @param audioFile - The external audio file (to be aligned)
 * @param onProgress - Optional progress callback (0-1)
 * @returns The offset and confidence
 */
export async function autoSyncFiles(
    videoFile: File,
    audioFile: File,
    onProgress?: (progress: number) => void
): Promise<AutoSyncResult> {
    onProgress?.(0.1);

    // Step 1: Decode both files to mono PCM
    const [videoSamples, audioSamples] = await Promise.all([
        decodeToMono(videoFile, TARGET_SAMPLE_RATE),
        decodeToMono(audioFile, TARGET_SAMPLE_RATE),
    ]);

    onProgress?.(0.4);

    // Step 2: Normalize both signals
    const normVideo = normalize(videoSamples);
    const normAudio = normalize(audioSamples);

    onProgress?.(0.5);

    // Step 3: Cross-correlate to find best alignment
    const maxLagSamples = Math.floor(MAX_OFFSET_SECONDS * TARGET_SAMPLE_RATE);
    const { bestLag, confidence } = findBestLag(normVideo, normAudio, maxLagSamples);

    onProgress?.(0.9);

    // Convert lag from samples to seconds
    const offsetSeconds = bestLag / TARGET_SAMPLE_RATE;

    onProgress?.(1.0);

    return {
        offsetSeconds,
        confidence,
    };
}
