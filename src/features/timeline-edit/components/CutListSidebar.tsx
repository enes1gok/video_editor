import React from 'react';
import { Scissors, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CutSegment } from '../../../app/store/types';
import { fmtTime } from '../utils/timeFormat';
import { IconButton, Tooltip } from '../../../shared/ui';

interface CutListSidebarProps {
    sortedCuts: CutSegment[];
    cuts: CutSegment[];
    selectedCut: string | null;
    duration: number;
    jumpToCut: (cut: CutSegment) => void;
    removeCut: (id: string) => void;
    nudgeCutEdge: (cutId: string, edge: 'start' | 'end', delta: number) => void;
}

export const CutListSidebar: React.FC<CutListSidebarProps> = ({
    sortedCuts,
    cuts,
    selectedCut,
    duration,
    jumpToCut,
    removeCut,
    nudgeCutEdge,
}) => {
    const removed = cuts.reduce((s, c) => s + (c.end - c.start), 0);
    return (
        <div className="bg-elevated rounded-card shadow-panel border border-border p-6">
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                <div>
                    <h3 className="text-xl font-bold text-text">Kesim Listesi</h3>
                    <p className="text-sm text-text-2">
                        Çıkarılacak bölümler aşağıda listelenir. Kırmızı bölgeler son videoda olmayacaktır.
                    </p>
                </div>
                {sortedCuts.length > 0 && (
                    <div className="flex gap-6 bg-surface-2 px-4 py-2 rounded-control border border-border">
                        <Stat label="Kesimler" value={String(sortedCuts.length)} />
                        <Stat label="Çıkarılan" value={`${removed.toFixed(1)}s`} tone="danger" divider />
                        <Stat label="Kalan" value={`${(duration - removed).toFixed(1)}s`} tone="success" divider />
                    </div>
                )}
            </div>

            {sortedCuts.length === 0 ? (
                <div className="text-center py-12 bg-surface-2 rounded-card border-2 border-dashed border-border">
                    <Scissors size={40} className="mx-auto text-text-muted mb-3" />
                    <p className="text-lg font-medium text-text-2">Henüz kesim noktası yok</p>
                    <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">
                        Başlangıç noktası belirleyip, bitiş noktasında "Kes" butonuna basarak videodan bölüm çıkarabilirsiniz.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {sortedCuts.map((cut, i) => (
                        <CutListItem
                            key={cut.id}
                            cut={cut}
                            index={i}
                            isSelected={selectedCut === cut.id}
                            onJump={() => jumpToCut(cut)}
                            onRemove={() => removeCut(cut.id)}
                            onNudge={(edge, delta) => nudgeCutEdge(cut.id, edge, delta)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const Stat: React.FC<{ label: string; value: string; tone?: 'danger' | 'success'; divider?: boolean }> = ({ label, value, tone, divider }) => (
    <div className={`flex flex-col items-center ${divider ? 'border-l border-border pl-6' : ''}`}>
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">{label}</span>
        <span className={`text-sm font-bold ${tone === 'danger' ? 'text-danger' : tone === 'success' ? 'text-success' : 'text-text'}`}>{value}</span>
    </div>
);

/* ── Individual Cut Item ── */
const CutListItem: React.FC<{
    cut: CutSegment;
    index: number;
    isSelected: boolean;
    onJump: () => void;
    onRemove: () => void;
    onNudge: (edge: 'start' | 'end', delta: number) => void;
}> = ({ cut, index, isSelected, onJump, onRemove, onNudge }) => (
    <div
        onClick={onJump}
        className={`flex items-center justify-between p-3 rounded-control cursor-pointer transition-all ${
            isSelected ? 'bg-danger-muted border-2 border-danger' : 'bg-surface-2 border border-border hover:bg-border'
        }`}
    >
        <div className="flex-1 min-w-0">
            <span className="text-xs text-text-muted font-medium">Kesim {index + 1}</span>
            <div className="flex items-center gap-1 mt-0.5">
                <NudgeButton direction="back" onClick={(e) => { e.stopPropagation(); onNudge('start', -0.1); }} title="Başlangıcı 0.1s geri al" />
                <span className="font-mono text-xs font-semibold text-text-2 w-12 text-center">{fmtTime(cut.start)}</span>
                <NudgeButton direction="forward" onClick={(e) => { e.stopPropagation(); onNudge('start', 0.1); }} title="Başlangıcı 0.1s ileri al" />
                <span className="text-text-muted mx-0.5">→</span>
                <NudgeButton direction="back" onClick={(e) => { e.stopPropagation(); onNudge('end', -0.1); }} title="Bitişi 0.1s geri al" />
                <span className="font-mono text-xs font-semibold text-text-2 w-12 text-center">{fmtTime(cut.end)}</span>
                <NudgeButton direction="forward" onClick={(e) => { e.stopPropagation(); onNudge('end', 0.1); }} title="Bitişi 0.1s ileri al" />
            </div>
            <span className="text-[10px] text-text-muted">{(cut.end - cut.start).toFixed(1)}s süre</span>
        </div>
        <Tooltip content="Kesimi sil">
            <IconButton icon={Trash2} aria-label={`Kesim ${index + 1}'i sil`} variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); onRemove(); }} />
        </Tooltip>
    </div>
);

const NudgeButton: React.FC<{
    direction: 'back' | 'forward';
    onClick: (e: React.MouseEvent) => void;
    title: string;
}> = ({ direction, onClick, title }) => (
    <Tooltip content={title}>
        <button
            onClick={onClick}
            aria-label={title}
            className="p-1 text-text-muted hover:text-accent hover:bg-accent-muted rounded transition-colors"
        >
            {direction === 'back' ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
    </Tooltip>
);
