import React from 'react';

const difficulties = [
  { id: 'easy', label: 'Easy', emoji: '🟢', description: 'Beginner friendly, simple analogies' },
  { id: 'medium', label: 'Medium', emoji: '🟡', description: 'Standard developer level' },
  { id: 'hard', label: 'Hard', emoji: '🔴', description: 'Advanced, includes complexities' },
];

export default function DifficultySelector({ selected, onSelect }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {difficulties.map((diff) => {
        const isSelected = selected === diff.id;
        return (
          <button
            key={diff.id}
            type="button"
            onClick={() => onSelect(diff.id)}
            title={diff.description}
            className={`
              relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
              flex items-center gap-2 border
              ${
                isSelected
                  ? 'bg-accent/20 border-accent text-white shadow-[0_0_15px_rgba(108,99,255,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }
            `}
          >
            <span>{diff.emoji}</span>
            <span>{diff.label}</span>
            {isSelected && (
              <span className="absolute inset-0 rounded-full ring-2 ring-accent/50 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
