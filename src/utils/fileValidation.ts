/**
 * File size validation and memory estimation utilities.
 *
 * Browser-based decodeAudioData loads the entire file into memory.
 * These utilities provide safety guards against tab crashes.
 */

/* ── Limits (MB) ── */
export const FILE_SIZE_LIMITS = {
    VIDEO_WARN_MB: 500,
    VIDEO_MAX_MB: 2048,
    AUDIO_WARN_MB: 200,
    AUDIO_MAX_MB: 1024,
} as const;

/**
 * Empirical multiplier: raw PCM in memory ≈ 4–8× the compressed file size.
 * We use 6 as a conservative middle ground.
 */
export const MEMORY_MULTIPLIER = 6;

/** Maximum audio duration (seconds) to decode for sync correlation. */
export const MAX_DECODE_DURATION_S = 60;

/* ── Helpers ── */

const MB = 1024 * 1024;
const GB = 1024 * MB;

/**
 * Format bytes into a human-readable string (KB / MB / GB).
 */
export function formatFileSize(bytes: number): string {
    if (bytes < MB) {
        return `${(bytes / 1024).toFixed(0)} KB`;
    }
    if (bytes < GB) {
        return `${(bytes / MB).toFixed(1)} MB`;
    }
    return `${(bytes / GB).toFixed(2)} GB`;
}

/* ── Validation ── */

export interface FileSizeValidation {
    /** true if the file can be used */
    ok: boolean;
    /** Non-blocking warning message (file usable but risky) */
    warning?: string;
    /** Blocking error message (file rejected) */
    error?: string;
}

/**
 * Validate file size against thresholds.
 * Returns Turkish-language messages for the UI.
 */
export function validateFileSize(
    file: File,
    type: 'video' | 'audio'
): FileSizeValidation {
    const sizeMB = file.size / MB;
    const maxMB = type === 'video' ? FILE_SIZE_LIMITS.VIDEO_MAX_MB : FILE_SIZE_LIMITS.AUDIO_MAX_MB;
    const warnMB = type === 'video' ? FILE_SIZE_LIMITS.VIDEO_WARN_MB : FILE_SIZE_LIMITS.AUDIO_WARN_MB;
    const label = type === 'video' ? 'Video' : 'Ses';

    if (sizeMB > maxMB) {
        return {
            ok: false,
            error: `${label} dosyası çok büyük (${formatFileSize(file.size)}). Maksimum izin verilen boyut ${formatFileSize(maxMB * MB)}. Lütfen daha küçük bir dosya seçin.`,
        };
    }

    if (sizeMB > warnMB) {
        return {
            ok: true,
            warning: `${label} dosyası büyük (${formatFileSize(file.size)}). Tarayıcı performansı düşebilir veya bellek hatası oluşabilir.`,
        };
    }

    return { ok: true };
}

/**
 * Estimate peak memory usage (MB) when decoding a media file to raw PCM.
 */
export function estimateMemoryUsageMB(file: File): number {
    return (file.size / MB) * MEMORY_MULTIPLIER;
}
