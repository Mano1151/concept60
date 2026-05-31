import { useEffect, useState } from 'react';

function TimerAnimation({ duration = 60 }) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    setRemaining(duration);
    const interval = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [duration]);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = (remaining / duration) * circumference;

  return (
    <div className="mx-auto flex max-w-3xl items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#6C63FF"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Loading</p>
          <p className="mt-1 text-2xl font-semibold text-white">{remaining}s</p>
        </div>
      </div>
      <div className="text-left">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-400">AI assistant</p>
        <p className="mt-2 text-base leading-6 text-slate-200">
          Your concept is being generated with calm, accessible explanations.
        </p>
      </div>
    </div>
  );
}

export default TimerAnimation;
