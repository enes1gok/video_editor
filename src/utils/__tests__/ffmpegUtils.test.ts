import { describe, it, expect } from 'vitest';
import { getKeepSegments, buildFFmpegCommand } from '../ffmpegUtils';
import type { CutSegment } from '../../store/useAppStore';

/* ─── getKeepSegments ─── */

describe('getKeepSegments', () => {
    it('returns full duration when no cuts', () => {
        const result = getKeepSegments([], 60);
        expect(result).toEqual([{ start: 0, end: 60 }]);
    });

    it('returns two segments for a single middle cut', () => {
        const cuts: CutSegment[] = [{ id: '1', start: 10, end: 20 }];
        const result = getKeepSegments(cuts, 60);
        expect(result).toEqual([
            { start: 0, end: 10 },
            { start: 20, end: 60 },
        ]);
    });

    it('handles cut at the very start', () => {
        const cuts: CutSegment[] = [{ id: '1', start: 0, end: 10 }];
        const result = getKeepSegments(cuts, 60);
        expect(result).toEqual([{ start: 10, end: 60 }]);
    });

    it('handles cut at the very end', () => {
        const cuts: CutSegment[] = [{ id: '1', start: 50, end: 60 }];
        const result = getKeepSegments(cuts, 60);
        expect(result).toEqual([{ start: 0, end: 50 }]);
    });

    it('merges overlapping cuts', () => {
        const cuts: CutSegment[] = [
            { id: '1', start: 5, end: 15 },
            { id: '2', start: 10, end: 25 },
        ];
        const result = getKeepSegments(cuts, 60);
        // Merged cut: 5–25
        expect(result).toEqual([
            { start: 0, end: 5 },
            { start: 25, end: 60 },
        ]);
    });

    it('handles adjacent non-overlapping cuts', () => {
        const cuts: CutSegment[] = [
            { id: '1', start: 10, end: 20 },
            { id: '2', start: 30, end: 40 },
        ];
        const result = getKeepSegments(cuts, 60);
        expect(result).toEqual([
            { start: 0, end: 10 },
            { start: 20, end: 30 },
            { start: 40, end: 60 },
        ]);
    });

    it('returns empty array when cut covers entire duration', () => {
        const cuts: CutSegment[] = [{ id: '1', start: 0, end: 60 }];
        const result = getKeepSegments(cuts, 60);
        expect(result).toEqual([]);
    });

    it('handles unsorted cuts correctly', () => {
        const cuts: CutSegment[] = [
            { id: '2', start: 30, end: 40 },
            { id: '1', start: 10, end: 20 },
        ];
        const result = getKeepSegments(cuts, 60);
        expect(result).toEqual([
            { start: 0, end: 10 },
            { start: 20, end: 30 },
            { start: 40, end: 60 },
        ]);
    });

    it('handles cut with start equal to another cut end (touching)', () => {
        const cuts: CutSegment[] = [
            { id: '1', start: 10, end: 20 },
            { id: '2', start: 20, end: 30 },
        ];
        const result = getKeepSegments(cuts, 60);
        // These don't overlap (nextCut.start === currentCut.end, not <)
        // so they should NOT merge, but the gap between them is 0
        expect(result).toEqual([
            { start: 0, end: 10 },
            { start: 30, end: 60 },
        ]);
    });
});

/* ─── buildFFmpegCommand ─── */

describe('buildFFmpegCommand', () => {
    const baseConfig = {
        format: 'mp4' as const,
        quality: 'high' as const,
        includeAudio: true,
        applyCuts: false,
        normalizeAudio: false,
    };

    it('generates mp4 with correct codec and CRF for high quality', () => {
        const args = buildFFmpegCommand(baseConfig, [], 60, 0, false);
        expect(args).toContain('-c:v');
        expect(args).toContain('libx264');
        expect(args).toContain('-crf');
        expect(args[args.indexOf('-crf') + 1]).toBe('18');
        expect(args).toContain('-movflags');
    });

    it('generates mp4 with medium CRF', () => {
        const args = buildFFmpegCommand({ ...baseConfig, quality: 'medium' }, [], 60, 0, false);
        expect(args[args.indexOf('-crf') + 1]).toBe('23');
    });

    it('generates mp4 with low CRF', () => {
        const args = buildFFmpegCommand({ ...baseConfig, quality: 'low' }, [], 60, 0, false);
        expect(args[args.indexOf('-crf') + 1]).toBe('28');
    });

    it('generates webm with VP9 + Opus codecs', () => {
        const args = buildFFmpegCommand({ ...baseConfig, format: 'webm' }, [], 60, 0, false);
        expect(args).toContain('libvpx-vp9');
        expect(args).toContain('libopus');
        expect(args[args.length - 1]).toBe('output.webm');
    });

    it('includes second input when external audio is present', () => {
        const args = buildFFmpegCommand(baseConfig, [], 60, 0, true);
        expect(args).toContain('input_audio');
    });

    it('does not include second input without external audio', () => {
        const args = buildFFmpegCommand(baseConfig, [], 60, 0, false);
        expect(args).not.toContain('input_audio');
    });

    it('includes adelay filter for positive sync offset with external audio', () => {
        const args = buildFFmpegCommand(baseConfig, [], 60, 2.5, true);
        const filterIdx = args.indexOf('-filter_complex');
        expect(filterIdx).toBeGreaterThan(-1);
        const filterStr = args[filterIdx + 1];
        // 2.5s = 2500ms
        expect(filterStr).toContain('adelay=2500');
    });

    it('includes atrim filter for negative sync offset with external audio', () => {
        const args = buildFFmpegCommand(baseConfig, [], 60, -1.0, true);
        const filterIdx = args.indexOf('-filter_complex');
        const filterStr = args[filterIdx + 1];
        expect(filterStr).toContain('atrim=start=1');
    });

    it('applies trim+concat filters when cuts are enabled', () => {
        const cuts: CutSegment[] = [{ id: '1', start: 10, end: 20 }];
        const args = buildFFmpegCommand({ ...baseConfig, applyCuts: true }, cuts, 60, 0, false);
        const filterIdx = args.indexOf('-filter_complex');
        const filterStr = args[filterIdx + 1];
        expect(filterStr).toContain('trim=');
        expect(filterStr).toContain('concat=');
    });

    it('includes loudnorm filter when normalizeAudio is true', () => {
        const args = buildFFmpegCommand({ ...baseConfig, normalizeAudio: true }, [], 60, 0, false);
        const filterIdx = args.indexOf('-filter_complex');
        const filterStr = args[filterIdx + 1];
        expect(filterStr).toContain('loudnorm');
    });

    it('output filename matches format', () => {
        const mp4Args = buildFFmpegCommand(baseConfig, [], 60, 0, false);
        expect(mp4Args[mp4Args.length - 1]).toBe('output.mp4');

        const webmArgs = buildFFmpegCommand({ ...baseConfig, format: 'webm' }, [], 60, 0, false);
        expect(webmArgs[webmArgs.length - 1]).toBe('output.webm');
    });
});
