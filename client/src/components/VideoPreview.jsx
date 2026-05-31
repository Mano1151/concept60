function VideoPreview({ videoUrl, summary }) {
  if (!videoUrl) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Real video preview</h3>
          <p className="mt-2 text-sm text-slate-300">A real-world video asset generated for your concept.</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl overflow-hidden border border-white/10 bg-slate-950/80">
        <video
          className="w-full bg-black"
          controls
          preload="metadata"
          src={videoUrl}
        >
          Your browser does not support the video element.
        </video>
      </div>

      {summary ? <p className="mt-4 text-sm text-slate-400">{summary}</p> : null}
    </div>
  );
}

export default VideoPreview;
