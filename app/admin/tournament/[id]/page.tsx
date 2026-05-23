"use client";

export default function TournamentAdminPage() {
  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Clubs & Holes Admin
      </div>

      <h1 className="mt-2 text-4xl font-black">Tournament Control Room</h1>

      <p className="mt-2 text-gray-400">
        This is where tournament setup, players, live controls, and reset tools will live.
      </p>

      <div className="mt-8 grid gap-4">
        {["Tournament Info", "Players", "Live Controls", "Reset Tools", "Hole Setup"].map(
          (item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-gray-950 p-5 text-xl font-black"
            >
              {item}
            </div>
          )
        )}
      </div>
    </div>
  );
}