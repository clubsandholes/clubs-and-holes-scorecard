"use client";
import { supabase } from "@/lib/supabase";
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

const [players, setPlayers] = useState<string[]>([]);

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
  // BEGIN STATE
  // =========================

  const [view, setView] = useState<View>("join");
  const [menuOpen, setMenuOpen] = useState(false);
  const [tournamentCode, setTournamentCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [draftScore, setDraftScore] = useState(holes[0].par);
  const [ticker, setTicker] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // =========================
  // END STATE
  // =========================

  // =========================
  // BEGIN CURRENT HOLE
  // =========================

  const hole = holes[currentHoleIndex];

  // =========================
  // END CURRENT HOLE
  // =========================

  // =========================
  // BEGIN EFFECTS
  // =========================

  useEffect(() => {
  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from("tournament_players")
      .select("name");

    if (error) {
      console.error("Error fetching players:", error);
      return;
    }

    if (data) {
      const names = data.map((p) => p.name);
      setPlayers(names);
    }
  };

  fetchPlayers();
}, []);

  useEffect(() => {
    const savedScores = localStorage.getItem("scores");
    const savedPlayer = localStorage.getItem("playerName");

    if (savedScores) setScores(JSON.parse(savedScores));

    if (savedPlayer) {
      setPlayerName(savedPlayer);
      setView("scorecard");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("scores", JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    setDraftScore(scores[hole.number] ?? hole.par);
  }, [currentHoleIndex, scores, hole.number, hole.par]);

  // =========================
  // END EFFECTS
  // =========================

  // =========================
  // BEGIN SCORE LABEL LOGIC
  // =========================

  const getScoreLabel = (score: number, par: number) => {
    const diff = score - par;

    if (diff <= -3) return "Albatross";
    if (diff === -2) return "Eagle";
    if (diff === -1) return "Birdie";
    if (diff === 0) return "Par";
    if (diff === 1) return "Bogey";
    if (diff === 2) return "Double Bogey";
    if (diff === 3) return "Triple Bogey";

    return `+${diff}`;
  };

  // =========================
  // END SCORE LABEL LOGIC
  // =========================

  // =========================
  // BEGIN SCORE ENTRY LOGIC
  // =========================

  const changeDraftScore = (newScore: number) => {
    if (newScore < 1) return;
    setDraftScore(newScore);
  };

  const enterScore = () => {
    if (isSaving) return;

    const label = getScoreLabel(draftScore, hole.par);

    const confirmed = window.confirm(
      `Enter ${draftScore} (${label}) for Hole ${hole.number}?`
    );

    if (!confirmed) return;

    setIsSaving(true);

    setScores((prevScores) => ({
      ...prevScores,
      [hole.number]: draftScore,
    }));

    setTicker(
      `✅ Saved: ${playerName || "Player"} made ${label} on Hole ${hole.number}`
    );

    setTimeout(() => {
      setIsSaving(false);

      if (currentHoleIndex < holes.length - 1) {
        setCurrentHoleIndex(currentHoleIndex + 1);
      } else {
        setTicker("🏁 Round complete. Check the leaderboard.");
      }
    }, 700);
  };

  // =========================
  // END SCORE ENTRY LOGIC
  // =========================

  // =========================
  // BEGIN HOLE NAVIGATION
  // =========================

  const goPrev = () => {
    if (currentHoleIndex > 0) setCurrentHoleIndex(currentHoleIndex - 1);
  };

  const goNext = () => {
    if (currentHoleIndex < holes.length - 1) {
      setCurrentHoleIndex(currentHoleIndex + 1);
    }
  };

  // =========================
  // END HOLE NAVIGATION
  // =========================

  // =========================
  // BEGIN PLAYER LOCK LOGIC
  // =========================

  const selectPlayer = (name: string) => {
    const confirmed = window.confirm(`Are you sure you are ${name}?`);

    if (!confirmed) return;

    setPlayerName(name);
    localStorage.setItem("playerName", name);
    setView("scorecard");
  };

  const resetPlayer = () => {
    localStorage.removeItem("playerName");
    localStorage.removeItem("scores");
    setPlayerName("");
    setScores({});
    setCurrentHoleIndex(0);
    setTicker("");
    setView("join");
    setMenuOpen(false);
  };

  // =========================
  // END PLAYER LOCK LOGIC
  // =========================

  // =========================
  // BEGIN SCORING TOTALS
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

  const formatScore = (score: number) => {
    if (score > 0) return `+${score}`;
    if (score === 0) return "E";
    return `${score}`;
  };

  // =========================
  // END SCORING TOTALS
  // =========================

  // =========================
  // BEGIN TIEBREAKER LOGIC
  // =========================

  const getLastNHolesScore = (
    scoresObj: Record<number, number>,
    count: number
  ) => {
    const playedHoles = Object.keys(scoresObj)
      .map(Number)
      .sort((a, b) => a - b);

    const lastHoles = playedHoles.slice(-count);

    return lastHoles.reduce(
      (total, holeNumber) => total + (scoresObj[holeNumber] ?? 0),
      0
    );
  };

  const buildLeaderboardPlayer = (
    name: string,
    playerScores: Record<number, number>
  ) => {
    const gross = holes.reduce(
      (total, h) => total + (playerScores[h.number] ?? 0),
      0
    );

    const par = holes.reduce(
      (total, h) => (playerScores[h.number] ? total + h.par : total),
      0
    );

    return {
      name,
      thru: Object.keys(playerScores).length,
      gross,
      net: gross - par,
      last6: getLastNHolesScore(playerScores, 6),
      last3: getLastNHolesScore(playerScores, 3),
      last1: getLastNHolesScore(playerScores, 1),
    };
  };

  // =========================
  // END TIEBREAKER LOGIC
  // =========================

  // =========================
  // BEGIN LEADERBOARD DATA
  // =========================

  const leaderboard = [
    buildLeaderboardPlayer(playerName || "You", scores),
    buildLeaderboardPlayer("Fairway Mike", {
      1: 4,
      2: 3,
      3: 5,
      4: 4,
      5: 4,
      6: 6,
    }),
    buildLeaderboardPlayer("Anthony", {
      1: 5,
      2: 3,
      3: 5,
      4: 4,
      5: 4,
      6: 6,
    }),
    buildLeaderboardPlayer("Carlos", {
      1: 5,
      2: 3,
      3: 6,
      4: 5,
      5: 4,
    }),
  ];

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (a.net !== b.net) return a.net - b.net;
    if (a.last6 !== b.last6) return a.last6 - b.last6;
    if (a.last3 !== b.last3) return a.last3 - b.last3;
    if (a.last1 !== b.last1) return a.last1 - b.last1;
    return 0;
  });

  // =========================
  // END LEADERBOARD DATA
  // =========================

  // =========================
  // BEGIN VIEW NAVIGATION
  // =========================

  const openView = (selectedView: View) => {
    setView(selectedView);
    setMenuOpen(false);
  };

  // =========================
  // END VIEW NAVIGATION
  // =========================

  return (
    <div className="relative flex min-h-screen flex-col bg-black p-6 text-white">
      {/* =========================
          BEGIN TOP BAR
      ========================= */}

      {view !== "join" && view !== "selectPlayer" && (
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
      )}

      {/* =========================
          END TOP BAR
      ========================= */}

      {/* =========================
          BEGIN MENU
      ========================= */}

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
              onClick={() => openView("courseInfo")}
              className="rounded-xl border border-gray-700 p-4 text-left text-xl font-bold"
            >
              Course Info
            </button>

            <button
              onClick={() => openView("rules")}
              className="rounded-xl border border-gray-700 p-4 text-left text-xl font-bold"
            >
              Tournament Rules
            </button>

            <button
              onClick={resetPlayer}
              className="rounded-xl border border-red-900 p-4 text-left text-xl font-bold text-red-400"
            >
              Reset Player
            </button>
          </div>
        </div>
      )}

      {/* =========================
          END MENU
      ========================= */}

      {/* =========================
          BEGIN JOIN VIEW
      ========================= */}

      {view === "join" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
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
          END JOIN VIEW
      ========================= */}

      {/* =========================
          BEGIN PLAYER SELECT VIEW
      ========================= */}

      {view === "selectPlayer" && (
        <div className="mt-10">
          <div className="text-sm uppercase tracking-[0.3em] text-yellow-400">
            Code: {tournamentCode || "PLAY16"}
          </div>

          <h1 className="mt-3 text-4xl font-black">Select Your Name</h1>

          <div className="mt-8 space-y-3">
            {players.map((name) => (
              <button
                key={name}
                onClick={() => selectPlayer(name)}
                className="w-full rounded-2xl border border-gray-800 bg-gray-950 p-4 text-left text-xl font-bold"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =========================
          END PLAYER SELECT VIEW
      ========================= */}

      {/* =========================
          BEGIN SCORECARD VIEW
      ========================= */}

      {view === "scorecard" && (
        <>
          <div className="mt-8 text-center">
            <h1 className="text-7xl font-black">Hole {hole.number}</h1>

            <p className="mt-3 text-lg text-gray-400">
              Par {hole.par} · {hole.yards} Yards
            </p>

            <div className="mt-5 text-sm uppercase tracking-[0.25em] text-yellow-400">
              {tournamentName}
            </div>

            <div className="mt-1 text-sm text-gray-500">{golfCourseName}</div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center">
            <button
              onClick={() => changeDraftScore(draftScore + 1)}
              className="text-5xl text-gray-400 active:text-white"
            >
              ▲
            </button>

            <div className="my-4 text-[10rem] font-black leading-none">
              {draftScore}
            </div>

            <div className="mb-4 rounded-full border border-yellow-400 px-6 py-2 text-lg font-black uppercase tracking-wide text-yellow-400">
              {getScoreLabel(draftScore, hole.par)}
            </div>

            <button
              onClick={() => changeDraftScore(draftScore - 1)}
              className="text-5xl text-gray-400 active:text-white"
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
              Hole {hole.number} of {holes.length} · Through {holesPlayed} ·
              Gross: {grossTotal || "--"} ·{" "}
              {holesPlayed > 0 ? formatScore(toPar) : "--"}
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
              {ticker || "Enter a score to see updates"}
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

      {/* =========================
          END SCORECARD VIEW
      ========================= */}

      {/* =========================
          BEGIN LEADERBOARD VIEW
      ========================= */}

      {view === "leaderboard" && (
        <div className="mt-10">
          <div className="text-sm uppercase tracking-[0.3em] text-yellow-400">
            Live Standings
          </div>

          <h1 className="mt-3 text-4xl font-black">Leaderboard</h1>

          <div className="mt-8 space-y-3">
            {sortedLeaderboard.map((player, index) => (
              <div
                key={player.name}
                className={`flex items-center justify-between rounded-2xl border p-4 ${
                  index === 0
                    ? "border-yellow-400 bg-yellow-400 text-black"
                    : "border-gray-800 bg-gray-950 text-white"
                }`}
              >
                <div>
                  <div className="text-sm opacity-70">
                    {index === 0 ? "🏆 Belt Leader" : `#${index + 1}`}
                  </div>

                  <div className="text-lg font-bold">{player.name}</div>

                  <div className="text-xs opacity-70">
                    Thru {player.thru} · Gross {player.gross || "--"}
                  </div>
                </div>

                <div className="text-3xl font-black">
                  {formatScore(player.net)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================
          END LEADERBOARD VIEW
      ========================= */}

      {/* =========================
          BEGIN COURSE INFO VIEW
      ========================= */}

      {view === "courseInfo" && (
        <div className="mt-10">
          <div className="text-sm uppercase tracking-[0.3em] text-yellow-400">
            Course Info
          </div>

          <h1 className="mt-3 text-4xl font-black">Buena Vista Golf Course</h1>

          <div className="mt-8 space-y-4 text-gray-300">
            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
              <div className="text-sm text-gray-500">Address</div>
              <div className="mt-1 text-lg font-bold">
                10256 Golf Course Rd, Taft, CA 93268
              </div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
              <div className="text-sm text-gray-500">Phone</div>
              <a
                href="tel:16617696226"
                className="mt-1 block text-lg font-bold text-yellow-400"
              >
                (661) 769-6226
              </a>
            </div>

            <a
              href="https://maps.google.com/?q=Buena+Vista+Golf+Course+Taft+CA"
              target="_blank"
              className="block rounded-full bg-yellow-400 px-6 py-4 text-center font-black text-black"
            >
              OPEN MAP
            </a>

            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
              <div className="text-sm text-gray-500">Tournament Start</div>
              <div className="mt-1 text-lg font-bold">May 16 · Time TBD</div>
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
              <div className="text-sm text-gray-500">Start Type</div>
              <div className="mt-1 text-lg font-bold">
                Shotgun Start / Hole 1 Start
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          END COURSE INFO VIEW
      ========================= */}

      {/* =========================
          BEGIN RULES VIEW
      ========================= */}

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

      {/* =========================
          END RULES VIEW
      ========================= */}
    </div>
  );
}