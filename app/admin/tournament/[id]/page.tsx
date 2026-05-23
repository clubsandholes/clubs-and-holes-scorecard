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
  const [adminMessage, setAdminMessage] = useState("");

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

  const sendAdminAlert = async () => {
    if (!adminMessage.trim()) {
      alert("Enter an admin alert message.");
      return;
    }

    const { error } = await supabase.from("ticker_events").insert({
      tournament_id: tournamentId,
      message: `🚨 ADMIN ALERT: ${adminMessage.trim()}`,
      event_type: "admin",
    });

    if (error) {
      console.error(error);
      alert("Admin alert failed.");
      return;
    }

    setAdminMessage("");
    alert("Admin alert sent.");
  };

  const clearTicker = async () => {
    const confirmed = confirm("Clear ticker events for this tournament?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("ticker_events")
      .delete()
      .eq("tournament_id", tournamentId);

    if (error) {
      console.error(error);
      alert("Ticker could not be cleared.");
      return;
    }

    alert("Ticker cleared.");
  };

  const clearScores = async () => {
    const confirmed = confirm("Clear all scores for this tournament?");
    if (!confirmed) return;

    const { data: tournamentPlayers, error: playersError } = await supabase
      .from("tournament_players")
      .select("id")
      .eq("tournament_id", tournamentId);

    if (playersError) {
      console.error(playersError);
      alert("Could not find tournament players.");
      return;
    }

    const playerIds = (tournamentPlayers || []).map((p) => p.id);

    if (playerIds.length === 0) {
      alert("No players found.");
      return;
    }

    const { error } = await supabase
      .from("scores")
      .delete()
      .in("tournament_player_id", playerIds);

    if (error) {
      console.error(error);
      alert("Scores could not be cleared.");
      return;
    }

    alert("Scores cleared.");
  };

  const unlockPlayers = async () => {
    const confirmed = confirm("Unlock all players for this tournament?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("tournament_players")
      .update({
        claimed: false,
        claimed_at: null,
      })
      .eq("tournament_id", tournamentId);

    if (error) {
      console.error(error);
      alert("Players could not be unlocked.");
      return;
    }

    alert("Players unlocked.");
  };

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

      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Live Controls
        </div>

        <h2 className="mt-2 text-2xl font-black">Event Control Room</h2>

        <textarea
          value={adminMessage}
          onChange={(e) => setAdminMessage(e.target.value)}
          placeholder="Type admin alert..."
          className="mt-5 min-h-28 w-full rounded-2xl bg-black p-4 text-white outline-none"
        />

        <button
          onClick={sendAdminAlert}
          className="mt-4 w-full rounded-full bg-[#ff9900] px-6 py-4 font-black text-black"
        >
          SEND ADMIN ALERT
        </button>

        <div className="mt-6 grid gap-3">
          <button
            onClick={clearTicker}
            className="rounded-2xl border border-white/10 bg-black p-4 text-left font-black text-white"
          >
            Clear Ticker
          </button>

          <button
            onClick={clearScores}
            className="rounded-2xl border border-white/10 bg-black p-4 text-left font-black text-white"
          >
            Clear Scores
          </button>

          <button
            onClick={unlockPlayers}
            className="rounded-2xl border border-white/10 bg-black p-4 text-left font-black text-white"
          >
            Unlock Players
          </button>
        </div>
      </div>
    </div>
  );
}