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

type Hole = {
  number: number;
  par: number;
  yards: number;
};

const defaultHoles: Hole[] = Array.from({ length: 18 }, (_, index) => ({
  number: index + 1,
  par: 4,
  yards: 0,
}));





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
const [selectedLeaderboardEntry, setSelectedLeaderboardEntry] = useState<any | null>(null);
const [selectedScorecard, setSelectedScorecard] = useState<any[]>([]);
 const [holes, setHoles] = useState<Hole[]>(defaultHoles);

const fetchLeaderboard = async (tournamentId: string) => {
  const { data: playerData } = await supabase
    .from("tournament_players")
    .select("id, name")
    .eq("tournament_id", tournamentId);

  const { data: teamData } = await supabase
    .from("teams")
    .select("id, name")
    .eq("tournament_id", tournamentId);

  const { data: scoreData } = await supabase
    .from("scores")
    .select("tournament_player_id, team_id, hole_number, strokes");

  const safePlayers = playerData || [];
  const safeTeams = teamData || [];
  const safeScores = scoreData || [];

  setPlayers(safePlayers);
  setTeams(safeTeams);
  setScores(safeScores);

  const hasTeams = safeTeams.length > 0;

  const entries = hasTeams
    ? safeTeams.map((team) => {
        const teamScores = safeScores.filter(
          (score) => score.team_id === team.id
        );

        const gross = teamScores.reduce(
          (total, score) => total + score.strokes,
          0
        );

        const thru = teamScores.length;

        return {
          id: team.id,
          name: team.name,
          thru,
          net: gross - thru * 4,
        };
      })
    : safePlayers.map((player) => {
        const playerScores = safeScores.filter(
          (score) => score.tournament_player_id === player.id
        );

        const gross = playerScores.reduce(
          (total, score) => total + score.strokes,
          0
        );

        const thru = playerScores.length;

        return {
          id: player.id,
          name: player.name,
          thru,
          net: gross - thru * 4,
        };
      });

  setLeaderboard(
    entries
      .filter((entry) => entry.thru > 0)
      .sort((a, b) => a.net - b.net)
  );
};

const openScorecard = async (entry: any) => {
  setSelectedLeaderboardEntry(entry);

  const scoreField =
    teams.length > 0
      ? "team_id"
      : "tournament_player_id";

  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq(scoreField, entry.id)
    .order("hole_number");

  if (error) {
    console.error(error);
    return;
  }

  setSelectedScorecard(data || []);
};

const toggleSection = (section: keyof typeof openSections) => {
  setOpenSections((prev) => ({
    ...prev,
    [section]: !prev[section],
  }));
};

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

  if (data?.id) {
    await fetchLeaderboard(data.id);
  }

  setLoading(false);
};

  useEffect(() => {
    fetchTournament();
  }, [code]);

  const outTotal = selectedScorecard
  .filter((s) => s.hole_number >= 1 && s.hole_number <= 9)
  .reduce((total, s) => total + s.strokes, 0);

const inTotal = selectedScorecard
  .filter((s) => s.hole_number >= 10 && s.hole_number <= 18)
  .reduce((total, s) => total + s.strokes, 0);

const roundTotal = outTotal + inTotal;

const getScoreStyle = (score: number | undefined, par: number) => {
  if (!score) return "";

  const diff = score - par;

  if (diff <= -2) {
    return "h-8 w-8 rounded-full border-2 border-yellow-400 outline outline-2 outline-offset-1 outline-yellow-400 text-yellow-400";
  }

  if (diff === -1) {
    return "h-8 w-8 rounded-full border-2 border-green-400 text-green-400";
  }

  if (diff === 1) {
    return "h-8 w-8 rounded-none border-2 border-orange-400 text-orange-400";
  }

  if (diff >= 2) {
    return "h-8 w-8 rounded-none border-2 border-red-500 outline outline-2 outline-offset-1 outline-red-500 text-red-500";
  }

  return "";
};

const formatScore = (score: number) => {
  if (score > 0) return `+${score}`;
  if (score === 0) return "E";
  return `${score}`;
};

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
                                onClick={() => openScorecard(entry)}
                                className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-black p-4 transition-all hover:border-[#ff9900]"
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






        {selectedLeaderboardEntry && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
    <div className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-black p-6 text-white">

      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
            Scorecard
          </div>

          <div className="mt-1 text-2xl font-black">
            {selectedLeaderboardEntry.name}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
  <div className="rounded-xl border border-white/10 bg-gray-950 p-3 text-center">
    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
      Out
    </div>
    <div className="mt-1 text-2xl font-black text-[#ff9900]">
      {outTotal || "-"}
    </div>
  </div>

  <div className="rounded-xl border border-white/10 bg-gray-950 p-3 text-center">
    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
      In
    </div>
    <div className="mt-1 text-2xl font-black text-[#ff9900]">
      {inTotal || "-"}
    </div>
  </div>

  <div className="rounded-xl border border-[#ff9900]/30 bg-[#ff9900]/10 p-3 text-center">
    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff9900]">
      Total
    </div>
    <div className="mt-1 text-2xl font-black text-[#ff9900]">
      {roundTotal || "-"}
    </div>
  </div>
</div>
        </div>

        <button
          onClick={() => setSelectedLeaderboardEntry(null)}
          className="text-3xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="mt-6">
        <div className="mb-4 text-center text-xs font-black uppercase tracking-[0.18em] text-white/40">
          Out
        </div>

        <div className="grid grid-cols-9 gap-2">
          {Array.from({ length: 9 }, (_, i) => {
            const holeNumber = i + 1;

            const score = selectedScorecard.find(
              (s) => s.hole_number === holeNumber
            );

            return (
              <div key={holeNumber} className="text-center">
                <div className="text-xs font-black text-white/40">
                  {holeNumber}
                </div>

                <div className="mt-1 flex h-12 items-center justify-center rounded-xl border border-white/10 bg-gray-950 text-lg font-black">
                    {score?.strokes ? (
                        <div
                        className={`flex items-center justify-center text-sm font-black ${getScoreStyle(
                            score.strokes,
                            holes.find((h) => h.number === holeNumber)?.par || 4
                        )}`}
                        >
                        {score.strokes}
                        </div>
                    ) : (
                        "-"
                    )}
                    </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 mb-4 text-center text-xs font-black uppercase tracking-[0.18em] text-white/40">
          In
        </div>

        <div className="grid grid-cols-9 gap-2">
          {Array.from({ length: 9 }, (_, i) => {
            const holeNumber = i + 10;

            const score = selectedScorecard.find(
              (s) => s.hole_number === holeNumber
            );

            return (
              <div key={holeNumber} className="text-center">
                <div className="text-xs font-black text-white/40">
                  {holeNumber}
                </div>

                <div className="mt-1 flex h-12 items-center justify-center rounded-xl border border-white/10 bg-gray-950 text-lg font-black">
                {score?.strokes ? (
                    <div
                    className={`flex items-center justify-center text-sm font-black ${getScoreStyle(
                        score.strokes,
                        holes.find((h) => h.number === holeNumber)?.par || 4
                    )}`}
                    >
                    {score.strokes}
                    </div>
                ) : (
                    "-"
                )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
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