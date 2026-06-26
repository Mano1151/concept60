import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import DifficultySelector from '../components/DifficultySelector';
import apiClient from '../services/api';

function Home() {
  const [difficulty, setDifficulty] = useState('medium');
  const [topics, setTopics] = useState([]);
  const [sources, setSources] = useState({ totalVectors: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchKnowledgeStats() {
      try {
        const [topicRes, sourceRes] = await Promise.all([
          apiClient.get('/api/knowledge/topics'),
          apiClient.get('/api/knowledge/sources')
        ]);
        // Shuffle topics and pick 6 for home page
        const shuffled = (topicRes.data.topics || []).sort(() => 0.5 - Math.random());
        setTopics(shuffled.slice(0, 6));
        setSources(sourceRes.data.indexStats || { totalVectors: 0 });
      } catch (err) {
        console.error('Failed to load knowledge stats:', err);
      }
    }
    fetchKnowledgeStats();
  }, []);

  const handleTopicClick = (topic) => {
    navigate('/result', {
      state: { concept: topic.name, category: topic.category, difficulty },
    });
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 py-10 lg:py-14">
      {/* Hero Section */}
      <section className="card relative overflow-hidden p-8 sm:p-12 text-center">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-accent/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent-cyan/20 blur-3xl"></div>
        
        <div className="relative z-10 mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm text-accent-cyan shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-cyan opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-cyan"></span>
            </span>
            Knowledge Base Active ({sources.totalVectors} vectors)
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
            Search any concept.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-cyan">
              Grounded in real study material.
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            Select your difficulty, search for an algorithm or data structure, and get an explanation generated straight from your uploaded PDFs.
          </p>

          <div className="pt-6">
            <DifficultySelector selected={difficulty} onSelect={setDifficulty} />
          </div>

          <div className="mt-8">
            <SearchBar selectedCategory="" difficulty={difficulty} />
          </div>
        </div>
      </section>

      {/* Suggested Topics Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Topics from your knowledge base</h2>
            <p className="mt-2 text-slate-400">Curated algorithms and data structures extracted from your PDFs.</p>
          </div>
          <Link to="/trending" className="text-sm font-semibold text-accent hover:text-accent-cyan transition">
            View all topics →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic, i) => (
            <button
              key={i}
              onClick={() => handleTopicClick(topic)}
              className="group relative flex flex-col items-start gap-4 rounded-3xl border border-white/5 bg-panel/50 p-6 text-left transition hover:border-accent/30 hover:bg-white/5"
            >
              <div className="flex w-full items-start justify-between">
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-slate-300">
                  {topic.category}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${getDifficultyColor(topic.difficulty)}`}>
                  {topic.difficulty}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white group-hover:text-accent transition">
                  {topic.name}
                </h3>
              </div>
              <div className="mt-auto flex items-center gap-2 text-sm text-slate-500">
                <span>📄 Found in knowledge base</span>
                <span className="text-accent opacity-0 transition group-hover:opacity-100 ml-auto">Explain →</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* RAG Information Card */}
      <section className="mt-12 rounded-3xl bg-gradient-to-br from-[#12121d] via-panel to-[#0f0f0f] border border-white/5 p-8 sm:p-12">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <div className="text-4xl">📚</div>
          <h2 className="text-2xl font-bold text-white">How it works</h2>
          <p className="text-slate-300 leading-relaxed">
            Unlike standard AI chatbots that hallucinate or give generic answers, Concept 60 uses <strong>Retrieval-Augmented Generation (RAG)</strong>. 
            When you search for a concept, we first scan your uploaded DSA study materials. We pull the most relevant excerpts and use them to ground the AI's explanation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/trending">
              <Button variant="secondary">Explore Topics</Button>
            </Link>
            <p className="text-sm text-slate-500">Admins can upload new PDFs to expand the library.</p>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
