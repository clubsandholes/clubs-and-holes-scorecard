"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Tournament = {
  id: string;
  name: string;
  code: string;
  status: "active" | "completed";
  tournament_date?: string | null;
  background_image_url?: string | null;
};

export default function LivePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTournaments = async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name, code, status, tournament_date, background_image_url")
      .in("status", ["active", "completed"])
      .order("tournament_date", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setTournaments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const liveNow = tournaments.filter((t) => t.status === "active");
  const completed = tournaments.filter((t) => t.status === "completed");

  const TournamentCard = ({ tournament }: { tournament: Tournament }) => (
    <Link
      href={`/live/t/${tournament.code.toLowerCase()}`}
      className="block overflow-hidden rounded-[2rem] border border-white/10 bg-black/60 shadow-2xl backdrop-blur-md transition-all hover:border-[#ff9900]"
    >
      {tournament.background_image_url && (
        <div
          className="h-36 bg-cover bg-center"
          style={{ backgroundImage: `url(${tournament.background_image_url})` }}
        />
      )}

      <div className="p-5">
        <div
          className={`text-xs font-black uppercase tracking-[0.22em] ${
            tournament.status === "active" ? "text-red-400" : "text-[#ff9900]"
          }`}
        >
          {tournament.status === "active" ? "🔴 Live Now" : "🏆 Completed"}
        </div>

        <div className="mt-2 text-2xl font-black text-white">
          {tournament.name}
        </div>

        <div className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-white/50">
          Enter The Lot →
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-black px-5 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <img
            src="/ch-logo.png"
            alt="Clubs & Holes"
            className="mx-auto h-20 w-auto"
          />

          <h1 className="mt-6 text-5xl font-black tracking-tight">
            THE LOT
          </h1>

          <div className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-[#ff9900]">
            Where golf sh!t happens.
          </div>

          <div className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-white/60">
            🏌️ The Score
            <span className="mx-2 text-white/25">•</span>
            🔥 The Turn
            <span className="mx-2 text-white/25">•</span>
            🍻 The Bunker
          </div>
        </div>

        {loading ? (
          <div className="mt-12 text-center text-white/50">
            Loading The Lot...
          </div>
        ) : (
          <div className="mt-12 space-y-10">
            <section>
              <div className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-red-400">
                🔴 Live Now
              </div>

              {liveNow.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/50 p-5 text-center text-white/40">
                  No tournaments live right now.
                </div>
              ) : (
                <div className="space-y-4">
                  {liveNow.map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
                🏆 Recently Completed
              </div>

              {completed.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/50 p-5 text-center text-white/40">
                  No completed tournaments yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {completed.map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}