"use client";

import { useState, useEffect } from "react";

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

const leaderboard = [
  { name: "Fairway Mike", thru: 6, gross: 25, net: -2 },
  { name: "Anthony", thru: 6, gross: 26, net: -1 },
  { name: "Carlos", thru: 5, gross: 23, net: 0 },
  { name: "Jason", thru: 6, gross: 29, net: +2 },
];

export default function Home() {
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("scores");
    return saved ? JSON.parse(saved) : {};
  }
  return {};
});

useEffect(() => {
  localStorage.setItem("scores", JSON.stringify(scores));
}, [scores]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<"scorecard" | "leaderboard" | "rules">(
    "scorecard"
  );

  const hole = holes[currentHoleIndex];
  const score = scores[hole.number] ?? hole.par;

  const updateScore = (newScore: number) => {
    if (newScore < 1) return;
    setScores({ ...scores, [hole.number]: newScore });
  };

  const goPrev = () => {
    if (currentHoleIndex > 0) setCurrentHoleIndex(currentHoleIndex - 1);
  };

  const goNext = () => {
    if (currentHoleIndex < holes.length - 1)
      setCurrentHoleIndex(currentHoleIndex + 1);
  };

  const totalScore = holes.reduce(
    (total, h) => total + (scores[h.number] ?? 0),
    0
  );

  const holesPlayed = Object.keys(scores).length;

  const openView = (selectedView: "scorecard" | "leaderboard" | "rules") => {
    setView(selectedView);
    setMenuOpen(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-black p-6 text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => openView("scorecard")}
          className="text-left text-lg font-black tracking-wide"
        >
          CLUBS & HOLES
        </button>

        <button onClick={() => setMenuOpen(true)} className="text-3xl">
          ☰
        </button>
      </div>

      {/* Slide Menu */}
      {menuOpen && (
        <div className="absolute inset-0 z-50 bg-black/95 p-6">
          <div className="flex items-center justify-between">
            <div className="text-lg font-black">MENU</div>
            <button onClick={() => setMenuOpen(false)} className="text-3xl">
              ×
            </button>
          </div>

          <div className="mt-10 flex flex-col gap-4">
            <button
              onClick={() => openView("scorecard")}
              className="rounded-xl border border-gray-700 p-4 text-left text-xl font-bold"
            >
              Scorecard
            </button>

            <button
              onClick={() => openView("leaderboard")}
              className="rounded-xl border border-gray-700 p-4 text-left text-xl font-bold"
            >
              Leaderboard
            </button>

            <button
              onClick={() => openView("rules")}
              className="rounded-xl border border-gray-700 p-4 text-left text-xl font-bold"
            >
              Tournament Rules
            </button>
          </div>
        </div>
      )}

      {/* Scorecard View */}
      {view === "scorecard" && (
        <>
          <div className="mt-8 text-center">
            <div className="text-sm uppercase tracking-[0.3em] text-yellow-400">
              Belt Invitational
            </div>
            <h1 className="mt-3 text-4xl font-black">Hole {hole.number}</h1>
            <p className="mt-2 text-gray-400">
              Par {hole.par} · {hole.yards} Yards
            </p>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center">
            <button
              onClick={() => updateScore(score + 1)}
              className="text-5xl text-gray-400 active:text-white"
            >
              ▲
            </button>

            <div className="my-4 text-[10rem] font-black leading-none">
              {score}
            </div>

            <button
              onClick={() => updateScore(score - 1)}
              className="text-5xl text-gray-400 active:text-white"
            >
              ▼
            </button>

            <button
              onClick={() => updateScore(score)}
              className="mt-8 w-full max-w-xs rounded-full bg-yellow-400 px-8 py-4 text-lg font-black text-black"
            >
              ENTER SCORE
            </button>

            <div className="mt-6 text-center text-sm text-gray-400">
              Through {holesPlayed} · Total: {totalScore || "--"}
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={goPrev}
              className="text-4xl disabled:opacity-20"
              disabled={currentHoleIndex === 0}
            >
              ←
            </button>

            <div className="max-w-[220px] text-center text-xs text-yellow-400">
              🔥 Live ticker: Mike birdied Hole 4 · New leader at -2
            </div>

            <button
              onClick={goNext}
              className="text-4xl disabled:opacity-20"
              disabled={currentHoleIndex === holes.length - 1}
            >
              →
            </button>
          </div>
        </>
      )}

      {/* Leaderboard View */}
      {view === "leaderboard" && (
        <div className="mt-10">
          <div className="text-sm uppercase tracking-[0.3em] text-yellow-400">
            Live Standings
          </div>
          <h1 className="mt-3 text-4xl font-black">Leaderboard</h1>

          <div className="mt-8 space-y-3">
            {leaderboard.map((player, index) => (
              <div
                key={player.name}
                className="flex items-center justify-between rounded-2xl border border-gray-800 bg-gray-950 p-4"
              >
                <div>
                  <div className="text-sm text-gray-500">#{index + 1}</div>
                  <div className="text-lg font-bold">{player.name}</div>
                  <div className="text-xs text-gray-500">
                    Thru {player.thru} · Gross {player.gross}
                  </div>
                </div>

                <div className="text-3xl font-black text-yellow-400">
                  {player.net > 0 ? `+${player.net}` : player.net}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules View */}
      {view === "rules" && (
        <div className="mt-10">
          <div className="text-sm uppercase tracking-[0.3em] text-yellow-400">
            Belt Rules
          </div>
          <h1 className="mt-3 text-4xl font-black">Tournament Rules</h1>

          <div className="mt-8 space-y-4 text-gray-300">
            <p>• Each player enters their own score after every hole.</p>
            <p>• Scores must be called out before moving to the next tee.</p>
            <p>• Lowest net score wins the Belt.</p>
            <p>• Tiebreaker 1: Final 6 holes.</p>
            <p>• Tiebreaker 2: Final 3 holes.</p>
            <p>• Tiebreaker 3: Hole 18.</p>
            <p>• No fake scores. No boring golf. Swing Reckless.</p>
          </div>
        </div>
      )}
    </div>
  );
}