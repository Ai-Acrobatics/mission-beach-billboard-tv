"use client";

export function LiveStreamEmbed({ embedUrl }: { embedUrl: string }) {
  if (!embedUrl) return null;

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <h3 className="text-2xl font-bold text-center mb-2">
        Watch Live
      </h3>
      <p className="text-zinc-400 text-center mb-8">
        See your ad running in real time on Mission Beach
      </p>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-800">
        <iframe
          src={embedUrl}
          title="Mission Beach Billboard TV — Live Stream"
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p className="text-xs text-zinc-500 text-center mt-3">
        Live during operating hours (6 AM &ndash; 1 AM PT)
      </p>
    </section>
  );
}
