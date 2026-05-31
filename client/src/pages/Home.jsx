import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CategoryFilter from '../components/CategoryFilter';
import RecentSearches from '../components/RecentSearches';
import SearchBar from '../components/SearchBar';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const categories = ['All', 'Science', 'Technology', 'Engineering', 'Mathematics', 'Finance', 'Business', 'History', 'Coding'];
const trendingConcepts = [
  { name: 'Blockchain', searches: 1250, change: '+15%' },
  { name: 'Quantum computing', searches: 980, change: '+8%' },
  { name: 'Compound interest', searches: 875, change: '+22%' },
  { name: 'Neural networks', searches: 720, change: '+5%' },
];

const conceptOfTheDay = {
  concept: 'Neural Networks',
  description: 'A neural network is a simple computer model inspired by the brain. It learns patterns from examples and can help explain complex ideas in a clear, human-friendly way.',
  why: 'This idea helps power voice assistants, recommendation engines, and many AI tools.',
  category: 'Technology',
};

function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();

  const handleTrendingClick = (concept) => {
    navigate('/result', {
      state: { concept: concept.name, category: selectedCategory === 'All' ? 'General' : selectedCategory },
    });
  };

  const handleConceptOfDayClick = () => {
    navigate('/result', {
      state: { concept: conceptOfTheDay.concept, category: conceptOfTheDay.category },
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10 py-10 lg:py-14">
      <section className="card p-8">
        <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Concept in 60 Seconds</p>
        <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
          Learn any concept with calm, clear AI explanations.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
          Type or speak a topic and instantly receive a beginner-friendly summary, analogy, and key
          takeaway designed for fast learning.
        </p>
        <div className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <SearchBar selectedCategory={selectedCategory === 'All' ? 'General' : selectedCategory} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Explore by category</h2>
              <p className="mt-2 text-slate-300">
                Select a category to focus the explanation for your use case.
              </p>
            </div>
            <Link
              to="/categories"
              className="rounded-3xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#594be3]"
            >
              View all categories
            </Link>
          </div>
          <Card className="p-4 mb-4">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
                Trending concepts
              </p>
              <Link
                to="/trending"
                className="text-sm text-accent hover:text-accent/80 transition"
              >
                View all →
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {trendingConcepts.map((concept) => (
                <button
                  key={concept.name}
                  type="button"
                  onClick={() => handleTrendingClick(concept)}
                  className="group w-full rounded-2xl bg-bg/50 p-3 text-left transition hover:bg-white/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white group-hover:text-accent transition">
                      {concept.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{concept.searches.toLocaleString()}</span>
                      <span className="text-green-400">{concept.change}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div>
        <Card className="bg-gradient-to-br from-[#12121d] via-panel to-[#0f0f0f] p-8">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Concept of the day</p>
            <h2 className="text-3xl font-semibold text-white">{conceptOfTheDay.concept}</h2>
            <p className="text-slate-300">
              {conceptOfTheDay.description}
            </p>
            <div className="rounded-3xl bg-white/5 p-5 text-sm text-slate-300">
              <p className="font-semibold text-white">Why it matters</p>
              <p className="mt-2">{conceptOfTheDay.why}</p>
            </div>
            <Button className="w-full mt-2" onClick={handleConceptOfDayClick}>Learn this concept</Button>
          </div>
        </Card>
        </div>
      </section>

      <RecentSearches />
    </div>
  );
}

export default Home;
