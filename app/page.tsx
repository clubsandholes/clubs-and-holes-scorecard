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

type ScoreRow = {
  tournament_player_id: string;
  hole_number: number;
  strokes: number;
};

type TickerEvent = {
  id: string;
  message: string;
  event_type: string;
  created_at: string;
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
  const [allScores, setAllScores] = useState<ScoreRow[]>([]);
  const [tickerEvents, setTickerEvents] = useState<TickerEvent[]>([]);

  const [currentTournamentId, setCurrentTournamentId] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [tournamentCode, setTournamentCode] = useState("");

  const [scores, setScores] = useState<Record<number, number>>({});
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [draftScore, setDraftScore] = useState(holes[0].par);
  const [isSaving, setIsSaving] = useState(false);

  const hole = holes[currentHoleIndex];

  // =========================
  // END STATE
  // =========================

  // =========================
  // BEGIN TOURNAMENT JOIN LOGIC
  // =========================

  const joinTournament = async () => {
    const code = tournamentCode.trim().toUpperCase();

    if (!code) {
      alert("Enter tournament code.");
      return;
    }

    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name, code")
      .eq("code", code)
      .single();

    if (error || !data) {
      alert("Tournament not found. Check the code.");
      return;
    }

    setCurrentTournamentId(data.id);
    localStorage.setItem("currentTournamentId", data.id);
    localStorage.setItem("tournamentCode", code);

    await fetchPlayers(data.id);
    await fetchAllScores(data.id);
    await fetchTickerEvents(data.id);

    setView("selectPlayer");
  };

  // =========================
  // END TOURNAMENT JOIN LOGIC
  // =========================

  // =========================
  // BEGIN DATA FETCHING
  // =========================

  const fetchPlayers = async (tournamentId?: string) => {
    const idToUse = tournamentId || currentTournamentId;

    if (!idToUse) return;

    const { data, error } = await supabase
      .from("tournament_players")
      .select("id, name, claimed")
      .eq("tournament_id", idToUse)
      .order("name");

    if (error) {
      console.error("Error fetching players:", error);
      return;
    }

    setPlayers(data || []);
  };

  const fetchAllScores = async (tournamentId?: string) => {
    const idToUse = tournamentId || currentTournamentId;

    if (!idToUse) return;

    const { data: tournamentPlayers, error: playersError } = await supabase
      .from("tournament_players")
      .select("id")
      .eq("tournament_id", idToUse);

    if (playersError) {
      console.error("Error fetching tournament player ids:", playersError);
      return;
    }

    const playerIds = (tournamentPlayers || []).map((p) => p.id);

    if (playerIds.length === 0) {
      setAllScores([]);
      return;
    }

    const { data, error } = await supabase
      .from("scores")
      .select("tournament_player_id, hole_number, strokes")
      .in("tournament_player_id", playerIds);

    if (error) {
      console.error("Error fetching all scores:", error);
      return;
    }

    setAllScores(data || []);
  };

  const fetchScoresForPlayer = async (playerId: string) => {
    const { data, error } = await supabase
      .from("scores")
      .select("hole_number, strokes")
      .eq("tournament_player_id", playerId);

    if (error) {
      console.error("Error fetching player scores:", error);
      return;
    }

    const scoreMap: Record<number, number> = {};

    (data || []).forEach((score) => {
      scoreMap[score.hole_number] = score.strokes;
    });

    setScores(scoreMap);
  };

  const fetchTickerEvents = async (tournamentId?: string) => {
    const idToUse = tournamentId || currentTournamentId;

    if (!idToUse) return;

    const { data, error } = await supabase
      .from("ticker_events")
      .select("id, message, event_type, created_at")
      .eq("tournament_id", idToUse)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching ticker events:", error);
      return;
    }

    setTickerEvents(data || []);
  };

  useEffect(() => {
    const savedTournamentId = localStorage.getItem("currentTournamentId");
    const savedTournamentCode = localStorage.getItem("tournamentCode");
    const savedPlayerId = localStorage.getItem("selectedPlayerId");
    const savedPlayerName = localStorage.getItem("playerName");

    if (savedTournamentId) {
      setCurrentTournamentId(savedTournamentId);
      setTournamentCode(savedTournamentCode || "");

      fetchPlayers(savedTournamentId);
      fetchAllScores(savedTournamentId);
      fetchTickerEvents(savedTournamentId);
    }

    if (savedPlayerId && savedPlayerName) {
      setSelectedPlayerId(savedPlayerId);
      setPlayerName(savedPlayerName);
      setView("scorecard");
      fetchScoresForPlayer(savedPlayerId);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentTournamentId) {
        fetchPlayers(currentTournamentId);
        fetchAllScores(currentTournamentId);
        fetchTickerEvents(currentTournamentId);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentTournamentId]);

  // =========================
  // END DATA FETCHING
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

    fetchScoresForPlayer(data.id);
    fetchPlayers();
  };

  const resetLocalPlayer = () => {
    localStorage.removeItem("selectedPlayerId");
    localStorage.removeItem("playerName");

    setSelectedPlayerId("");
    setPlayerName("");
    setScores({});
    setCurrentHoleIndex(0);
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

  const getScoreLabel = (strokes: number, par: number) => {
    const diff = strokes - par;

    if (diff <= -3) return "Albatross";
    if (diff === -2) return "Eagle";
    if (diff === -1) return "Birdie";
    if (diff === 0) return "Par";
    if (diff === 1) return "Bogey";
    if (diff === 2) return "Double Bogey";
    if (diff === 3) return "Triple Bogey";

    return `+${diff}`;
  };

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

    const scoreLabel = getScoreLabel(draftScore, hole.par);

    const confirmed = confirm(
      `Enter ${draftScore} (${scoreLabel}) for Hole ${hole.number}?`
    );

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

    const tickerMessage = `✅ ${playerName} made ${scoreLabel} on Hole ${hole.number}`;

    if (currentTournamentId) {
      const { error: tickerError } = await supabase.from("ticker_events").insert({
        tournament_id: currentTournamentId,
        message: tickerMessage,
        event_type: "score",
      });

      if (tickerError) {
        console.error("Error saving ticker event:", tickerError);
      }
    }

    setScores((prev) => ({
      ...prev,
      [hole.number]: draftScore,
    }));

    await fetchAllScores();
    await fetchTickerEvents();

    setTimeout(() => {
      setIsSaving(false);

      if (currentHoleIndex < holes.length - 1) {
        setCurrentHoleIndex(currentHoleIndex + 1);
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
  // BEGIN SCORING HELPERS
  // =========================

  const getPlayerScoreMap = (playerId: string) => {
    const map: Record<number, number> = {};

    allScores
      .filter((score) => score.tournament_player_id === playerId)
      .forEach((score) => {
        map[score.hole_number] = score.strokes;
      });

    return map;
  };

  const getGrossTotal = (scoreMap: Record<number, number>) => {
    return holes.reduce((total, h) => total + (scoreMap[h.number] ?? 0), 0);
  };

  const getParPlayed = (scoreMap: Record<number, number>) => {
    return holes.reduce(
      (total, h) => (scoreMap[h.number] ? total + h.par : total),
      0
    );
  };

  const getLastHole = (scoreMap: Record<number, number>) => {
    const played = Object.keys(scoreMap)
      .map(Number)
      .sort((a, b) => a - b);

    return played.length ? played[played.length - 1] : null;
  };

  const getLastNToPar = (scoreMap: Record<number, number>, count: number) => {
    const played = Object.keys(scoreMap)
      .map(Number)
      .sort((a, b) => a - b);

    const last = played.slice(-count);

    return last.reduce((total, holeNumber) => {
      const holeInfo = holes.find((h) => h.number === holeNumber);
      if (!holeInfo) return total;

      return total + (scoreMap[holeNumber] - holeInfo.par);
    }, 0);
  };

  const formatScore = (score: number) => {
    if (score > 0) return `+${score}`;
    if (score === 0) return "E";
    return `${score}`;
  };

  // =========================
  // END SCORING HELPERS
  // =========================

  // =========================
  // BEGIN CURRENT PLAYER TOTALS
  // =========================

  const holesPlayed = Object.keys(scores).length;
  const grossTotal = getGrossTotal(scores);
  const parPlayed = getParPlayed(scores);
  const net = grossTotal - parPlayed;

  // =========================
  // END CURRENT PLAYER TOTALS
  // =========================

  // =========================
  // BEGIN LIVE LEADERBOARD DATA
  // =========================

  const leaderboard = players.map((player) => {
    const playerScores = getPlayerScoreMap(player.id);
    const gross = getGrossTotal(playerScores);
    const par = getParPlayed(playerScores);
    const thru = Object.keys(playerScores).length;
    const lastHole = getLastHole(playerScores);

    return {
      id: player.id,
      name: player.name,
      thru,
      gross,
      net: gross - par,
      lastHole,
      lastHoleScore: lastHole ? playerScores[lastHole] : null,
      last6: getLastNToPar(playerScores, 6),
      last3: getLastNToPar(playerScores, 3),
      last1: getLastNToPar(playerScores, 1),
    };
  });

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (a.net !== b.net) return a.net - b.net;
    if (a.last6 !== b.last6) return a.last6 - b.last6;
    if (a.last3 !== b.last3) return a.last3 - b.last3;
    if (a.last1 !== b.last1) return a.last1 - b.last1;
    return a.name.localeCompare(b.name);
  });

  const latestTickerMessage =
    tickerEvents.length > 0
      ? tickerEvents.map((event) => event.message).join(" · ")
      : "Live ticker will appear here";

  // =========================
  // END LIVE LEADERBOARD DATA
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
            onClick={joinTournament}
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
            onClick={() => fetchPlayers()}
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

            <div className="mb-4 rounded-full border border-yellow-400 px-6 py-2 text-lg font-black uppercase tracking-wide text-yellow-400">
              {getScoreLabel(draftScore, hole.par)}
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

            <div className="mt-4 w-full border-t border-gray-800 py-3 text-center">
              <div className="animate-ticker-fade text-sm font-medium text-yellow-400">
                {latestTickerMessage}
              </div>
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

          <div className="mt-4 rounded-xl border border-gray-800 bg-gray-950 p-3 text-xs text-yellow-400">
            {latestTickerMessage}
          </div>

          <div className="mt-8 space-y-3">
            {sortedLeaderboard.map((player, index) => (
              <div
                key={player.id}
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

                  <div className="text-xs opacity-70">
                    Last:{" "}
                    {player.lastHole
                      ? `Hole ${player.lastHole} - ${player.lastHoleScore}`
                      : "--"}
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
          END LEADERBOARD
      ========================= */}
    </div>
  );
}