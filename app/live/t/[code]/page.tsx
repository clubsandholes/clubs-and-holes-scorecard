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

type ScoreRow = {
  tournament_player_id?: string | null;
  team_id?: string | null;
  hole_number: number;
  strokes: number;
};

type Team = {
  id: string;
  name: string;
};

type Player = {
  id: string;
  name: string;
};





export default function PublicTournamentPage() {
  const params = useParams();
  const code = String(params.code || "").toUpperCase();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [openSections, setOpenSections] = useState({
    turn: true,
    bunker: false,
    video: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

const fetchLeaderboard = async (tournamentId: string) => {
  const { data: scoreData } = await supabase
    .from("scores")
    .select("tournament_player_id, team_id, hole_number, strokes")
    .eq("tournament_id", tournamentId);

  const { data: playerData } = await supabase
    .from("tournament_players")
    .select("id, name")
    .eq("tournament_id", tournamentId);

  const { data: teamData } = await supabase
    .from("teams")
    .select("id, name")
    .eq("tournament_id", tournamentId);

  const safeScores = scoreData || [];
  const safePlayers = playerData || [];
  const safeTeams = teamData || [];

  setScores(safeScores);
  setPlayers(safePlayers);
  setTeams(safeTeams);

  const hasTeams = safeTeams.length > 0;

  const entries = hasTeams
    ? safeTeams.map((team) => {
        const teamScores = safeScores.filter((s) => s.team_id === team.id);
        const gross = teamScores.reduce((total, s) => total + s.strokes, 0);
        const thru = teamScores.length;
        const par = thru * 4;

        return {
          id: team.id,
          name: team.name,
          net: gross - par,
          thru,
        };
      })
    : safePlayers.map((player) => {
        const playerScores = safeScores.filter(
          (s) => s.tournament_player_id === player.id
        );
        const gross = playerScores.reduce((total, s) => total + s.strokes, 0);
        const thru = playerScores.length;
        const par = thru * 4;

        return {
          id: player.id,
          name: player.name,
          net: gross - par,
          thru,
        };
      });

  setLeaderboard(
    entries
      .filter((entry) => entry.thru > 0)
      .sort((a, b) => a.net - b.net)
  );
};

const toggleSection = (section: keyof typeof openSections) => {
  setOpenSections((prev) => ({
    ...prev,
    [section]: !prev[section],
  }));
};

  useEffect(() => {
    fetchTournament();
  }, [code]);

  return (
    <div className="min-h-screen bg-black px-5 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <img
            src="/clubs-n-holes.png"
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
        <div className="mt-6 rounded-[2rem] border border-white/10 bg-black/60 p-5">
                <button
                    onClick={() => toggleSection("turn")}
                    className="flex w-full items-center justify-between text-left"
                >
                    <div>
                    <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
                        🔥 The Turn
                    </div>

                    <div className="mt-1 text-sm text-white/45">
                        Live standings
                    </div>
                    </div>

                    <div className="text-3xl font-black text-[#ff9900]">
                    {openSections.turn ? "−" : "+"}
                    </div>
                </button>

                {openSections.turn && (
                    <div className="mt-5">
                    <div className="mt-5 space-y-3">
                        {leaderboard.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-black p-5 text-center text-white/50">
                            No scores yet.
                            </div>
                        ) : (
                            leaderboard.map((entry, index) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black p-4"
                            >
                                <div>
                                <div className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
                                    #{index + 1}
                                </div>

                                <div className="mt-1 text-lg font-black">
                                    {entry.name}
                                </div>
                                </div>

                                <div className="text-3xl font-black text-[#ff9900]">
                                {entry.net > 0
                                    ? `+${entry.net}`
                                    : entry.net === 0
                                    ? "E"
                                    : entry.net}
                                </div>
                            </div>
                            ))
                        )}
                        </div>
                    </div>
                )}
                </div>
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