import { useEffect, useMemo, useState } from 'react';

const DEFAULT_TRANSITION_MS = 6000;

function PictureVideoPlayer({ slides = [], summary }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentSlide = slides[currentIndex] || {};
  const slideDuration = currentSlide.duration || DEFAULT_TRANSITION_MS / 1000;
  const currentMilliseconds = slideDuration * 1000;

  useEffect(() => {
    if (!isPlaying || slides.length === 0) {
      return undefined;
    }

    const speakStory = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis || !currentSlide.narration) {
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentSlide.narration);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    };

    speakStory();
    const timeout = setTimeout(() => {
      setCurrentIndex((current) => (current + 1) % slides.length);
    }, currentMilliseconds);

    return () => {
      clearTimeout(timeout);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying, slides, currentIndex, currentMilliseconds, currentSlide.narration]);

  useEffect(() => {
    if (slides.length === 0) {
      setCurrentIndex(0);
      setIsPlaying(false);
    }
  }, [slides.length]);

  const progress = useMemo(() => {
    if (slides.length === 0) return 0;
    return Math.round(((currentIndex + 1) / slides.length) * 100);
  }, [currentIndex, slides.length]);

  const togglePlay = () => {
    setIsPlaying((value) => !value);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Picture video</h3>
          <p className="mt-2 text-sm text-slate-300">A visual slideshow explaining the concept.</p>
        </div>
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-3xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#594be3] disabled:opacity-60"
          disabled={slides.length === 0}
        >
          {isPlaying ? 'Pause video' : 'Play video'}
        </button>
      </div>

      {slides.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-[#0f172a]/80 p-6 text-center text-slate-400">
          <p>No picture video was generated.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="rounded-3xl bg-slate-950/90 shadow-inner ring-1 ring-white/10 transition duration-500 overflow-hidden">
            <div className="relative w-full aspect-video bg-black">
              {currentSlide.imageUrl ? (
                <img
                  src={currentSlide.imageUrl}
                  alt={currentSlide.imageKeyword || 'Slide image'}
                  className="w-full h-full object-cover opacity-90 transition-opacity duration-1000"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-slate-500">Loading image...</div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-12">
                <p className="text-slate-200 text-lg leading-relaxed text-center font-medium drop-shadow-md">
                  {currentSlide.narration || '...'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
              <span>{slides.length} slides total</span>
              <span>{progress}% complete</span>
              <span>{isSpeaking ? 'Narration playing…' : isPlaying ? 'Playing' : 'Paused'}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {slides.map((slide, index) => (
              <div
                key={slide.scene || index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 cursor-pointer w-24 h-16 rounded-xl border overflow-hidden transition-all duration-300 ${
                  index === currentIndex ? 'border-accent ring-2 ring-accent/50 opacity-100' : 'border-white/10 opacity-60 hover:opacity-100'
                }`}
              >
                {slide.imageUrl ? (
                  <img src={slide.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/5" />
                )}
              </div>
            ))}
          </div>

          {summary ? <p className="text-sm text-slate-400">{summary}</p> : null}
        </div>
      )}
    </div>
  );
}

export default PictureVideoPlayer;