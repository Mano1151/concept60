function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Categories</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              aria-pressed={isActive}
              className={`rounded-2xl px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                isActive
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : 'bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryFilter;
