import { useEffect, useState } from 'react';

const loadingMessages = [
  "💡 Translating complex jargon into plain English...",
  "🎨 Crafting a simple, relatable real-world analogy...",
  "🧠 Structuring keyword definitions for quick recall...",
  "📝 Formatting practice quiz questions for you...",
  "🚀 Connecting neural pathways for fast understanding...",
  "📚 Summarizing the absolute essentials in one line...",
  "🌟 Did you know? Learning in 60-second chunks boosts long-term retention by 40%!",
  "🧬 Fetching and preparing learning modules...",
  "🍿 Preparing video storyboard visualization scenes...",
  "⏱️ Almost there! Doing the heavy reading so you don't have to..."
];

function TimerAnimation({ duration = 60 }) {
  const [remaining, setRemaining] = useState(duration);
  const [messageIndex, setMessageIndex] = useState(0);

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

  useEffect(() => {
    const messageInterval = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 4000); // Change message every 4 seconds

    return () => window.clearInterval(messageInterval);
  }, []);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = (remaining / duration) * circumference;

  return (
    <div className="mx-auto flex max-w-3xl items-center justify-center gap-6 rounded-3xl border border-white/10 bg-panel/60 p-6 shadow-soft backdrop-blur-md transition-all duration-300">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#loadingGradient)"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6c63ff" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold">Time left</p>
          <p className="text-xl font-bold text-white mt-0.5">{remaining}s</p>
        </div>
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-accent">AI Learning Assistant</p>
        <div className="mt-3 min-h-[48px] flex items-center">
          <p className="text-base font-medium leading-relaxed text-slate-200 transition-all duration-500 animate-pulse">
            {loadingMessages[messageIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}

export default TimerAnimation;
