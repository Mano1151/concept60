import { useEffect, useMemo, useState } from 'react';

const DEFAULT_TRANSITION_MS = 6000;

function StoryboardPlayer({ storyboard = [], summary }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentScene = storyboard[currentIndex] || {};
  const sceneDuration = currentScene.duration || DEFAULT_TRANSITION_MS / 1000;
  const currentMilliseconds = sceneDuration * 1000;
  const sceneTitle = currentScene.title || `Scene ${currentIndex + 1}`;

  useEffect(() => {
    if (!isPlaying || storyboard.length === 0) {
      return undefined;
    }

    const speakStory = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis || !currentScene.narration) {
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentScene.narration);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    };

    speakStory();
    const timeout = setTimeout(() => {
      setCurrentIndex((current) => (current + 1) % storyboard.length);
    }, currentMilliseconds);

    return () => {
      clearTimeout(timeout);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying, storyboard, currentIndex, currentMilliseconds, currentScene.narration]);

  useEffect(() => {
    if (storyboard.length === 0) {
      setCurrentIndex(0);
      setIsPlaying(false);
    }
  }, [storyboard.length]);

  const progress = useMemo(() => {
    if (storyboard.length === 0) return 0;
    return Math.round(((currentIndex + 1) / storyboard.length) * 100);
  }, [currentIndex, storyboard.length]);

  const togglePlay = () => {
    setIsPlaying((value) => !value);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Animated video preview</h3>
          <p className="mt-2 text-sm text-slate-300">Automatic scene transitions with narration turn the storyboard into a motion preview.</p>
        </div>
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-3xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#594be3] disabled:opacity-60"
          disabled={storyboard.length === 0}
        >
          {isPlaying ? 'Pause preview' : 'Play preview'}
        </button>
      </div>

      {storyboard.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-[#0f172a]/80 p-6 text-center text-slate-400">
          <p>No animated storyboard was generated yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="rounded-3xl bg-slate-950/90 p-6 shadow-inner ring-1 ring-white/10 transition duration-500">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm uppercase tracking-[0.35em] text-slate-500">Scene {currentScene.scene || currentIndex + 1}</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                {sceneDuration}s per scene
              </span>
            </div>
            <div className="mt-4 rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900 via-slate-950 to-slate-800 p-6 shadow-lg transition duration-500">
              <p className="text-sm text-slate-400">{currentScene.visuals || 'Visual description'}</p>
              <h4 className="mt-4 text-2xl font-semibold text-white">{sceneTitle}</h4>
              <p className="mt-3 text-slate-300 leading-7">{currentScene.narration || 'Narration text for this scene.'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
              <span>{storyboard.length} scenes total</span>
              <span>{progress}% complete</span>
              <span>{isSpeaking ? 'Narration playing…' : isPlaying ? 'Preview playing' : 'Preview paused'}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {storyboard.map((scene, index) => (
              <div
                key={scene.scene || index}
                className={`rounded-3xl border p-4 text-sm transition-all duration-300 ${
                  index === currentIndex ? 'border-accent bg-accent/15 text-white shadow-[0_0_0_1px_rgba(132,204,22,0.15)]' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <p className="font-semibold">Scene {scene.scene || index + 1}</p>
                <p className="mt-2 text-slate-300 line-clamp-3">{scene.visuals}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{scene.duration ? `${scene.duration}s` : 'Auto'}</p>
              </div>
            ))}
          </div>

          {summary ? <p className="text-sm text-slate-400">{summary}</p> : null}
        </div>
      )}
    </div>
  );
}

export default StoryboardPlayer;
