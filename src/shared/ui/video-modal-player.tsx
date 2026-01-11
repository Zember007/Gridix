import * as React from 'react';
import { Play, Pause, ListVideo } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export type VideoChapter = {
  time: number; // seconds
  title: string;
  description?: string;
};

export type VideoModalPlayerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  src: string;
  chapters?: VideoChapter[];
};

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
};

const getActiveChapterIndex = (chapters: VideoChapter[], currentTime: number) => {
  if (!chapters.length) return -1;
  let idx = -1;
  for (let i = 0; i < chapters.length; i++) {
    if (currentTime + 0.25 >= (chapters[i]?.time ?? 0)) idx = i;
  }
  return idx;
};

export const VideoModalPlayer: React.FC<VideoModalPlayerProps> = ({
  open,
  onOpenChange,
  title,
  src,
  chapters = [],
}) => {
  const { t } = useLanguage();
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);

  const activeChapterIndex = React.useMemo(
    () => getActiveChapterIndex(chapters, currentTime),
    [chapters, currentTime]
  );

  React.useEffect(() => {
    if (!open) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [open]);

  const seekTo = (timeSeconds: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, timeSeconds);
    void el.play();
  };

  const togglePlay = async () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      await el.play();
    } else {
      el.pause();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[980px] p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-slate-950 to-slate-900 text-white p-5 border-b border-white/10">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-white">{title}</DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-5">
          <div className="rounded-xl overflow-hidden bg-black border border-slate-200 shadow-sm">
            <video
              ref={videoRef}
              src={src}
              controls
              playsInline
              className="w-full h-auto max-h-[70vh] bg-black"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime((e.currentTarget as HTMLVideoElement).currentTime)}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <ListVideo size={14} />
                {t('partners.videoPlayerChaptersTitle') || 'Таймкоды'}
              </span>
              <span className="text-slate-300/70">•</span>
              <span>
                {t('partners.videoPlayerChaptersHint') || 'кликните по пункту — плеер перемотается'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void togglePlay()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white border border-slate-200/20 hover:bg-slate-800 transition-colors"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? (t('partners.videoPlayerPause') || 'Пауза') : (t('partners.videoPlayerPlay') || 'Играть')}
            </button>
          </div>

          {chapters.length > 0 ? (
            <div className="mt-3 max-h-[220px] overflow-auto pr-1">
              {chapters.map((c, idx) => {
                const isActive = idx === activeChapterIndex;
                return (
                  <button
                    key={`${c.time}-${c.title}-${idx}`}
                    type="button"
                    onClick={() => seekTo(c.time)}
                    className={cn(
                      'text-left w-full rounded-md border px-3 py-2 transition-colors mb-2 last:mb-0',
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={cn('text-xs font-semibold', !isActive && 'text-slate-900')}>
                          {c.title}
                        </div>
                        {c.description ? (
                          <div className={cn('text-[11px] mt-0.5', isActive ? 'text-white/80' : 'text-slate-500')}>
                            {c.description}
                          </div>
                        ) : null}
                      </div>
                      <div className={cn('text-[11px] font-mono', isActive ? 'text-white/80' : 'text-slate-500')}>
                        {formatTime(c.time)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {t('partners.videoPlayerNoChapters') ||
                'Таймкоды пока не добавлены. Их можно задать в массиве chapters для каждого видео.'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

