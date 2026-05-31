import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const categories = [
  {
    id: 'math',
    name: 'Mathematics',
    description: 'Algebra, calculus, geometry, and more',
    icon: '📐',
    gradient: 'from-blue-500 to-purple-600',
    count: 45,
  },
  {
    id: 'science',
    name: 'Science',
    description: 'Physics, chemistry, biology, astronomy',
    icon: '🔬',
    gradient: 'from-green-500 to-teal-600',
    count: 38,
  },
  {
    id: 'technology',
    name: 'Technology',
    description: 'Programming, AI, web development',
    icon: '💻',
    gradient: 'from-indigo-500 to-blue-600',
    count: 52,
  },
  {
    id: 'history',
    name: 'History',
    description: 'World history, civilizations, events',
    icon: '📜',
    gradient: 'from-amber-500 to-orange-600',
    count: 29,
  },
  {
    id: 'language',
    name: 'Languages',
    description: 'Grammar, vocabulary, linguistics',
    icon: '🌍',
    gradient: 'from-pink-500 to-rose-600',
    count: 21,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Finance, marketing, management',
    icon: '💼',
    gradient: 'from-emerald-500 to-green-600',
    count: 33,
  },
  {
    id: 'art',
    name: 'Arts & Culture',
    description: 'Literature, music, visual arts',
    icon: '🎨',
    gradient: 'from-violet-500 to-purple-600',
    count: 27,
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    description: 'Medicine, psychology, fitness',
    icon: '🏥',
    gradient: 'from-cyan-500 to-blue-600',
    count: 31,
  },
];

function Categories() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (categoryId) => {
    navigate('/', { state: { selectedCategory: categoryId } });
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-panel/80 p-8 shadow-soft backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Categories</h2>
            <p className="mt-2 text-slate-300">
              Explore concepts organized by subject area. Choose a category to focus your learning.
            </p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[300px]">
            <label htmlFor="category-search" className="sr-only">
              Search categories
            </label>
            <input
              id="category-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategoryClick(category.id)}
            className="group rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft transition hover:border-accent/50 hover:bg-white/10 text-left"
          >
            <div className={`mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-2xl transition group-hover:scale-110`}>
              {category.icon}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">{category.name}</h3>
            <p className="mb-4 text-sm text-slate-300 leading-relaxed">{category.description}</p>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
                {category.count} concepts
              </span>
              <span className="text-slate-400 transition group-hover:text-accent">→</span>
            </div>
          </button>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
          <p className="text-lg font-medium">No categories found</p>
          <p className="mt-2 text-sm">Try adjusting your search terms.</p>
        </div>
      )}
    </section>
  );
}

export default Categories;
