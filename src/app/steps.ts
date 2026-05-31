import { Upload, AudioLines, Scissors, Check, Download, Smartphone, type LucideIcon } from 'lucide-react';

export interface StepMeta {
    id: number;
    /** Short label shown under the StepBar dots. */
    shortLabel: string;
    /** Title shown in the app header. */
    title: string;
    /** Subtitle shown in the app header. */
    subtitle: string;
    icon: LucideIcon;
}

/** Single source of truth for the 6-step wizard (header + StepBar consume this). */
export const STEPS: StepMeta[] = [
    { id: 1, shortLabel: 'Yükle', title: 'Medya Yükle', subtitle: 'Dosyalarınızı ekleyin', icon: Upload },
    { id: 2, shortLabel: 'Senkronize', title: 'Ses Senkronize', subtitle: 'Kamera & Mikrofon eşleme', icon: AudioLines },
    { id: 3, shortLabel: 'Düzenle', title: 'Düzenle & Kes', subtitle: 'Kesim noktalarınızı belirleyin', icon: Scissors },
    { id: 4, shortLabel: 'Kapak Tasarla', title: 'Kapak Tasarla', subtitle: 'Video görselini hazırlayın', icon: Check },
    { id: 5, shortLabel: 'Dışa Aktar', title: 'Dışa Aktar', subtitle: 'Videonuzu kaydedin', icon: Download },
    { id: 6, shortLabel: 'Shorts', title: 'Shorts Oluştur', subtitle: 'Sosyal medya için kes', icon: Smartphone },
];

export const TOTAL_STEPS = STEPS.length;

export const getStep = (id: number): StepMeta | undefined => STEPS.find((s) => s.id === id);
