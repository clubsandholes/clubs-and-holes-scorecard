"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Tournament = {
  id: string;
  name: string;
  code: string;
};

export default function TournamentAdminPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTournament = async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name, code")
      .eq("id", tournamentId)
      .single();

    if (error) {
      console.error(error);
      alert("Tournament not found.");
      setLoading(false);
      return;
    }

    setTournament(data);
    setLoading(false);
  };

  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
    }
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 text-white">
        Loading tournament...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black p-6 text-white">
        Tournament not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Clubs & Holes Admin
      </div>

      <h1 className="mt-2 text-4xl font-black">{tournament.name}</h1>

      <p className="mt-2 text-gray-400">
        Tournament Code:{" "}
        <span className="font-black text-[#ff9900]">{tournament.code}</span>
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