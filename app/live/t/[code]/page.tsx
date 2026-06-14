"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Tournament = {
  id: string;
  name: string;
  code: string;
  status: "active" | "completed";
  tournament_date?: string | null;
  live_video_url?: string | null;
};

export default function PublicTournamentPage() {
  const params = useParams();
  const code = String(params.code || "").toUpperCase();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTournament = async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name, code, status, tournament_date, live_video_url")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setTournament(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTournament();
  }, [code]);

  return (
    <div className="min-h-screen bg-black px-5 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <img
            src="/ch-logo.png"
            alt="Clubs & Holes"
            className="mx-auto h-16 w-auto"
          />

          <h1 className="mt-5 text-5xl font-black tracking-tight">
            THE LOT
          </h1>

          <div className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-[#ff9900]">
            Where golf sh!t happens.
          </div>
        </div>

        {loading ? (
          <div className="mt-12 text-center text-white/50">
            Loading tournament...
          </div>
        ) : !tournament ? (
          <div className="mt-12 rounded-[2rem] border border-white/10 bg-black/60 p-6 text-center">
            <div className="text-2xl font-black">
              Tournament Not Found
            </div>

            <Link
              href="/live"
              className="mt-6 inline-block rounded-full border border-white/10 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
            >
              Back To The Lot
            </Link>
          </div>
        ) : (
          <div className="mt-10 rounded-[2rem] border border-white/10 bg-black/60 p-6 text-center shadow-2xl backdrop-blur-md">
            <div
              className={`text-xs font-black uppercase tracking-[0.25em] ${
                tournament.status === "active"
                  ? "text-red-400"
                  : "text-[#ff9900]"
              }`}
            >
              {tournament.status === "active" ? "🔴 Live Now" : "🏆 Completed"}
            </div>

            <h2 className="mt-3 text-4xl font-black">
              {tournament.name}
            </h2>

            <div className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-white/45">
              Code: {tournament.code}
            </div>

            {tournament.live_video_url && (
              <a
                href={tournament.live_video_url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-block rounded-full bg-red-500 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
              >
                Watch Live
              </a>
            )}
          </div>
        )}

        <Link
          href="/live"
          className="mx-auto mt-8 block w-fit rounded-full border border-white/10 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white/70"
        >
          Back To The Lot
        </Link>
      </div>
    </div>
  );
}