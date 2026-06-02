"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// =========================
// BRAND CONSTANTS
// =========================

const accentColor = "#ff9900";

// =========================
// HOLE TYPES / DEFAULTS
// =========================

type Hole = {
  number: number;
  par: number;
  yards: number;
  image_url?: string;
};

const defaultHoles: Hole[] = Array.from({ length: 18 }, (_, index) => ({
  number: index + 1,
  par: 4,
  yards: 0,
  image_url: `/hole-${index + 1}.png`,
}));

// =========================
// VIEW TYPES
// =========================

type View =
  | "join"
  | "selectTeam"
  | "selectPlayer"
  | "scorecard"
  | "leaderboard"
  | "courseInfo"
  | "rules";

// =========================
// DATA TYPES
// =========================

type Player = {
  id: string;
  name: string;
  claimed: boolean;
  profile_image_url?: string;
};

type Team = {
  id: string;
  name: string;
  image_url?: string;
  official_scorer_player_id?: string;
};

type TeamPlayer = {
  id: string;
  team_id: string;
  tournament_player_id: string;
};

type ScoreRow = {
  tournament_player_id?: string | null;
  team_id?: string | null;
  hole_number: number;
  strokes: number;
};

type TickerEvent = {
  id: string;
  message: string;
  event_type: string;
  created_at: string;
};

type ScorecardSponsor = {
  sponsor_id: string;
  placement_label?: string | null;
  priority?: number | null;
  sponsors: {
    name: string;
    image_url?: string | null;
    website_url?: string | null;
  }[];
};







export default function Home() {
  // =========================
  // VIEW / MENU STATE
  // =========================

  const [view, setView] = useState<View>("join");
  const [menuOpen, setMenuOpen] = useState(false);

  // =========================
  // TOURNAMENT STATE
  // =========================

  const [currentTournamentId, setCurrentTournamentId] = useState("");
  const [currentCourseId, setCurrentCourseId] = useState("");
  const [tournamentCode, setTournamentCode] = useState("");
  const [formatType, setFormatType] = useState("individual");
  const [tournamentRules, setTournamentRules] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [scorecardSponsors, setScorecardSponsors] = useState<ScorecardSponsor[]>([]);
  // =========================
  // COURSE DISPLAY STATE
  // =========================

  const [courseName, setCourseName] = useState("Clubs & Holes Championship");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("/burn-cart.jpg");
  const [courseAddress, setCourseAddress] = useState("");
  const [coursePhone, setCoursePhone] = useState("");
  const [courseMapUrl, setCourseMapUrl] = useState("");
  const [holes, setHoles] = useState<Hole[]>(defaultHoles);

  // =========================
  // PLAYER / TEAM STATE
  // =========================

  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);

  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedTeamName, setSelectedTeamName] = useState("");
  const [canScore, setCanScore] = useState(true);

  // =========================
  // SCORING STATE
  // =========================

  const [scores, setScores] = useState<Record<number, number>>({});
  const [allScores, setAllScores] = useState<ScoreRow[]>([]);
  const [previousLeaderboard, setPreviousLeaderboard] = useState<string[]>([]);

  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [draftScore, setDraftScore] = useState(defaultHoles[0].par);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [leaderboardUpdatedMessage, setLeaderboardUpdatedMessage] = useState("");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // =========================
  // TICKER / ALERT STATE
  // =========================

  const [tickerEvents, setTickerEvents] = useState<TickerEvent[]>([]);
  const [tickerIndex, setTickerIndex] = useState(0);

  const [activeAdminAlert, setActiveAdminAlert] =
    useState<TickerEvent | null>(null);
  const [lastAdminAlertId, setLastAdminAlertId] = useState("");


  // =========================
// LEADERBOARD DETAIL STATE
// =========================

const [selectedLeaderboardPlayer, setSelectedLeaderboardPlayer] =
  useState<any | null>(null);







  const hole = holes[currentHoleIndex] || defaultHoles[0];
  const currentHoleHasScore = scores[hole.number] !== undefined;
  const fetchCourseHoles = async (courseId: string) => {
  if (!courseId) {
    setHoles(defaultHoles);
    return;
  }


 

  const { data, error } = await supabase
    .from("course_holes")
    .select("hole_number, par, yards, image_url")
    .eq("course_id", courseId)
    .order("hole_number");

  if (error || !data || data.length === 0) {
    console.error("Error fetching course holes:", error);
    setHoles(defaultHoles);
    return;
  }

  const mappedHoles: Hole[] = data.map((h) => ({
    number: h.hole_number,
    par: h.par,
    yards: h.yards,
    image_url: h.image_url || `/hole-${h.hole_number}.png`,
  }));

  setHoles(mappedHoles);
  setCurrentHoleIndex(0);
};
    const applyTournamentSettings = async (data: any) => {
  const newFormatType = data.format_type || "individual";
  setFormatType(newFormatType);

  const newCourseId = data.course_id || "";
  const newCourseName = data.course_name || "Golf Course";
  const newBackgroundImageUrl = data.background_image_url || "/burn-cart.jpg";
  const newCourseAddress = data.course_address || "";
  const newCoursePhone = data.course_phone || "";
  const newCourseMapUrl = data.course_map_url || "";

  setCourseName(newCourseName);
  setBackgroundImageUrl(newBackgroundImageUrl);
  setCourseAddress(newCourseAddress);
  setCoursePhone(newCoursePhone);
  setCourseMapUrl(newCourseMapUrl);
  setCurrentCourseId(newCourseId);
  setTournamentRules(data.rules || "");
  setTournamentName(data.name || "Tournament");

  if (newCourseId) {
    await fetchCourseHoles(newCourseId);
  } else {
    setHoles(defaultHoles);
  }
};

  const joinTournament = async () => {
    const code = tournamentCode.trim().toUpperCase();

    if (!code) {
      alert("Enter tournament code.");
      return;
    }

    const { data, error } = await supabase
      .from("tournaments")
      .select(
        "id, name, code, course_id, status, format_type, rules, course_name, background_image_url, course_address, course_phone, course_map_url"
        )
      .eq("code", code)
      .single();

    if (error || !data) {
      alert("Tournament not found. Check the code.");
      return;
    }

    if (data.status !== "active") {
  if (data.status === "draft") {
    alert("This tournament is not open yet.");
    return;
  }

  if (data.status === "completed") {
    alert("This tournament has been completed.");
    return;
  }

  if (data.status === "archived") {
    alert("This tournament is archived.");
    return;
  }

  alert("This tournament is not currently active.");
  return;
}

    setCurrentTournamentId(data.id);
    await applyTournamentSettings(data);

    localStorage.setItem("currentTournamentId", data.id);
    localStorage.setItem("tournamentCode", code);

    await fetchPlayers(data.id);
await fetchTeams(data.id);
await fetchTeamPlayers();
await fetchTickerEvents(data.id);
await fetchScorecardSponsors(data.id);

    setView((data.format_type || "individual") === "individual" ? "selectPlayer" : "selectTeam");
  };


// =========================
// TEAM FETCH FUNCTIONS
// =========================

const fetchTeams = async (tournamentId?: string) => {
  const idToUse = tournamentId || currentTournamentId;
  if (!idToUse) return;

  const { data, error } = await supabase
    .from("teams")
    .select("id, name, image_url, official_scorer_player_id")
    .eq("tournament_id", idToUse)
    .order("name");

  if (error) {
    console.error("Error fetching teams:", error);
    return;
  }

  setTeams(data || []);
};

const fetchScorecardSponsors = async (tournamentId?: string) => {
  const idToUse = tournamentId || currentTournamentId;
  if (!idToUse) return;

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("sponsor_placements")
    .select(`
      sponsor_id,
      placement_label,
      priority,
      scope_type,
      tournament_id,
      starts_at,
      ends_at,
      sponsors (
        name,
        image_url,
        website_url,
        is_active
      )
    `)
    .eq("placement_type", "scorecard")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error fetching scorecard sponsors:", error);
    return;
  }

  console.log("ALL SCORECARD PLACEMENTS:", data);

  const eligibleSponsors = (data || []).filter((placement: any) => {
    const sponsor = Array.isArray(placement.sponsors)
      ? placement.sponsors[0]
      : placement.sponsors;

    const scopeMatches =
      placement.scope_type === "global" ||
      placement.tournament_id === idToUse;

    const dateMatches =
      (!placement.starts_at || placement.starts_at <= today) &&
      (!placement.ends_at || placement.ends_at >= today);

    return scopeMatches && dateMatches && sponsor?.is_active;
  });

  console.log("ELIGIBLE SCORECARD SPONSORS:", eligibleSponsors);

  setScorecardSponsors(eligibleSponsors);
};

// =========================
// TEAM SELECTION FLOW
// =========================

const selectTeam = (team: Team) => {
  setSelectedTeamId(team.id);
  setSelectedTeamName(team.name);

  localStorage.setItem("selectedTeamId", team.id);
  localStorage.setItem("selectedTeamName", team.name);

  setView("selectPlayer");
};



const fetchTeamPlayers = async () => {
  const { data, error } = await supabase
    .from("team_players")
    .select("id, team_id, tournament_player_id");

  if (error) {
    console.error("Error fetching team players:", error);
    return;
  }

  setTeamPlayers(data || []);
};



  const fetchPlayers = async (tournamentId?: string) => {
    const idToUse = tournamentId || currentTournamentId;
    if (!idToUse) return;

    const { data, error } = await supabase
      .from("tournament_players")
      .select("id, name, claimed, profile_image_url")
      .eq("tournament_id", idToUse)
      .order("name");

    if (error) {
      console.error("Error fetching players:", error);
      return;
    }

    setPlayers(data || []);
  };

  const fetchAllScores = async (
  tournamentId?: string,
  overrideFormatType?: string
) => {
  const idToUse = tournamentId || currentTournamentId;
  if (!idToUse) return;

  const formatToUse = overrideFormatType || formatType;

  if (formatToUse !== "individual") {
    const { data, error } = await supabase
      .from("scores")
      .select("tournament_player_id, team_id, hole_number, strokes")
      .not("team_id", "is", null);

    if (error) {
      console.error("Error fetching team scores:", error);
      return;
    }

    setAllScores(data || []);
    return;
  }

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
    .select("tournament_player_id, team_id, hole_number, strokes")
    .in("tournament_player_id", playerIds);

  if (error) {
    console.error("Error fetching all scores:", error);
    return;
  }

  setAllScores(data || []);
};

const playersForSelectedTeam =
  selectedTeamId && formatType !== "individual"
    ? players.filter((player) =>
        teamPlayers.some(
          (tp) =>
            tp.team_id === selectedTeamId &&
            tp.tournament_player_id === player.id
        )
      )
    : players;


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

  const fetchTournamentSettings = async (tournamentId: string) => {
    const { data, error } = await supabase
      .from("tournaments")
      .select(
  "name, course_name, background_image_url, course_address, course_phone, course_map_url, course_id, format_type, rules"
)
      .eq("id", tournamentId)
      .single();

    if (error) {
      console.error("Error fetching tournament settings:", error);
      return;
    }

    await applyTournamentSettings(data);
    await fetchAllScores(tournamentId, data.format_type || "individual");
    await fetchTeams(tournamentId);
    await fetchTeamPlayers();
    await fetchScorecardSponsors(tournamentId);
  };

  useEffect(() => {
    const savedTournamentId = localStorage.getItem("currentTournamentId");
    const savedTournamentCode = localStorage.getItem("tournamentCode");
    const savedPlayerId = localStorage.getItem("selectedPlayerId");
    const savedPlayerName = localStorage.getItem("playerName");

    const savedTeamId = localStorage.getItem("selectedTeamId");
    const savedTeamName = localStorage.getItem("selectedTeamName");
    const savedCanScore = localStorage.getItem("canScore");

    if (savedTeamId && savedTeamName) {
        setSelectedTeamId(savedTeamId);
        setSelectedTeamName(savedTeamName);
      }

      if (savedCanScore !== null) {
        setCanScore(savedCanScore === "true");
      }

    if (savedTournamentId) {
  setCurrentTournamentId(savedTournamentId);
  setTournamentCode(savedTournamentCode || "");

  fetchPlayers(savedTournamentId);
  fetchTickerEvents(savedTournamentId);
  fetchTournamentSettings(savedTournamentId);
}

    if (savedPlayerId && savedPlayerName) {
      setSelectedPlayerId(savedPlayerId);
      setPlayerName(savedPlayerName);
      setView("scorecard");
      fetchScoresForPlayer(savedPlayerId);
    }
  }, []);

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
            {
              event: "*",
              schema: "public",
              table: "ticker_events",
              filter: `tournament_id=eq.${currentTournamentId}`,
            },
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

 useEffect(() => {
  const latestAdminAlert = tickerEvents.find(
    (event) => event.event_type === "admin"
  );

  if (!latestAdminAlert) return;
  if (latestAdminAlert.id === lastAdminAlertId) return;

  const acknowledgedAlertId = localStorage.getItem("lastAcknowledgedAlertId");

  if (latestAdminAlert.id === acknowledgedAlertId) {
    setLastAdminAlertId(latestAdminAlert.id);
    return;
  }

  setLastAdminAlertId(latestAdminAlert.id);
  setActiveAdminAlert(latestAdminAlert);
}, [tickerEvents]);

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

    if (formatType !== "individual") {
  const selectedTeam = teams.find(
  (team) => team.id === selectedTeamId
);

const isOfficialScorer =
  selectedTeam?.official_scorer_player_id === data.id;
  console.log("Selected Team:", selectedTeam);
console.log("Official Scorer:", selectedTeam?.official_scorer_player_id);
console.log("Current Player:", data.id);
console.log("Can Score:", isOfficialScorer);

  setCanScore(isOfficialScorer);
  localStorage.setItem("canScore", String(isOfficialScorer));
} else {
  setCanScore(true);
  localStorage.setItem("canScore", "true");
}



    setView("scorecard");

    fetchScoresForPlayer(data.id);
    fetchPlayers();
  };

  const resetLocalPlayer = async () => {
  if (selectedPlayerId) {
    await supabase
      .from("tournament_players")
      .update({
        claimed: false,
        claimed_at: null,
      })
      .eq("id", selectedPlayerId);
  }

  localStorage.removeItem("selectedPlayerId");
  localStorage.removeItem("playerName");
  localStorage.removeItem("selectedTeamId");
  localStorage.removeItem("selectedTeamName");
  localStorage.removeItem("canScore");

  setSelectedPlayerId("");
  setPlayerName("");
  setSelectedTeamId("");
  setSelectedTeamName("");
  setCanScore(true);
  setScores({});
  setCurrentHoleIndex(0);
  setMenuOpen(false);

  setView(formatType === "individual" ? "join" : "selectTeam");
};

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

    const scorePayload =
  formatType === "individual"
    ? {
        tournament_player_id: selectedPlayerId,
        team_id: null,
        hole_number: hole.number,
        strokes: draftScore,
        updated_at: new Date().toISOString(),
      }
    : {
        tournament_player_id: null,
        team_id: selectedTeamId,
        hole_number: hole.number,
        strokes: draftScore,
        updated_at: new Date().toISOString(),
      };

const conflictTarget =
  formatType === "individual"
    ? "tournament_player_id,hole_number"
    : "team_id,hole_number";

const { error } = await supabase.from("scores").upsert(scorePayload, {
  onConflict: conflictTarget,
});



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

  const handleHoleSwipe = (endX: number) => {
    if (touchStartX === null) return;

    const swipeDistance = touchStartX - endX;

    if (Math.abs(swipeDistance) < 50) {
      setTouchStartX(null);
      return;
    }

    if (swipeDistance > 0) {
      goNext();
    } else {
      goPrev();
    }

    setTouchStartX(null);
  };

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


  const getSelectedTeam = () => {
  return teams.find((team) => team.id === selectedTeamId);
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
// LEADERBOARD CALCULATIONS
// =========================

const getTeamScoreMap = (teamId: string) => {
  const map: Record<number, number> = {};

  allScores
    .filter((score) => score.team_id === teamId)
    .forEach((score) => {
      map[score.hole_number] = score.strokes;
    });

  return map;
};

const headerScoreMap =
  formatType === "individual"
    ? scores
    : getTeamScoreMap(selectedTeamId);

    const grossTotal = getGrossTotal(headerScoreMap);
const parPlayed = getParPlayed(headerScoreMap);
const net = grossTotal - parPlayed;

const playerLeaderboard = players.map((player) => {

  const playerScores = getPlayerScoreMap(player.id);
  const gross = getGrossTotal(playerScores);
  const par = getParPlayed(playerScores);
  const thru = Object.keys(playerScores).length;
  const lastHole = getLastHole(playerScores);
  

  return {
  id: player.id,
  name: player.name,
  image_url: null,
  profile_image_url: player.profile_image_url,
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

const teamLeaderboard = teams.map((team) => {
  const teamScores = getTeamScoreMap(team.id);
  const gross = getGrossTotal(teamScores);
  const par = getParPlayed(teamScores);
  const thru = Object.keys(teamScores).length;
  const lastHole = getLastHole(teamScores);

  return {
  id: team.id,
  name: team.name,
  image_url: team.image_url,
  profile_image_url: null,
  thru,
  gross,
  net: gross - par,
  lastHole,
  lastHoleScore: lastHole ? teamScores[lastHole] : null,
  last6: getLastNToPar(teamScores, 6),
  last3: getLastNToPar(teamScores, 3),
  last1: getLastNToPar(teamScores, 1),
};
});

const leaderboard =
  formatType === "individual" ? playerLeaderboard : teamLeaderboard;



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

  const backgroundShade = Math.round(
    36 - (currentHoleIndex / (holes.length - 1)) * 36
  );

   const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};


  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
const selectedTeam = teams.find((t) => t.id === selectedTeamId);

const headerImage =
  formatType !== "individual"
    ? selectedTeam?.image_url || ""
    : selectedPlayer?.profile_image_url || "";

const headerName =
  formatType !== "individual"
    ? selectedTeamName || selectedTeam?.name || "Team"
    : playerName || "Player";

const headerSubName =
  formatType !== "individual" ? playerName || "Player" : "";


  const dynamicBackground = `rgb(${backgroundShade}, ${backgroundShade}, ${backgroundShade})`;
  const currentHoleImage =  hole.image_url || "/default-hole.png";
  const phoneHref = coursePhone ? `tel:${coursePhone.replace(/\D/g, "")}` : "#";
 const activeScorecardSponsor = scorecardSponsors[0];

const activeSponsor = Array.isArray(activeScorecardSponsor?.sponsors)
  ? activeScorecardSponsor?.sponsors[0]
  : activeScorecardSponsor?.sponsors;
  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden p-4 text-white"
      style={{ backgroundColor: dynamicBackground }}
    >
      <div
        className="fixed inset-0 bg-cover bg-center opacity-90 blur-[1px]"
        style={{
          backgroundImage: `url('${backgroundImageUrl}')`,
        }}
      />

      <div className="fixed inset-0 bg-black/20" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-black/10 to-black/60" />

      <div className="relative z-10">
        {activeAdminAlert && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[2rem] border border-red-400/40 bg-red-600 p-6 text-center text-white shadow-2xl">
      <div className="text-xs font-black uppercase tracking-[0.3em]">
        🚨 TOURNAMENT ALERT
      </div>

      <div className="mt-4 text-2xl font-black leading-tight">
        {activeAdminAlert.message
          .replace("🚨 ADMIN ALERT:", "")
          .trim()}
      </div>

      <button
        onClick={() => {

  if (activeAdminAlert) {

    localStorage.setItem("lastAcknowledgedAlertId", activeAdminAlert.id);

  }

  setActiveAdminAlert(null);

}}
        className="mt-6 w-full rounded-full bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-black"
      >
        CLOSE
      </button>
    </div>
  </div>
)}

        {saveMessage && (
  <div className="fixed bottom-6 left-4 right-4 z-[90]">
    <div className="animate-admin-alert rounded-[2rem] border border-green-400/40 bg-green-600/95 p-5 text-center text-white shadow-2xl backdrop-blur-md">
      <div className="text-xs font-black uppercase tracking-[0.3em]">
        ✅ Score Saved
      </div>

      <div className="mt-2 text-xl font-black leading-tight">
        {saveMessage}
      </div>
    </div>
  </div>
)}

        {view !== "join" && view !== "selectTeam" && view !== "selectPlayer" && (
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => openView("scorecard")}
              className="flex min-w-0 items-center gap-2"
            >
              <img src="/ch-logo.png" alt="Clubs & Holes" className="h-9 w-auto" />

              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-950">
  {headerImage ? (
    <img
      src={headerImage}
      alt={headerName}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="text-xs font-black text-[#ff9900]">
      {getInitials(headerName)}
    </div>
  )}
</div>

<div className="min-w-0 max-w-[110px] text-left">
  <div className="truncate text-xs font-black uppercase tracking-[0.08em] text-white">
    {headerName}
  </div>

  {headerSubName && (
    <div className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-white/50">
      {headerSubName}
    </div>
  )}
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


        {view === "selectTeam" && (
  <div className="mt-10">
    <div className="text-sm uppercase tracking-[0.3em] text-[#ff9900]">
      Code: {tournamentCode}
    </div>

    <h1 className="mt-3 text-4xl font-black">Select Your Team</h1>

    <div className="mt-8 space-y-3">
      {teams.map((team) => (
        <button
          key={team.id}
          onClick={() => selectTeam(team)}
          className="w-full rounded-2xl border border-white/10 bg-black/60 p-4 text-left backdrop-blur-md"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-950 p-2">
              {team.image_url ? (
                <img
                  src={team.image_url}
                  alt={team.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-xl font-black text-[#ff9900]">
                  {getInitials(team.name)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="truncate text-xl font-black">
                {team.name}
              </div>

              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/50">

  {teamPlayers

    .filter((tp) => tp.team_id === team.id)

    .map((tp) => {

      const player = players.find(

        (p) => p.id === tp.tournament_player_id

      );

      return player?.name;

    })

    .filter(Boolean)

    .join(" • ") || "No players assigned"}

</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
)}



        {view === "selectPlayer" && (
  <div className="mt-10">
    <div className="text-sm uppercase tracking-[0.3em] text-[#ff9900]">
      Code: {tournamentCode || "PLAY16"}
    </div>

    <h1 className="mt-3 text-4xl font-black">Select Your Name</h1>

    {formatType !== "individual" && (
      <button
        onClick={() => {
          setSelectedTeamId("");
          setSelectedTeamName("");
          localStorage.removeItem("selectedTeamId");
          localStorage.removeItem("selectedTeamName");
          setView("selectTeam");
        }}
        className="mt-5 rounded-full border border-white/10 bg-black/50 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#ff9900]"
      >
        ← Back to Teams
      </button>
    )}

    <div className="mt-8 space-y-3">
      {playersForSelectedTeam.map((p) => (
        <button
          key={p.id}
          onClick={() => selectPlayer(p)}
          disabled={p.claimed}
          className={`w-full rounded-2xl border p-4 text-left ${
            p.claimed
              ? "border-gray-900 bg-gray-950 text-gray-600"
              : "border-gray-800 bg-gray-950 text-white"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-900">
              {p.profile_image_url ? (
                <img
                  src={p.profile_image_url}
                  alt={p.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-lg font-black text-[#ff9900]">
                  {getInitials(p.name)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-xl font-black">{p.name}</div>

              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/50">
                {p.claimed ? "Already Claimed" : "Available"}
              </div>
            </div>
          </div>
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

    <div
      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={(e) => handleHoleSwipe(e.changedTouches[0].clientX)}
      className="mt-5 rounded-[2rem] border border-white/10 bg-black/55 p-5 shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
            HOLE {hole.number}
          </div>

         <div className="mt-2 text-xl font-black text-white">
            {tournamentName}
          </div>

          <div className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/60">
            {courseName || "Golf Course"}
          </div>

          {formatType !== "individual" && selectedTeamName && (
            <div className="mt-2 rounded-full border border-[#ff9900]/30 bg-[#ff9900]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-[#ff9900]">
              {selectedTeamName}
            </div>
          )}

          {formatType !== "individual" && !canScore && (
            <div className="mt-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-white/60">
              View Only
            </div>
          )}

          <div className="mt-3 text-2xl font-black text-white">
            PAR {hole.par}
          </div>

          <div className="mt-1 text-sm font-bold uppercase tracking-[0.18em] text-white/70">
            {hole.yards} Yards
          </div>
        </div>

        <div className="flex h-32 w-32 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/70 p-2">
  {activeSponsor?.image_url ? (
    <a
      href={activeSponsor.website_url || "#"}
      target="_blank"
      rel="noreferrer"
      className="flex h-full w-full flex-col items-center justify-center"
    >
      <div className="mb-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/50">
        {activeScorecardSponsor?.placement_label || "Presented By"}
      </div>

      <img
        src={activeSponsor.image_url}
        alt={activeSponsor.name}
        className="max-h-[88px] w-full object-contain"
      />
    </a>
  ) : (
    <img
      src="/ch-logo.png"
      alt="Clubs & Holes"
      className="h-full w-full object-contain p-2 opacity-80"
    />
  )}
</div>
      </div>

      {canScore ? (
        <div className="mt-6 flex flex-col items-center">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => changeDraftScore(draftScore - 1)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-2xl font-black transition-all ${
                currentHoleHasScore
                  ? "border-white/10 text-white/20"
                  : "border-[#ff9900] text-[#ff9900]"
              }`}
            >
              −
            </button>

            <div
              className={`select-none text-[7.5rem] font-black leading-none tracking-[-0.08em] transition-colors ${
                currentHoleHasScore ? "text-white/45" : "text-white"
              }`}
            >
              {draftScore}
            </div>

            <button
              onClick={() => changeDraftScore(draftScore + 1)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-2xl font-black transition-all ${
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
      ) : (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
            View Only
          </div>

          <div className="mt-2 text-lg font-black">
            Official scorer controls are locked.
          </div>

          <div className="mt-2 text-sm text-white/60">
            You can follow the round, leaderboard, and live ticker.
          </div>
        </div>
      )}
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

        {selectedLeaderboardPlayer && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black p-5 text-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
            Hole By Hole
          </div>

          <div className="mt-1 text-2xl font-black">
            {selectedLeaderboardPlayer.name}
          </div>
        </div>

        <button
          onClick={() => setSelectedLeaderboardPlayer(null)}
          className="text-3xl"
        >
          ×
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
  <div className="flex min-w-max items-end gap-1">
    {holes.map((holeInfo) => {
      const playerScores =
        formatType === "individual"
          ? getPlayerScoreMap(selectedLeaderboardPlayer.id)
          : getTeamScoreMap(selectedLeaderboardPlayer.id);

      const score = playerScores[holeInfo.number];
      const diff = score ? score - holeInfo.par : null;

      const scoreShape =
        diff === null
          ? ""
          : diff <= -2
          ? "border-double border-4 rounded-full"
          : diff === -1
          ? "border rounded-full"
          : diff === 1
          ? "border rounded-none"
          : diff >= 2
          ? "border-double border-4 rounded-none"
          : "";

      return (
        <div key={holeInfo.number} className="w-10 shrink-0 text-center">
          <div className="mb-1 bg-black text-[10px] font-black text-white">
            {holeInfo.number}
          </div>

          <div
            className={`mx-auto flex h-8 w-8 items-center justify-center text-sm font-black ${
              scoreShape
                ? `${scoreShape} border-[#ff9900] text-white`
                : "text-white"
            }`}
          >
            {score ?? "-"}
          </div>
        </div>
      );
    })}
  </div>
</div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
        <div className="text-xs uppercase tracking-[0.18em] text-white/50">
          Total
        </div>

        <div className="mt-1 text-3xl font-black">
          {formatScore(selectedLeaderboardPlayer.net)}
        </div>
      </div>
    </div>
  </div>
)}


        {view === "leaderboard" && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
                  Live Standings
                </div>
                <h1 className="mt-1 text-4xl font-black">Leaderboard</h1>

                <div className="mt-2 text-lg font-black text-white">
                  {tournamentName || "Tournament"}
                </div>

                <div className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/50">
                  {courseName || "Golf Course"}
                </div>
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
  onClick={() => setSelectedLeaderboardPlayer(player)}
  className={`flex cursor-pointer items-center justify-between rounded-[1.5rem] border p-4 shadow-xl backdrop-blur-md ${
                    index === 0
                      ? "border-[#ff9900] bg-[#ff9900]/90 text-black"
                      : "border-white/10 bg-black/55 text-white"
                  }`}
                >
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.18em] opacity-70">
                      {index === 0 ? "🏆 Current Leader" : `#${index + 1}`}
                    </div>

                    <div className="mt-1 flex items-center gap-3">
  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-950">
    {(() => {
  const leaderboardImage =
    player.image_url || player.profile_image_url || "";

  return leaderboardImage ? (
    <img
      src={leaderboardImage}
      alt={player.name}
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="text-sm font-black text-[#ff9900]">
      {getInitials(player.name)}
    </div>
  );
})()}
  </div>

  <div className="min-w-0">
    <div className="truncate text-lg font-black">{player.name}</div>
  </div>
</div>

                    <div className="mt-1 text-xs opacity-70">
                      Thru {player.thru} · Gross {player.gross || "--"}
                    </div>

                    <div className="mt-1 text-xs font-bold uppercase tracking-[0.14em] opacity-60">
                        Tap to view scorecard
                    </div>
                  </div>

                  <div className="text-4xl font-black">
                    {formatScore(player.net)}
                  </div>
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

            <h1 className="mt-3 text-4xl font-black">{courseName}</h1>

            <div className="mt-8 space-y-4 text-gray-300">
              <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                <div className="text-sm text-gray-500">Address</div>
                <div className="mt-1 text-lg font-bold">
                  {courseAddress || "Course address not set"}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
                <div className="text-sm text-gray-500">Phone</div>
                <a
                  href={phoneHref}
                  className="mt-1 block text-lg font-bold text-[#ff9900]"
                >
                  {coursePhone || "Course phone not set"}
                </a>
              </div>

              <a
                href={courseMapUrl || "#"}
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
      Tournament Rules
    </div>

    <h1 className="mt-3 text-4xl font-black">Rules</h1>

    <div className="mt-8 whitespace-pre-line rounded-[2rem] border border-white/10 bg-black/55 p-5 text-lg leading-relaxed text-gray-300 backdrop-blur-md">
      {tournamentRules || "Tournament rules have not been added yet."}
    </div>
  </div>
)}
      </div>
    </div>
  );
}