import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import DifficultySelector from '../components/DifficultySelector';
import Card from '../components/ui/Card';

function Trending() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('medium');

  useEffect(() => {
    async function fetchTopics() {
      try {
        setLoading(true);
        // Pass difficulty to API to filter if we wanted to, or filter locally.
        // For now, we'll fetch all and just pass the selected difficulty to the search.
        const res = await apiClient.get('/api/knowledge/topics');
        setTopics(res.data.topics || []);
        const cats = res.data.categories || [];
        setCategories(cats);
        if (cats.length > 0) setSelectedCategory(cats[0]);
      } catch (err) {
        console.error('Failed to load topics', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  const handleTopicClick = (topic) => {
    navigate('/result', { state: { concept: topic.name, category: topic.category, difficulty } });
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const filteredTopics = topics.filter(t => !selectedCategory || t.category === selectedCategory);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft backdrop-blur-md">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Explore Topics</h2>
            <p className="mt-2 text-slate-300">
              Browse concepts currently available in your knowledge base.
            </p>
          </div>
          <div className="shrink-0 bg-white/5 p-2 rounded-2xl border border-white/5">
            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 p-8 text-center animate-pulse">Loading topics from knowledge base...</div>
      ) : (
        <div className="space-y-8">
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-accent text-white shadow-lg shadow-accent/30 scale-105'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {filteredTopics.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTopics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleTopicClick(topic)}
                  className="group flex flex-col items-start gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-soft transition-all duration-300 hover:border-accent/50 hover:bg-white/10 hover:-translate-y-1"
                >
                  <div className="flex w-full items-start justify-between">
                    <span className="rounded-full bg-bg/80 px-3 py-1 text-xs uppercase tracking-wider text-slate-300">
                      {topic.category}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${getDifficultyColor(topic.difficulty)}`}>
                      {topic.difficulty}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <h3 className="mb-2 text-xl font-semibold text-white group-hover:text-accent transition">
                      {topic.name}
                    </h3>
                  </div>
                  
                  <div className="mt-auto flex items-center gap-2 pt-4 border-t border-white/5 w-full">
                    <span className="text-lg">📄</span>
                    <span className="text-xs text-slate-400">Available in PDFs</span>
                    <span className="text-accent opacity-0 transition group-hover:opacity-100 ml-auto text-sm font-medium">Explain →</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12">
              No topics found for this subject.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Trending;
