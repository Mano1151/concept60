import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const trendingConcepts = [
  {
    id: '1',
    concept: 'Machine Learning',
    category: 'Technology',
    rank: 1,
    searches: 1250,
    change: '+15%',
    description: 'How computers learn from data without being explicitly programmed',
  },
  {
    id: '2',
    concept: 'Quantum Computing',
    category: 'Science',
    rank: 2,
    searches: 980,
    change: '+8%',
    description: 'Computing using quantum-mechanical phenomena',
  },
  {
    id: '3',
    concept: 'Blockchain',
    category: 'Technology',
    rank: 3,
    searches: 875,
    change: '+22%',
    description: 'A distributed ledger technology that maintains a continuously growing list of records',
  },
  {
    id: '4',
    concept: 'Neural Networks',
    category: 'Technology',
    rank: 4,
    searches: 720,
    change: '+5%',
    description: 'Computing systems inspired by biological neural networks',
  },
  {
    id: '5',
    concept: 'Cryptocurrency',
    category: 'Business',
    rank: 5,
    searches: 650,
    change: '+12%',
    description: 'Digital or virtual currency that uses cryptography for security',
  },
  {
    id: '6',
    concept: 'Artificial Intelligence',
    category: 'Technology',
    rank: 6,
    searches: 580,
    change: '+3%',
    description: 'The simulation of human intelligence in machines',
  },
  {
    id: '7',
    concept: 'Climate Change',
    category: 'Science',
    rank: 7,
    searches: 520,
    change: '+18%',
    description: 'Long-term shifts in temperatures and weather patterns',
  },
  {
    id: '8',
    concept: 'Sustainable Energy',
    category: 'Science',
    rank: 8,
    searches: 480,
    change: '+9%',
    description: 'Energy that meets present needs without compromising future generations',
  },
];

function Trending() {
  const navigate = useNavigate();
  const [animatedRanks, setAnimatedRanks] = useState([]);

  useEffect(() => {
    // Animate ranks appearing one by one
    const timer = setTimeout(() => {
      setAnimatedRanks(trendingConcepts.map((_, index) => index));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleConceptClick = (concept) => {
    navigate('/result', { state: { concept: concept.concept, category: concept.category } });
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'text-yellow-400';
      case 2:
        return 'text-slate-300';
      case 3:
        return 'text-amber-600';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Trending Concepts</h2>
            <p className="mt-2 text-slate-300">
              Discover what's popular right now. See what other learners are exploring.
            </p>
          </div>
          <div className="rounded-3xl bg-white/5 px-4 py-3 text-sm text-slate-300">
            Updated hourly
          </div>
        </div>
      </div>

      {/* Podium for top 3 */}
      <div className="grid gap-6 md:grid-cols-3">
        {trendingConcepts.slice(0, 3).map((concept, index) => {
          const isAnimated = animatedRanks.includes(index);
          return (
            <button
              key={concept.id}
              type="button"
              onClick={() => handleConceptClick(concept)}
              className={`group relative rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft transition-all duration-500 hover:border-accent/50 hover:bg-white/10 ${
                isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <div className="absolute -top-4 left-6">
                <div className={`text-3xl ${getRankColor(concept.rank)}`}>
                  {getRankIcon(concept.rank)}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="mb-2 text-xl font-semibold text-white group-hover:text-accent transition">
                  {concept.concept}
                </h3>
                <p className="mb-3 text-sm text-slate-400 uppercase tracking-wider">
                  {concept.category}
                </p>
                <p className="mb-4 text-sm text-slate-300 leading-relaxed">
                  {concept.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔍</span>
                    <span className="text-sm text-slate-400">
                      {concept.searches.toLocaleString()} searches
                    </span>
                  </div>
                  <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-semibold text-green-400">
                    {concept.change}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Rest of the list */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
        <h3 className="mb-4 text-lg font-semibold text-white">Full Rankings</h3>
        <div className="space-y-3">
          {trendingConcepts.slice(3).map((concept, index) => {
            const actualIndex = index + 3;
            const isAnimated = animatedRanks.includes(actualIndex);
            return (
              <button
                key={concept.id}
                type="button"
                onClick={() => handleConceptClick(concept)}
                className={`group w-full rounded-2xl border border-white/5 bg-bg/50 p-4 text-left transition-all duration-300 hover:border-accent/30 hover:bg-white/5 ${
                  isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                }`}
                style={{ transitionDelay: `${actualIndex * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-lg font-bold ${getRankColor(concept.rank)} min-w-[2rem]`}>
                    {concept.rank}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white group-hover:text-accent transition">
                      {concept.concept}
                    </h4>
                    <p className="text-sm text-slate-400">{concept.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">
                      {concept.searches.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-400">{concept.change}</div>
                  </div>
                  <div className="text-slate-400 transition group-hover:text-accent">→</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Trending;
