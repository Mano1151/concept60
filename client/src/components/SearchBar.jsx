import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceButton from './VoiceButton';
import { addRecentSearch } from '../utils/localStorage';

function SearchBar({ selectedCategory }) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Type or speak a concept to continue.');
      return;
    }

    const payload = {
      concept: trimmed,
      category: selectedCategory || 'General',
    };

    addRecentSearch(payload);
    navigate('/result', { state: payload });
  };

  const handleVoiceResult = (text) => {
    setQuery(text);
    setError('');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label htmlFor="concept" className="sr-only">
          Search any concept
        </label>
        <div className="relative">
          <input
            id="concept"
            name="concept"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search any concept..."
            className="w-full rounded-3xl border border-white/10 bg-white/5 px-5 py-4 pr-16 text-base text-white placeholder:text-slate-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <VoiceButton onVoiceResult={handleVoiceResult} />
          </div>
        </div>

        <button
          type="submit"
          className="min-h-[64px] rounded-3xl bg-accent px-6 text-sm font-semibold text-white transition hover:bg-[#594be3]"
        >
          Explain
        </button>
      </form>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-400">
        <p>{selectedCategory ? `Category: ${selectedCategory}` : 'Pick a category to guide the explanation.'}</p>
        {error && <p className="text-rose-300">{error}</p>}
      </div>
    </div>
  );
}

export default SearchBar;
