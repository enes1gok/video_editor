import {
    Play, Pause, ChevronLeft, ChevronRight,
    SkipBack, SkipForward, LayoutTemplate, RectangleHorizontal, Squircle
} from 'lucide-react';
import type { LayoutMode } from '../../../app/store/types';
import { IconButton, SegmentedControl, RangeField, Tooltip, Kbd } from '../../../shared/ui';

interface TransportControlsProps {
    isPlaying: boolean;
    togglePlay: () => void;
    skip: (dt: number) => void;
    layoutMode: LayoutMode;
    setLayoutMode: (mode: LayoutMode) => void;
    hasMultipleVideos: boolean;
    borderRadius: number;
    setBorderRadius: (r: number) => void;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
    isPlaying,
    togglePlay,
    skip,
    layoutMode,
    setLayoutMode,
    hasMultipleVideos,
    borderRadius,
    setBorderRadius,
}) => {
    return (
        <div className="flex flex-col gap-4 items-center w-full">
            {/* Layout mode */}
            {hasMultipleVideos && (
                <SegmentedControl<LayoutMode>
                    fullWidth
                    size="sm"
                    aria-label="Yerleşim modu"
                    value={layoutMode}
                    onChange={setLayoutMode}
                    options={[
                        { value: 'scale', label: 'Orijinal', icon: LayoutTemplate, title: 'Orijinal (boşluklu)' },
                        { value: 'crop', label: 'Kırpılmış', icon: RectangleHorizontal, title: 'Kırpılmış (tam ekran)' },
                    ]}
                />
            )}

            {/* Rounded corners */}
            <RangeField
                label="Köşe Yuvarlama"
                icon={Squircle}
                value={borderRadius}
                onChange={setBorderRadius}
                min={0}
                max={50}
                step={1}
                suffix="px"
                aria-label="Köşe yuvarlama yarıçapı"
            />

            {/* Playback transport */}
            <div className="flex items-center gap-1.5">
                <Tooltip content="5 sn geri · J">
                    <IconButton icon={SkipBack} aria-label="5 saniye geri" size="sm" onClick={() => skip(-5)} />
                </Tooltip>
                <Tooltip content="1 sn geri · ←">
                    <IconButton icon={ChevronLeft} aria-label="1 saniye geri" size="sm" onClick={() => skip(-1)} />
                </Tooltip>
                <Tooltip content={isPlaying ? 'Duraklat · Space' : 'Oynat · Space'}>
                    <IconButton
                        icon={isPlaying ? Pause : Play}
                        aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
                        variant="solid"
                        size="lg"
                        onClick={togglePlay}
                    />
                </Tooltip>
                <Tooltip content="1 sn ileri · →">
                    <IconButton icon={ChevronRight} aria-label="1 saniye ileri" size="sm" onClick={() => skip(1)} />
                </Tooltip>
                <Tooltip content="5 sn ileri · L">
                    <IconButton icon={SkipForward} aria-label="5 saniye ileri" size="sm" onClick={() => skip(5)} />
                </Tooltip>
            </div>
        </div>
    );
};

/* ── Keyboard shortcut hints ── */
const SHORTCUTS = [
    { key: 'Space', label: 'Oynat/Duraklat' },
    { key: 'I', label: 'Başlangıç' },
    { key: 'O / X', label: 'Kes' },
    { key: 'J / L', label: '±5s' },
    { key: '← / →', label: '±1s' },
];

export const ShortcutHints: React.FC = () => (
    <div className="flex items-center justify-center gap-x-3 gap-y-1.5 flex-wrap">
        {SHORTCUTS.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1 text-[11px] text-text-muted">
                <Kbd>{s.key}</Kbd>
                {s.label}
            </span>
        ))}
    </div>
);
