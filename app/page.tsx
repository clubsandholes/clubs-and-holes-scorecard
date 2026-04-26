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

  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [draftScore, setDraftScore] = useState(holes[0].par);
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<View>("join");
  const [tournamentCode, setTournamentCode] = useState("");
  const [playerName, setPlayerName] = useState("");
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

  const enterScore = () => {
    const confirmed = window.confirm(
      `Enter ${draftScore} for Hole ${hole.number}?`
    );
    if (!confirmed) return;

    setScores((prev) => ({
      ...prev,
      [hole.number]: draftScore,
    }));
  };

  // =========================
  // NAVIGATION
  // =========================

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
  // SCORING CALCULATIONS
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

  const getLastNHolesScore = (scoresObj: Record<number, number>, n: number) => {
    const playedHoles = Object.keys(scoresObj)
      .map(Number)
      .sort((a, b) => a - b);

    const lastHoles = playedHoles.slice(-n);

    return lastHoles.reduce(
      (total, holeNum) => total + (scoresObj[holeNum] ?? 0),
      0
    );
  };

  const buildPlayer = (name: string, scoresObj: Record<number, number>) => {
    const gross = holes.reduce(
      (total, h) => total + (scoresObj[h.number] ?? 0),
      0
    );

    const par = holes.reduce(
      (total, h) => (scoresObj[h.number] ? total + h.par : total),
      0
    );

    return {
      name,
      thru: Object.keys(scoresObj).length,
      gross,
      net: gross - par,
      last6: getLastNHolesScore(scoresObj, 6),
      last3: getLastNHolesScore(scoresObj, 3),
      last1: getLastNHolesScore(scoresObj, 1),
    };
  };

  // YOUR PLAYER
  const you = buildPlayer(playerName || "You", scores);

  // FAKE PLAYERS (for now)
  const fakePlayers = [
    buildPlayer("Fairway Mike", { 1: 4, 2: 3, 3: 5, 4: 4, 5: 4, 6: 6 }),
    buildPlayer("Anthony", { 1: 5, 2: 3, 3: 5, 4: 4, 5: 4, 6: 6 }),
    buildPlayer("Carlos", { 1: 5, 2: 3, 3: 6, 4: 5, 5: 4 }),
  ];

  const leaderboard = [you, ...fakePlayers];

  // =========================
  // SORT WITH TIEBREAKERS
  // =========================

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (a.net !== b.net) return a.net - b.net;
    if (a.last6 !== b.last6) return a.last6 - b.last6;
    if (a.last3 !== b.last3) return a.last3 - b.last3;
    if (a.last1 !== b.last1) return a.last1 - b.last1;
    return 0;
  });

  const formatScore = (score: number) => {
    if (score > 0) return `+${score}`;
    if (score === 0) return "E";
    return `${score}`;
  };

  // =========================
  // VIEW SWITCH
  // =========================

  const openView = (v: View) => {
    setView(v);
    setMenuOpen(false);
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="relative flex min-h-screen flex-col bg-black p-6 text-white">

      {/* TOP BAR */}
      {view !== "join" && view !== "selectPlayer" && (
        <div className="flex justify-between">
          <button onClick={() => openView("scorecard")}>
            CLUBS & HOLES
          </button>
          <button onClick={() => setMenuOpen(true)}>☰</button>
        </div>
      )}

      {/* MENU */}
      {menuOpen && (
        <div className="absolute inset-0 bg-black p-6">
          <button onClick={() => openView("scorecard")}>Scorecard</button>
          <button onClick={() => openView("leaderboard")}>Leaderboard</button>
          <button onClick={() => openView("courseInfo")}>Course Info</button>
          <button onClick={() => openView("rules")}>Rules</button>
        </div>
      )}

      {/* SCORECARD */}
      {view === "scorecard" && (
        <>
          <h1 className="text-6xl font-black text-center">
            Hole {hole.number}
          </h1>

          <div className="text-center text-gray-400">
            Par {hole.par} · {hole.yards}
          </div>

          <div className="text-center text-yellow-400 mt-4">
            {tournamentName}
          </div>

          <div className="text-center text-gray-500">
            {golfCourseName}
          </div>

          <div className="flex flex-col items-center mt-10">
            <button onClick={() => changeDraftScore(draftScore + 1)}>▲</button>
            <div className="text-8xl">{draftScore}</div>
            <button onClick={() => changeDraftScore(draftScore - 1)}>▼</button>

            <button onClick={enterScore}>ENTER SCORE</button>

            <div className="mt-4 text-yellow-400">
              {ticker || "Enter a score"}
            </div>
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
              className={`p-4 border ${
                i === 0 ? "border-yellow-400 bg-yellow-900" : ""
              }`}
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