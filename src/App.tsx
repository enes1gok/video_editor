import React, { useRef, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { MediaUpload } from './features/media-upload';
import { AudioSync } from './features/audio-sync';
import { TimelineEdit } from './features/timeline-edit';
import { ThumbnailEditor } from './features/thumbnail-design';
import { ShortsCreator } from './features/video-export/components/ShortsCreator';
import { VideoExport } from './features/video-export';
import { useAppStore } from './app/store';
import { useThumbnailStore } from './store/thumbnailSlice';
import { captureVideoFrame, capturePreviewContainer } from './shared/utils/captureFrame';
import { ErrorBoundary, StepBar, Button, ThemeToggle, usePrefersReducedMotion } from './shared/ui';
import { getStep } from './app/steps';

const StepComponents: Record<number, React.FC<any>> = {
  1: MediaUpload,
  2: AudioSync,
  3: TimelineEdit,
  4: ThumbnailEditor,
  5: VideoExport,
  6: ShortsCreator,
};

function App() {
  const { currentStep, videoFiles, audioFiles, hydrateSession, isExporting } = useAppStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const masterVideoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Monitor store hydration
  useEffect(() => {
    const unsub = useAppStore.persist.onHydrate(() => setIsHydrated(false));
    const unsubFinish = useAppStore.persist.onFinishHydration(() => setIsHydrated(true));
    if (useAppStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }
    return () => {
      unsub();
      unsubFinish();
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const state = useAppStore.getState();
    if (state.videoFiles.length > 0 || state.audioFiles.length > 0) {
      const needsHydration = state.videoFiles.some(vf => !vf.file && !vf.error);
      if (needsHydration) {
        hydrateSession().catch(console.error);
      }
    }
  }, [isHydrated, hydrateSession]);

  const Component = StepComponents[currentStep] || MediaUpload;
  const stepMeta = getStep(currentStep);

  // Capture the current preview as the thumbnail background when leaving step 3.
  const capturePreview = () => {
    const previewEl = document.getElementById('video-preview-container');
    try {
      if (previewEl) {
        useThumbnailStore.getState().setThumbnailBackground(capturePreviewContainer(previewEl));
        return;
      }
    } catch (err) {
      console.error('Preview capture failed, falling back to master video:', err);
    }
    const videoEl = masterVideoRef.current;
    if (videoEl) {
      try {
        useThumbnailStore.getState().setThumbnailBackground(captureVideoFrame(videoEl));
      } catch (err) {
        console.error('Auto-capture failed:', err);
      }
    }
  };

  // Data-driven "next" actions (replaces 3 duplicated gradient buttons).
  const NEXT: Record<number, { label: string; to: number; onBefore?: () => void }> = {
    3: { label: 'Kapak Tasarla', to: 4, onBefore: capturePreview },
    4: { label: 'Dışa Aktar', to: 5 },
    5: { label: 'Shorts Oluştur', to: 6 },
  };
  const next = NEXT[currentStep];

  const goBack = () => {
    const target = currentStep === 3 && videoFiles.length <= 1 && audioFiles.length === 0 ? 1 : currentStep - 1;
    useAppStore.getState().setStep(target);
  };

  const isEditor = currentStep === 3;

  return (
    <div className="min-h-screen bg-surface-2 text-text flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-surface border-b border-border shadow-panel sticky top-0 z-[100] flex items-center px-4 h-16">
          <div className="flex items-center gap-2 mr-6 flex-shrink-0">
            <div className="w-8 h-8 rounded-control bg-accent flex items-center justify-center shadow-control">
              <CheckCircle2 size={20} className="text-accent-fg" />
            </div>
            <span className="font-black text-xl tracking-tighter text-text">PODCUT</span>
          </div>

          {/* Dynamic title (single source: app/steps.ts) */}
          {stepMeta && (
            <div className="hidden lg:block mr-4 flex-shrink-0 min-w-[140px]">
              <h2 className="text-lg font-bold text-text leading-tight">{stepMeta.title}</h2>
              <p className="text-[11px] text-text-muted font-medium">{stepMeta.subtitle}</p>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <StepBar hideLogo />
          </div>

          <div className="flex items-center gap-2 ml-4 flex-shrink-0 justify-end">
            <ThemeToggle />

            {currentStep > 1 && (
              <Button variant="secondary" size="sm" icon={ArrowLeft} disabled={isExporting} onClick={goBack}>
                Geri
              </Button>
            )}

            {next && (
              <Button
                variant="primary"
                size="sm"
                iconRight={ArrowRight}
                disabled={isExporting}
                onClick={() => {
                  next.onBefore?.();
                  useAppStore.getState().setStep(next.to);
                }}
              >
                {next.label}
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className={isEditor ? 'w-full' : 'max-w-7xl mx-auto'}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -16 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <ErrorBoundary>
                  <Component masterVideoRef={masterVideoRef} />
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
