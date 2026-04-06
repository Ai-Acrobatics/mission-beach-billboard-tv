export default function PlayerPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold tracking-tight">
          Mission Beach Billboard TV
        </h1>
        <p className="text-2xl text-zinc-400">
          Ad player — content will display here
        </p>
        <div className="mt-8 p-8 border border-zinc-800 rounded-2xl">
          <p className="text-zinc-500 text-lg">
            No ads scheduled. Waiting for content&hellip;
          </p>
        </div>
      </div>
    </div>
  );
}
