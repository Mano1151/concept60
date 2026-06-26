import React from 'react';

export default function RagSourceBadge({ meta }) {
  if (!meta) return null;

  const { found, chunksUsed, confidence, sources, difficulty } = meta;

  if (!found) {
    return (
      <div className="my-4 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
        <span className="text-xl">📭</span>
        <div>
          <p className="text-sm font-semibold">Not found in knowledge base</p>
          <p className="text-xs text-red-400/80 mt-1">This concept was not found in any of your uploaded study materials.</p>
        </div>
      </div>
    );
  }

  const confidenceColors = {
    high: 'text-green-400 bg-green-400/10 border-green-400/20',
    medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    low: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    none: 'text-slate-400 bg-slate-400/10 border-slate-400/20'
  };

  const diffColors = {
    easy: 'text-green-300',
    medium: 'text-yellow-300',
    hard: 'text-red-300'
  };

  const confColor = confidenceColors[confidence] || confidenceColors.none;
  const diffColor = diffColors[difficulty] || diffColors.medium;
  const sourceName = sources && sources.length > 0 ? sources.join(', ') : 'Knowledge Base';

  return (
    <div className="my-6 flex flex-wrap items-center gap-3 animate-fade-in">
      {/* Source Tag */}
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 shadow-sm backdrop-blur-sm">
        <span className="text-lg">📄</span>
        <span className="text-sm font-medium text-slate-200">
          From <span className="text-white font-semibold">{sourceName}</span>
        </span>
        <span className="mx-1 text-slate-500">•</span>
        <span className="text-xs text-slate-400">{chunksUsed} excerpt{chunksUsed !== 1 ? 's' : ''} used</span>
      </div>

      {/* Confidence Tag */}
      <div className={`flex items-center gap-2 rounded-full border px-3 py-2 ${confColor}`}>
        <span className="text-xs font-semibold uppercase tracking-wider">
          {confidence} Match
        </span>
      </div>

      {/* Difficulty Tag */}
      <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Level:</span>
        <span className={`text-xs font-bold uppercase tracking-wider ${diffColor}`}>
          {difficulty}
        </span>
      </div>
    </div>
  );
}
