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

type View =
  | "join"
  | "selectPlayer"
  | "scorecard"
  | "leaderboard";

// =========================
// END STATIC DATA
// =========================

export default function Home() {
  // =========================
  // STATE
  // =========================

  const [view, setView] = useState<View>("join");
  const [players, setPlayers] = useState<any[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [tournamentCode, setTournamentCode] = useState("");

  const [scores, setScores] = useState<Record<number, number>>({});
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [draftScore, setDraftScore] = useState(holes[0].par);
  const [ticker, setTicker] = useState("");

  const hole = holes[currentHoleIndex];

  // =========================
  // FETCH PLAYERS
  // =========================

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from("tournament_players")
        .select("name");

      if (error) {
        console.error(error);
        return;
      }

      setPlayers(data || []);
    };

    fetchPlayers();
  }, []);

  // =========================
  // SCORE LOGIC
  // =========================

  const changeDraftScore = (n: number) => {
    if (n < 1) return;
    setDraftScore(n);
  };

  const enterScore = () => {
    const confirmed = confirm(`Enter ${draftScore}?`);
    if (!confirmed) return;

    setScores((prev) => ({
      ...prev,
      [hole.number]: draftScore,
    }));

    setTicker(`Score saved on Hole ${hole.number}`);

    if (currentHoleIndex < holes.length - 1) {
      setCurrentHoleIndex(currentHoleIndex + 1);
    }
  };

  const goNext = () => {
    if (currentHoleIndex < holes.length - 1)
      setCurrentHoleIndex(currentHoleIndex + 1);
  };

  const goPrev = () => {
    if (currentHoleIndex > 0)
      setCurrentHoleIndex(currentHoleIndex - 1);
  };

  // =========================
  // SCORING TOTALS
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

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-black text-white p-6">

      {/* =========================
          JOIN SCREEN
      ========================= */}
      {view === "join" && (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-4xl font-black">Join Tournament</h1>

          <input
            value={tournamentCode}
            onChange={(e) => setTournamentCode(e.target.value)}
            placeholder="Enter Code"
            className="mt-6 p-4 bg-gray-800 text-center"
          />

          <button
            onClick={() => setView("selectPlayer")}
            className="mt-6 bg-yellow-400 px-6 py-3 text-black"
          >
            ENTER
          </button>
        </div>
      )}

      {/* =========================
          PLAYER SELECT
      ========================= */}
      {view === "selectPlayer" && (
        <div>
          <h2 className="text-2xl mb-4">Select Player</h2>

          {players.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                if (confirm(`Are you ${p.name}?`)) {
                  setPlayerName(p.name);
                  setView("scorecard");
                }
              }}
              className="block mb-2"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* =========================
          SCORECARD
      ========================= */}
      {view === "scorecard" && (
        <>
          <h1 className="text-5xl text-center">
            Hole {hole.number}
          </h1>

          <div className="text-center">
            Par {hole.par} · {hole.yards}
          </div>

          <div className="flex flex-col items-center mt-10">
            <button onClick={() => changeDraftScore(draftScore + 1)}>
              ▲
            </button>

            <div className="text-7xl">{draftScore}</div>

            <button onClick={() => changeDraftScore(draftScore - 1)}>
              ▼
            </button>

            <button onClick={enterScore}>
              ENTER SCORE
            </button>

            <div className="mt-4">{ticker}</div>
          </div>

          <div className="flex justify-between mt-10">
            <button onClick={goPrev}>←</button>
            <button onClick={goNext}>→</button>
          </div>

          <div className="mt-6 text-center">
            Through {holesPlayed} · {net}
          </div>
        </>
      )}

      {/* =========================
          LEADERBOARD
      ========================= */}
      {view === "leaderboard" && (
        <div>
          <h1>Leaderboard</h1>

          <div>
            {playerName} ({net})
          </div>
        </div>
      )}
    </div>
  );
}