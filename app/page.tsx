"use client";

import { useEffect, useState } from "react";

// =========================
// BEGIN STATIC DATA
// =========================

const tournamentName = "Belt Invitational";
const golfCourseName = "Buena Vista Golf Course";

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

const players = ["Fairway Mike", "Anthony", "Carlos", "Jason", "Michael Lopez"];

type View =
  | "join"
  | "selectPlayer"
  | "scorecard"
  | "leaderboard"
  | "courseInfo"
  | "rules";

// =========================
// END STATIC DATA
// =========================

export default function Home() {
  // =========================
  // STATE
  // =========================

  const [view, setView] = useState<View>("join");
  const [menuOpen, setMenuOpen] = useState(false);

  const [tournamentCode, setTournamentCode] = useState("");
  const [playerName, setPlayerName] = useState("");

  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [draftScore, setDraftScore] = useState(holes[0].par);

  const [ticker, setTicker] = useState("");

  const hole = holes[currentHoleIndex];

  // =========================
  // EFFECTS
  // =========================

  useEffect(() => {
    const saved = localStorage.getItem("scores");
    if (saved) setScores(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("scores", JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    setDraftScore(scores[hole.number] ?? hole.par);
  }, [currentHoleIndex, scores]);

  // =========================
  // SCORE LOGIC
  // =========================

  const changeDraftScore = (newScore: number) => {
    if (newScore < 1) return;
    setDraftScore(newScore);
  };

  const getScoreLabel = (score: number, par: number) => {
    const diff = score - par;
    if (diff === -2) return "Eagle";
    if (diff === -1) return "Birdie";
    if (diff === 0) return "Par";
    if (diff === 1) return "Bogey";
    if (diff === 2) return "Double Bogey";
    return `+${diff}`;
  };

  const enterScore = () => {
    const label = getScoreLabel(draftScore, hole.par);

    if (!window.confirm(`Enter ${draftScore} (${label})?`)) return;

    setScores((prev) => ({
      ...prev,
      [hole.number]: draftScore,
    }));

    setTicker(`🔥 ${playerName || "Player"} ${label} on Hole ${hole.number}`);
  };

  // =========================
  // NAVIGATION
  // =========================

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
    (total, h) => total + (scores[h.number] ?? 0),
    0
  );

  const parPlayed = holes.reduce(
    (total, h) => (scores[h.number] ? total + h.par : total),
    0
  );

  const toPar = grossTotal - parPlayed;

  // =========================
  // TIEBREAKER LOGIC
  // =========================

  const getLastScore = (scoresObj: Record<number, number>, count: number) => {
    const played = Object.keys(scoresObj).map(Number).sort((a, b) => a - b);
    const last = played.slice(-count);
    return last.reduce((sum, h) => sum + scoresObj[h], 0);
  };

  const buildPlayer = (name: string, s: Record<number, number>) => {
    const gross = holes.reduce((t, h) => t + (s[h.number] ?? 0), 0);
    const par = holes.reduce(
      (t, h) => (s[h.number] ? t + h.par : t),
      0
    );

    return {
      name,
      net: gross - par,
      last6: getLastScore(s, 6),
      last3: getLastScore(s, 3),
      last1: getLastScore(s, 1),
    };
  };

  const you = buildPlayer(playerName || "You", scores);

  const leaderboard = [
    you,
    buildPlayer("Fairway Mike", { 1: 4, 2: 3, 3: 5, 4: 4, 5: 4, 6: 6 }),
    buildPlayer("Anthony", { 1: 5, 2: 3, 3: 5, 4: 4, 5: 4, 6: 6 }),
  ];

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (a.net !== b.net) return a.net - b.net;
    if (a.last6 !== b.last6) return a.last6 - b.last6;
    if (a.last3 !== b.last3) return a.last3 - b.last3;
    if (a.last1 !== b.last1) return a.last1 - b.last1;
    return 0;
  });

  const formatScore = (n: number) => (n > 0 ? `+${n}` : n === 0 ? "E" : n);

  const openView = (v: View) => {
    setView(v);
    setMenuOpen(false);
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-black text-white p-6">

      {/* JOIN */}
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

      {/* PLAYER SELECT */}
      {view === "selectPlayer" && (
        <div>
          {players.map((p) => (
            <button
              key={p}
              onClick={() => {
                if (confirm(`Are you ${p}?`)) {
                  setPlayerName(p);
                  setView("scorecard");
                }
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* SCORECARD */}
      {view === "scorecard" && (
        <>
          <h1 className="text-6xl text-center">Hole {hole.number}</h1>
          <div className="text-center">
            Par {hole.par} · {hole.yards}
          </div>

          <div className="text-center mt-2 text-yellow-400">
            {tournamentName}
          </div>
          <div className="text-center text-gray-500">{golfCourseName}</div>

          <div className="flex flex-col items-center mt-10">
            <button onClick={() => changeDraftScore(draftScore + 1)}>▲</button>
            <div className="text-8xl">{draftScore}</div>
            <div>{getScoreLabel(draftScore, hole.par)}</div>
            <button onClick={() => changeDraftScore(draftScore - 1)}>▼</button>
            <button onClick={enterScore}>ENTER SCORE</button>
            <div>{ticker}</div>
          </div>

          <div className="flex justify-between mt-10">
            <button onClick={goPrev}>←</button>
            <button onClick={goNext}>→</button>
          </div>
        </>
      )}

      {/* LEADERBOARD */}
      {view === "leaderboard" && (
        <div>
          {sortedLeaderboard.map((p, i) => (
            <div
              key={p.name}
              className={`p-4 ${i === 0 ? "bg-yellow-600" : ""}`}
            >
              {i === 0 && "🏆 "}
              {p.name} ({formatScore(p.net)})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}