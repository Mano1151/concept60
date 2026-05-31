function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-soft">
        <div className="h-8 w-3/5 animate-pulse rounded-2xl bg-slate-700" />
        <div className="mt-6 space-y-4">
          <div className="h-5 w-full animate-pulse rounded-2xl bg-slate-700" />
          <div className="h-5 w-5/6 animate-pulse rounded-2xl bg-slate-700" />
          <div className="h-5 w-4/6 animate-pulse rounded-2xl bg-slate-700" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
      </div>
    </div>
  );
}

export default LoadingSkeleton;
