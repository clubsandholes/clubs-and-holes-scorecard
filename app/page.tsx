"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// =========================
// BEGIN STATIC DATA
// =========================

const holes = [
  { number: 1, par: 4, yards: 385 },
  { number: 2, par: 3, yards: 165 },
  { number: 3, par: 5, yards: 525 },
  { number: 4, par: 4, yards: 410 },
  { number: 5, par: 4, yards: 360 },
  { number: 6, par: 3, yards: 145 },
  { number: 7, par: 5, yards: 540 },
  { number: 8, par: 4, yards: 395 },
  { number: 9, par: 4, yards: 420 },
];

type View = "join" | "selectPlayer" | "scorecard" | "leaderboard";

type Player = {
  id: string;
  name: string;
  claimed: boolean;
};

// =========================
// END STATIC DATA
// =========================

export default function Home() {
  // =========================
  // BEGIN STATE
  // =========================

  const [view, setView] = useState<View>("join");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [tournamentCode, setTournamentCode] = useState("");

  const [scores, setScores] = useState<Record<number, number>>({});
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [draftScore, setDraftScore] = useState(holes[0].par);
  const [ticker, setTicker] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hole = holes[currentHoleIndex];

  // =========================
  // END STATE
  // =========================

  // =========================
  // BEGIN FETCH PLAYERS
  // =========================

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from("tournament_players")
      .select("id, name, claimed")
      .order("name");

    if (error) {
      console.error("Error fetching players:", error);
      return;
    }

    setPlayers(data || []);
  };

  useEffect(() => {
    fetchPlayers();

    const savedPlayerId = localStorage.getItem("selectedPlayerId");
    const savedPlayerName = localStorage.getItem("playerName");

    if (savedPlayerId && savedPlayerName) {
      setSelectedPlayerId(savedPlayerId);
      setPlayerName(savedPlayerName);
      setView("scorecard");
    }
  }, []);

  // =========================
  // END FETCH PLAYERS
  // =========================

  // =========================
  // BEGIN FETCH SCORES
  // =========================

  const fetchScores = async (playerId: string) => {
    const { data, error } = await supabase
      .from("scores")
      .select("hole_number, strokes")
      .eq("tournament_player_id", playerId);

    if (error) {
      console.error("Error fetching scores:", error);
      return;
    }

    const scoreMap: Record<number, number> = {};

    (data || []).forEach((score) => {
      scoreMap[score.hole_number] = score.strokes;
    });

    setScores(scoreMap);
  };

  useEffect(() => {
    if (selectedPlayerId) {
      fetchScores(selectedPlayerId);
    }
  }, [selectedPlayerId]);

  // =========================
  // END FETCH SCORES
  // =========================

  // =========================
  // BEGIN PLAYER LOCK LOGIC
  // =========================

  const selectPlayer = async (player: Player) => {
    if (player.claimed) {
      alert(`${player.name} has already been claimed.`);
      return;
    }

    const confirmed = confirm(`Are you sure you are ${player.name}?`);
    if (!confirmed) return;

    const { data, error } = await supabase
      .from("tournament_players")
      .update({
        claimed: true,
        claimed_at: new Date().toISOString(),
      })
      .eq("id", player.id)
      .eq("claimed", false)
      .select("id, name")
      .single();

    if (error || !data) {
      alert("This player may have already been claimed. Please refresh.");
      fetchPlayers();
      return;
    }

    localStorage.setItem("selectedPlayerId", data.id);
    localStorage.setItem("playerName", data.name);

    setSelectedPlayerId(data.id);
    setPlayerName(data.name);
    setView("scorecard");
  };

  const resetLocalPlayer = () => {
    localStorage.removeItem("selectedPlayerId");
    localStorage.removeItem("playerName");

    setSelectedPlayerId("");
    setPlayerName("");
    setScores({});
    setCurrentHoleIndex(0);
    setTicker("");
    setView("join");
  };

  // =========================
  // END PLAYER LOCK LOGIC
  // =========================

  // =========================
  // BEGIN SCORE LOGIC
  // =========================

  useEffect(() => {
    setDraftScore(scores[hole.number] ?? hole.par);
  }, [currentHoleIndex, scores, hole.number, hole.par]);

  const changeDraftScore = (n: number) => {
    if (n < 1) return;
    setDraftScore(n);
  };

  const enterScore = async () => {
    if (isSaving) return;

    if (!selectedPlayerId) {
      alert("No player selected.");
      return;
    }

    const confirmed = confirm(`Enter ${draftScore} for Hole ${hole.number}?`);
    if (!confirmed) return;

    setIsSaving(true);

    const { error } = await supabase.from("scores").upsert(
      {
        tournament_player_id: selectedPlayerId,
        hole_number: hole.number,
        strokes: draftScore,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "tournament_player_id,hole_number",
      }
    );

    if (error) {
      console.error("Error saving score:", error);
      alert("Score did not save. Try again.");
      setIsSaving(false);
      return;
    }

    setScores((prev) => ({
      ...prev,
      [hole.number]: draftScore,
    }));

    setTicker(`✅ ${playerName} saved ${draftScore} on Hole ${hole.number}`);

    setTimeout(() => {
      setIsSaving(false);

      if (currentHoleIndex < holes.length - 1) {
        setCurrentHoleIndex(currentHoleIndex + 1);
      } else {
        setTicker("🏁 Round complete. Check the leaderboard.");
      }
    }, 600);
  };

  const goNext = () => {
    if (currentHoleIndex < holes.length - 1) {
      setCurrentHoleIndex(currentHoleIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentHoleIndex > 0) {
      setCurrentHoleIndex(currentHoleIndex - 1);
    }
  };

  // =========================
  // END SCORE LOGIC
  // =========================

  // =========================
  // BEGIN SCORING TOTALS
  // =========================

  const holesPlayed = Object.keys(scores).length;

  const grossTotal = holes.reduce(
    (t, h) => t + (scores[h.number] ?? 0),
    0
  );

  const parPlayed = holes.reduce(
    (t, h) => (scores[h.number] ? t + h.par : t),
    0
  );

  const net = grossTotal - parPlayed;

  const formatScore = (score: number) => {
    if (score > 0) return `+${score}`;
    if (score === 0) return "E";
    return `${score}`;
  };

  // =========================
  // END SCORING TOTALS
  // =========================

  // =========================
  // BEGIN UI
  // =========================

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      {/* =========================
          BEGIN JOIN SCREEN
      ========================= */}

      {view === "join" && (
        <div className="flex h-screen flex-col items-center justify-center text-center">
          <div className="text-sm uppercase tracking-[0.3em] text-yellow-400">
            Clubs & Holes
          </div>

          <h1 className="mt-4 text-4xl font-black">Join Tournament</h1>

          <input
            value={tournamentCode}
            onChange={(e) => setTournamentCode(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            className="mt-8 w-full max-w-xs rounded-xl bg-gray-900 p-4 text-center text-2xl font-bold uppercase outline-none"
          />

          <button
            onClick={() => setView("selectPlayer")}
            className="mt-6 w-full max-w-xs rounded-full bg-yellow-400 px-6 py-4 font-black text-black"
          >
            ENTER
          </button>
        </div>
      )}

      {/* =========================
          END JOIN SCREEN
      ========================= */}

      {/* =========================
          BEGIN PLAYER SELECT
      ========================= */}

      {view === "selectPlayer" && (
        <div className="mt-10">
          <div className="text-sm uppercase tracking-[0.3em] text-yellow-400">
            Code: {tournamentCode || "PLAY16"}
          </div>

          <h1 className="mt-3 text-4xl font-black">Select Your Name</h1>

          <div className="mt-8 space-y-3">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPlayer(p)}
                disabled={p.claimed}
                className={`w-full rounded-2xl border p-4 text-left text-xl font-bold ${
                  p.claimed
                    ? "border-gray-900 bg-gray-950 text-gray-600"
                    : "border-gray-800 bg-gray-950 text-white"
                }`}
              >
                {p.name}
                {p.claimed && (
                  <span className="ml-2 text-sm text-red-400">
                    Already Claimed
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={fetchPlayers}
            className="mt-6 text-sm text-yellow-400"
          >
            Refresh Players
          </button>
        </div>
      )}

      {/* =========================
          END PLAYER SELECT
      ========================= */}

      {/* =========================
          BEGIN SCORECARD
      ========================= */}

      {view === "scorecard" && (
        <>
          <div className="flex items-center justify-between">
            <button className="text-left text-lg font-black tracking-wide">
              CLUBS & HOLES
            </button>

            <button onClick={resetLocalPlayer} className="text-sm text-red-400">
              Change Player
            </button>
          </div>

          <div className="mt-8 text-center">
            <div className="text-sm uppercase tracking-[0.3em] text-yellow-400">
              {playerName}
            </div>

            <h1 className="mt-4 text-7xl font-black">Hole {hole.number}</h1>

            <div className="mt-3 text-lg text-gray-400">
              Par {hole.par} · {hole.yards} Yards
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center">
            <button
              onClick={() => changeDraftScore(draftScore + 1)}
              className="text-5xl text-gray-400"
            >
              ▲
            </button>

            <div className="my-4 text-[10rem] font-black leading-none">
              {draftScore}
            </div>

            <button
              onClick={() => changeDraftScore(draftScore - 1)}
              className="text-5xl text-gray-400"
            >
              ▼
            </button>

            <button
              onClick={enterScore}
              disabled={isSaving}
              className="mt-8 w-full max-w-xs rounded-full bg-yellow-400 px-8 py-4 text-lg font-black text-black disabled:opacity-50"
            >
              {isSaving ? "SAVING..." : "ENTER SCORE"}
            </button>

            <div className="mt-6 text-center text-sm text-gray-400">
              Hole {hole.number} of {holes.length} · Through {holesPlayed} ·{" "}
              {formatScore(net)}
            </div>

            <div className="mt-4 max-w-xs text-center text-xs text-yellow-400">
              {ticker || "Enter a score to see updates"}
            </div>
          </div>

          <div className="mt-10 flex justify-between">
            <button
              onClick={goPrev}
              disabled={currentHoleIndex === 0}
              className="text-4xl disabled:opacity-20"
            >
              ←
            </button>

            <button
              onClick={() => setView("leaderboard")}
              className="rounded-full border border-gray-700 px-4 py-2 text-sm"
            >
              Leaderboard
            </button>

            <button
              onClick={goNext}
              disabled={currentHoleIndex === holes.length - 1}
              className="text-4xl disabled:opacity-20"
            >
              →
            </button>
          </div>
        </>
      )}

      {/* =========================
          END SCORECARD
      ========================= */}

      {/* =========================
          BEGIN LEADERBOARD
      ========================= */}

      {view === "leaderboard" && (
        <div className="mt-10">
          <button
            onClick={() => setView("scorecard")}
            className="mb-6 text-yellow-400"
          >
            ← Back to Scorecard
          </button>

          <h1 className="text-4xl font-black">Leaderboard</h1>

          <div className="mt-8 rounded-2xl border border-yellow-400 bg-yellow-400 p-4 text-black">
            <div className="text-sm font-bold">🏆 Current Player</div>
            <div className="mt-1 text-xl font-black">{playerName}</div>
            <div className="text-4xl font-black">{formatScore(net)}</div>
            <div className="text-sm">
              Thru {holesPlayed} · Gross {grossTotal || "--"}
            </div>
          </div>
        </div>
      )}

      {/* =========================
          END LEADERBOARD
      ========================= */}
    </div>
  );
}