"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// =========================
// BEGIN STATIC DATA
// =========================

const accentColor = "#ff9900";

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
  | "leaderboard"
  | "courseInfo"
  | "rules";

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
  const [menuOpen, setMenuOpen] = useState(false);

  const [players, setPlayers] = useState<Player[]>([]);
  const [previousLeaderboard, setPreviousLeaderboard] = useState<string[]>([]);
  const [allScores, setAllScores] = useState<ScoreRow[]>([]);
  const [tickerEvents, setTickerEvents] = useState<TickerEvent[]>([]);
  const [tickerIndex, setTickerIndex] = useState(0);

  const [activeAdminAlert, setActiveAdminAlert] = useState<TickerEvent | null>(
    null
  );
  const [lastAdminAlertId, setLastAdminAlertId] = useState("");

  const [currentTournamentId, setCurrentTournamentId] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [tournamentCode, setTournamentCode] = useState("");

  const [scores, setScores] = useState<Record<number, number>>({});
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [draftScore, setDraftScore] = useState(holes[0].par);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [leaderboardUpdatedMessage, setLeaderboardUpdatedMessage] = useState("");

  const hole = holes[currentHoleIndex];
  const currentHoleHasScore = scores[hole.number] !== undefined;

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
      .limit(10);

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

  // =========================
  // END DATA FETCHING
  // =========================

  // =========================
  // BEGIN REALTIME SUBSCRIPTIONS
  // =========================

  useEffect(() => {
    if (!currentTournamentId) return;

    const channel = supabase
      .channel(`live-tournament-${currentTournamentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores" },
        async () => {
          await fetchAllScores(currentTournamentId);

          if (selectedPlayerId) {
            await fetchScoresForPlayer(selectedPlayerId);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ticker_events" },
        async () => {
          await fetchTickerEvents(currentTournamentId);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournament_players" },
        async () => {
          await fetchPlayers(currentTournamentId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentTournamentId, selectedPlayerId]);

  // =========================
  // END REALTIME SUBSCRIPTIONS
  // =========================

  // =========================
  // BEGIN TICKER ROTATION
  // =========================

  const scoreTickerEvents = tickerEvents.filter(
    (event) => event.event_type !== "admin"
  );

  useEffect(() => {
    if (scoreTickerEvents.length === 0) return;

    const interval = setInterval(() => {
      setTickerIndex((currentIndex) =>
        currentIndex >= scoreTickerEvents.length - 1 ? 0 : currentIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [scoreTickerEvents.length]);

  const latestTickerMessage =
    scoreTickerEvents.length > 0
      ? scoreTickerEvents[tickerIndex]?.message || "Live ticker will appear here"
      : "Live ticker will appear here";

  // =========================
  // END TICKER ROTATION
  // =========================

  // =========================
  // BEGIN ADMIN ALERT LOGIC
  // =========================

  useEffect(() => {
    const latestAdminAlert = tickerEvents.find(
      (event) => event.event_type === "admin"
    );

    if (!latestAdminAlert) return;
    if (latestAdminAlert.id === lastAdminAlertId) return;

    setLastAdminAlertId(latestAdminAlert.id);
    setActiveAdminAlert(latestAdminAlert);

    const timeout = setTimeout(() => {
      setActiveAdminAlert(null);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [tickerEvents]);

  // =========================
  // END ADMIN ALERT LOGIC
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
    setMenuOpen(false);
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
  const handleScoreSwipe = (endY: number) => {
  if (touchStartY === null) return;

  const swipeDistance = touchStartY - endY;

  if (Math.abs(swipeDistance) < 30) {
    setTouchStartY(null);
    return;
  }

  if (swipeDistance > 0) {
    changeDraftScore(draftScore + 1);
  } else {
    changeDraftScore(draftScore - 1);
  }

  setTouchStartY(null);
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

    const scoreDiff = draftScore - hole.par;
    let tickerMessage = "";

    if (scoreDiff <= -1) {
      tickerMessage = `🔥 ${playerName} made ${scoreLabel} on Hole ${hole.number}`;
    }

    if (scoreDiff >= 2) {
      tickerMessage = `😬 ${playerName} made ${scoreLabel} on Hole ${hole.number}`;
    }

    if (currentTournamentId && tickerMessage) {
      await supabase.from("ticker_events").insert({
        tournament_id: currentTournamentId,
        message: tickerMessage,
        event_type: "score",
      });
    }

    setScores((prev) => ({
      ...prev,
      [hole.number]: draftScore,
    }));

    setSaveMessage(
      currentHoleIndex < holes.length - 1
        ? `Moving to Hole ${hole.number + 1}`
        : "Round complete"
    );

    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage("");

      if (currentHoleIndex < holes.length - 1) {
        setCurrentHoleIndex(currentHoleIndex + 1);
      }
    }, 10000);
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

  const getPositionMovement = (
  playerId: string,
  currentIndex: number
) => {
  const previousIndex = previousLeaderboard.indexOf(playerId);

  if (previousIndex === -1) return null;

  if (currentIndex < previousIndex) {
    return "up";
  }

  if (currentIndex > previousIndex) {
    return "down";
  }

  return "same";
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
  useEffect(() => {
  const currentOrder = sortedLeaderboard.map((player) => player.id);

  if (previousLeaderboard.length === 0) {
    setPreviousLeaderboard(currentOrder);
    return;
  }

  setPreviousLeaderboard(currentOrder);
}, [allScores]);

  // =========================
  // END LIVE LEADERBOARD DATA
  // =========================

  // =========================
  // BEGIN VIEW NAVIGATION
  // =========================

  const refreshLeaderboard = async () => {
  await fetchPlayers();
  await fetchAllScores();
  await fetchTickerEvents();

  setLeaderboardUpdatedMessage("Updated just now");

  setTimeout(() => {
    setLeaderboardUpdatedMessage("");
  }, 2000);
};

  const openView = (selectedView: View) => {
    setView(selectedView);
    setMenuOpen(false);
  };

  // =========================
  // END VIEW NAVIGATION
  // =========================

  // =========================
  // BEGIN UI
  // =========================
  const backgroundShade = Math.round(
  36 - (currentHoleIndex / (holes.length - 1)) * 36
);

const dynamicBackground = `rgb(${backgroundShade}, ${backgroundShade}, ${backgroundShade})`;
const currentHoleImage = `/hole-${hole.number}.png`;
  return (
    <div
  className="relative min-h-[100dvh] overflow-hidden p-4 text-white"
  style={{ backgroundColor: dynamicBackground }}
>
  <div
    className="fixed inset-0 bg-cover bg-center opacity-90 blur-[1px]"
    style={{
      backgroundImage: "url('/burn-cart.jpg')",
    }}
  />

  <div className="fixed inset-0 bg-black/20" />
  <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/60" />

  <div className="relative z-10">
      {activeAdminAlert && (
        <div className="animate-admin-alert fixed inset-x-0 top-0 z-[100] bg-red-600 px-6 py-5 text-center text-white shadow-lg">
          <div className="text-xs font-black uppercase tracking-[0.3em]">
            🚨 Admin Alert
          </div>
          <div className="mt-2 text-xl font-black">
            {activeAdminAlert.message.replace("🚨 ADMIN ALERT:", "").trim()}
          </div>
        </div>
      )}

      {saveMessage && (
        <div className="animate-success-alert fixed inset-x-0 top-0 z-[90] bg-green-600 px-6 py-5 text-center text-white shadow-lg">
          <div className="text-xs font-black uppercase tracking-[0.3em]">
            ✅ Score Saved
          </div>
          <div className="mt-2 text-xl font-black">{saveMessage}</div>
        </div>
      )}

      {view !== "join" && view !== "selectPlayer" && (
  <div className="flex items-center justify-between gap-3">
    <button
      onClick={() => openView("scorecard")}
      className="flex min-w-0 items-center gap-2"
    >
      <img src="/ch-logo.png" alt="Clubs & Holes" className="h-9 w-auto" />

      <div className="min-w-0 max-w-[90px] truncate text-left text-xs font-black uppercase tracking-[0.08em] text-white">
        {playerName || "Player"}
      </div>

      <div className="rounded-full bg-[#ff9900] px-3 py-1 text-sm font-black text-black">
        {formatScore(net)}
      </div>

      <div className="rounded-full border border-gray-700 px-3 py-1 text-xs font-black uppercase text-gray-300">
        H{hole.number}
      </div>
    </button>

    <button onClick={() => setMenuOpen(true)} className="text-3xl leading-none">
      ☰
    </button>
  </div>
)}

      {menuOpen && (
        <div className="absolute inset-0 z-50 bg-black/95 p-6">
          <div className="flex items-center justify-between">
            <img src="/ch-logo.png" alt="Clubs & Holes" className="h-12 w-auto" />

            <button onClick={() => setMenuOpen(false)} className="text-3xl">
              ×
            </button>
          </div>

          <div className="mt-10 flex flex-col gap-4">
            {[
              ["Scorecard", "scorecard"],
              ["Leaderboard", "leaderboard"],
              ["Course Info", "courseInfo"],
              ["Tournament Rules", "rules"],
            ].map(([label, target]) => (
              <button
                key={label}
                onClick={() => openView(target as View)}
                className="rounded-xl border border-gray-700 p-4 text-left text-xl font-bold"
              >
                {label}
              </button>
            ))}

            <button
              onClick={resetLocalPlayer}
              className="rounded-xl border border-red-900 p-4 text-left text-xl font-bold text-red-400"
            >
              Change Player
            </button>
          </div>
        </div>
      )}

      {view === "join" && (
        <div className="flex h-screen flex-col items-center justify-center text-center">
          <img src="/ch-logo.png" alt="Clubs & Holes" className="mb-6 h-24 w-auto" />

          <h1 className="text-4xl font-black">Join Tournament</h1>

          <input
            value={tournamentCode}
            onChange={(e) => setTournamentCode(e.target.value.toUpperCase())}
            placeholder="ENTER CODE"
            className="mt-8 w-full max-w-xs rounded-xl bg-gray-900 p-4 text-center text-2xl font-bold uppercase outline-none"
          />

          <button
            onClick={joinTournament}
            className="mt-6 w-full max-w-xs rounded-full bg-white px-6 py-4 font-black text-black"
          >
            ENTER
          </button>
        </div>
      )}

      {view === "selectPlayer" && (
        <div className="mt-10">
          <div className="text-sm uppercase tracking-[0.3em] text-[#ff9900]">
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
            className="mt-6 text-sm text-[#ff9900]"
          >
            Refresh Players
          </button>
        </div>
      )}

      {view === "scorecard" && (
  <>
    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/50">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${((currentHoleIndex + 1) / holes.length) * 100}%`,
          backgroundColor: accentColor,
        }}
      />
    </div>

   <div className="mt-5 rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
  <div>
    <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
  HOLE {hole.number}
</div>

<div className="mt-2 text-xl font-black text-white">
  Sundale Country Club
</div>

<div className="mt-3 text-2xl font-black text-white">
  PAR {hole.par}
</div>

<div className="mt-1 text-sm font-bold uppercase tracking-[0.18em] text-white/70">
  {hole.yards} Yards
</div>
  </div>

  <div className="flex h-32 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
    <img
      src={currentHoleImage}
      alt={`Hole ${hole.number}`}
      className="h-full w-auto object-contain"
    />
  </div>
</div>

      <div className="mt-6 flex flex-col items-center">
  <div className="flex items-center justify-center gap-6">
    <button
      onClick={() => changeDraftScore(draftScore - 1)}
      className={`flex h-16 w-16 items-center justify-center rounded-full border text-4xl font-black transition-all ${
        currentHoleHasScore
          ? "border-white/10 text-white/20"
          : "border-[#ff9900] text-[#ff9900]"
      }`}
    >
      −
    </button>

    <div
      onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
      onTouchEnd={(e) => handleScoreSwipe(e.changedTouches[0].clientY)}
      className={`select-none touch-none text-[7.5rem] font-black leading-none tracking-[-0.08em] transition-colors ${
        currentHoleHasScore ? "text-white/45" : "text-white"
      }`}
    >
      {draftScore}
    </div>

    <button
      onClick={() => changeDraftScore(draftScore + 1)}
      className={`flex h-16 w-16 items-center justify-center rounded-full border text-4xl font-black transition-all ${
        currentHoleHasScore
          ? "border-white/10 text-white/20"
          : "border-[#ff9900] text-[#ff9900]"
      }`}
    >
      +
    </button>
  </div>

  <div
    className={`mt-4 rounded-full border px-5 py-2 text-sm font-black uppercase tracking-[0.2em] ${
      currentHoleHasScore
        ? "border-white/10 bg-white/5 text-white/35"
        : "border-[#ff9900] bg-[#ff9900]/10 text-[#ff9900]"
    }`}
  >
    {getScoreLabel(draftScore, hole.par)}
  </div>

  

        <button
          onClick={enterScore}
          disabled={isSaving}
          className={`mt-7 w-full rounded-full px-8 py-4 text-sm font-black uppercase tracking-[0.18em] shadow-xl transition-all disabled:opacity-50 ${
            scores[hole.number]
              ? "bg-white/10 text-white"
              : "bg-white text-black"
          }`}
        >
          {isSaving
            ? "SAVING..."
            : scores[hole.number]
            ? `EDIT HOLE ${hole.number} SCORE`
            : `ENTER HOLE ${hole.number} SCORE`}
        </button>
      </div>
    </div>

    <div className="mt-4 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-center backdrop-blur-md">
      <div className="animate-ticker-fade text-sm font-bold text-[#ff9900]">
        {latestTickerMessage}
      </div>
    </div>

    <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur-md">
      <button
        onClick={goPrev}
        disabled={currentHoleIndex === 0}
        className="rounded-full border border-white/10 px-4 py-2 text-2xl disabled:opacity-20"
      >
        ←
      </button>

      <button
        onClick={() => openView("leaderboard")}
        className="rounded-full bg-[#ff9900] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
      >
        Leaderboard
      </button>

      <button
        onClick={goNext}
        disabled={currentHoleIndex === holes.length - 1}
        className="rounded-full border border-white/10 px-4 py-2 text-2xl disabled:opacity-20"
      >
        →
      </button>
    </div>
  </>
)}

     {view === "leaderboard" && (
  <div className="mt-8">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Live Standings
        </div>
        <h1 className="mt-1 text-4xl font-black">Leaderboard</h1>
      </div>

      <button
        onClick={refreshLeaderboard}
        className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#ff9900] backdrop-blur-md"
      >
        Refresh
      </button>
    </div>

    {leaderboardUpdatedMessage && (
      <div className="mt-3 text-right text-xs font-bold text-[#ff9900]">
        {leaderboardUpdatedMessage}
      </div>
    )}

    <div className="mt-5 rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-center backdrop-blur-md">
      <div className="animate-ticker-fade text-sm font-bold text-[#ff9900]">
        {latestTickerMessage}
      </div>
    </div>

    <div className="mt-6 space-y-3">
      {sortedLeaderboard.map((player, index) => (
        <div
          key={player.id}
          className={`flex items-center justify-between rounded-[1.5rem] border p-4 shadow-xl backdrop-blur-md ${
            index === 0
              ? "border-[#ff9900] bg-[#ff9900]/90 text-black"
              : "border-white/10 bg-black/55 text-white"
          }`}
        >
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] opacity-70">
              {index === 0 ? "🏆 Belt Leader" : `#${index + 1}`}
            </div>

            <div className="mt-1 text-lg font-black">{player.name}</div>

            <div className="mt-1 text-xs opacity-70">
              Thru {player.thru} · Gross {player.gross || "--"}
            </div>

            <div className="text-xs opacity-70">
              Last:{" "}
              {player.lastHole
                ? `Hole ${player.lastHole} - ${player.lastHoleScore}`
                : "--"}
            </div>
          </div>

          <div className="text-4xl font-black">{formatScore(player.net)}</div>
        </div>
      ))}
    </div>
  </div>
)}

      {view === "courseInfo" && (
        <div className="mt-10">
          <div className="text-sm uppercase tracking-[0.3em] text-[#ff9900]">
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
                className="mt-1 block text-lg font-bold text-[#ff9900]"
              >
                (661) 769-6226
              </a>
            </div>

            <a
              href="https://maps.google.com/?q=Buena+Vista+Golf+Course+Taft+CA"
              target="_blank"
              className="block rounded-full bg-white px-6 py-4 text-center font-black text-black"
            >
              OPEN MAP
            </a>

            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
              <div className="text-sm text-gray-500">Tournament Start</div>
              <div className="mt-1 text-lg font-bold">May 16 · Time TBD</div>
            </div>
          </div>
        </div>
      )}

      {view === "rules" && (
        <div className="mt-10">
          <div className="text-sm uppercase tracking-[0.3em] text-[#ff9900]">
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
    </div>
  );
}