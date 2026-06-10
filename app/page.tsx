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
  | "bunker"
  | "rules";


// =========================
// DATA TYPES
// =========================

type Player = {
  id: string;
  name: string;
  claimed: boolean;
  profile_image_url?: string;
  scorecard_status?: string | null;
  scorecard_submitted_at?: string | null;
};

type Team = {
  id: string;
  name: string;
  image_url?: string;
  official_scorer_player_id?: string;
  scorecard_status?: string | null;
  scorecard_submitted_at?: string | null;
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

type CaddieTemplate = {
  character_name: string;
  character_title: string;
  avatar_url: string;
  category: string;
  message_line_1: string;
  message_line_2: string;
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
  const [leaderboardSponsors, setLeaderboardSponsors] = useState<ScorecardSponsor[]>([]);
  const [joinSponsors, setJoinSponsors] = useState<ScorecardSponsor[]>([]);
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
  const [roundCompleteModalOpen, setRoundCompleteModalOpen] = useState(false);

  

  // =========================
  // TICKER / ALERT STATE
  // =========================

  const [tickerEvents, setTickerEvents] = useState<TickerEvent[]>([]);
  const [tickerIndex, setTickerIndex] = useState(0);

  const [activeAdminAlert, setActiveAdminAlert] =
    useState<TickerEvent | null>(null);
  const [lastAdminAlertId, setLastAdminAlertId] = useState("");



  // =========================
  // Bunker / ALERT STATE
  // =========================

const [bunkerEvents, setBunkerEvents] = useState<TickerEvent[]>([]);
const [bunkerModalOpen, setBunkerModalOpen] = useState(false);
const [bunkerPost, setBunkerPost] = useState("");

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
  //setCurrentHoleIndex(0);
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

await fetchScorecardSponsors(data.id);
await fetchLeaderboardSponsors(data.id);

await fetchPlayers(data.id);
await fetchTeams(data.id);
await fetchTeamPlayers();
await fetchTickerEvents(data.id);
await fetchBunkerEvents(data.id);

setView(
  (data.format_type || "individual") === "individual"
    ? "selectPlayer"
    : "selectTeam"
);
};



// =========================
// Caddie Messages
// =========================

const [typedCaddieText, setTypedCaddieText] = useState("");
const [currentCharacterMessage, setCurrentCharacterMessage] =

  useState<any | null>(null);


const pickBrownBomberLine = (
  pool: { line1: string; line2: string }[],
  seed: number
) => {
  return pool[Math.abs(seed) % pool.length];
};

const getCaddieMessage = () => {
  const brownBomberBase = {
    character: "Brown Bomber",
    title: "Golf Influencer",
    avatar: "/brown-bomber-avatar.png",
  };

  const firstTee = [
    {
      line1: "Alright sweetheart, this ain't foreplay anymore.",
      line2: "Time to see what kind of relationship you got with that driver.",
    },
    {
      line1: "Take a deep breath.",
      line2: "Half these guys are scared. The other half should be.",
    },
    {
      line1: "Swing hard.",
      line2: "If you fall down, we'll call it athletic.",
    },
    {
      line1: "Confidence is sexy.",
      line2: "Right now you're looking like a Craigslist ad.",
    },
    {
      line1: "Let's find out if we're Tiger Woods today",
      line2: "or just some idiot with expensive hobbies.",
    },
  ];

  const birdie = [
    {
      line1: "WOOOOOO!",
      line2: "Somebody call the clubhouse. Daddy's getting hot!",
    },
    {
      line1: "That shot was so dirty",
      line2: "I need to clear my browser history.",
    },
    {
      line1: "That's grown men",
      line2: "updating the leaderboard with tears in their eyes.",
    },
    {
      line1: "Birdie, baby!",
      line2: "Strut a little. You earned some swagger.",
    },
    {
      line1: "The Brown Bomber has entered the chat",
      line2: "and chose violence.",
    },
  ];

  const par = [
    {
      line1: "Par.",
      line2: "Like kissing your cousin. Technically it works.",
    },
    {
      line1: "Boring golf wins tournaments.",
      line2: "Unfortunately it also gets zero women.",
    },
    {
      line1: "That's a grown-man par.",
      line2: "Ugly enough to survive.",
    },
    {
      line1: "You didn't gain anything,",
      line2: "but you didn't light anything on fire either.",
    },
    {
      line1: "Par is like cargo shorts.",
      line2: "Not exciting, but surprisingly effective.",
    },
  ];

  const bogey = [
    {
      line1: "Alright, one bogey.",
      line2: "Nobody's building a documentary about it.",
    },
    {
      line1: "That hole got a little handsy.",
      line2: "Don't let it happen again.",
    },
    {
      line1: "Shake it off.",
      line2: "We've all done stupid things.",
    },
    {
      line1: "Bogey ain't the problem.",
      line2: "Acting like a victim afterward is.",
    },
    {
      line1: "That hole charged you a toll.",
      line2: "Pay it and keep driving.",
    },
  ];

  const doubleBogey = [
    {
      line1: "Double bogey?",
      line2: "Damn. Did you play golf or fight a bear?",
    },
    {
      line1: "I've seen drunk uncles at weddings",
      line2: "with a better recovery plan than that.",
    },
    {
      line1: "That scorecard just looked at me",
      line2: "and said, 'You seeing this crap?'",
    },
    {
      line1: "You took a perfectly innocent hole",
      line2: "and turned it into a felony.",
    },
    {
      line1: "Well...",
      line2: "at least nobody died.",
    },
  ];

  const tripleBogey = [
    {
      line1: "Triple?!",
      line2: "Sweet baby Jesus riding a golf cart.",
    },
    {
      line1: "That hole beat you so bad",
      line2: "it took your lunch money on the way out.",
    },
    {
      line1: "We're not discussing what happened.",
      line2: "That hole is under federal investigation.",
    },
    {
      line1: "Walk directly to the next tee",
      line2: "and pretend none of us saw that.",
    },
    {
      line1: "That wasn't golf.",
      line2: "That was performance art.",
    },
  ];

  const par3 = [
    {
      line1: "One swing. One chance.",
      line2: "One chance to look better than you are.",
    },
    {
      line1: "Don't hit it in the water.",
      line2: "The fish don't need another Pro V1.",
    },
    {
      line1: "Middle of the green.",
      line2: "We ain't smart enough for hero shots today.",
    },
    {
      line1: "This hole is short enough to make you cocky",
      line2: "and dangerous enough to punish it.",
    },
    {
      line1: "Trust the club.",
      line2: "Right now it has a better track record than you.",
    },
  ];

  const par5 = [
    {
      line1: "Par 5, baby.",
      line2: "Time to separate lions from salad people.",
    },
    {
      line1: "Big dog coming out.",
      line2: "Hide your wives and your scorecards.",
    },
    {
      line1: "Can we reach it? Absolutely.",
      line2: "Should we? That's quitter talk.",
    },
    {
      line1: "I don't know where this ball's going.",
      line2: "But it's leaving here angry.",
    },
    {
      line1: "Today's forecast calls for bombs",
      line2: "with bad decisions.",
    },
  ];

  const randoms = [
    {
      line1: "Confidence isn't a skill.",
      line2: "It's a decision.",
    },
    {
      line1: "You miss 100% of the shots",
      line2: "you baby.",
    },
    {
      line1: "That swing had more commitment",
      line2: "than most marriages.",
    },
    {
      line1: "Hit it like",
      line2: "you're deleting evidence.",
    },
    {
      line1: "The ball doesn't care",
      line2: "about your feelings.",
    },
    {
      line1: "Grip it",
      line2: "and let destiny sort it out.",
    },
    {
      line1: "Hero shot or stupid shot?",
      line2: "Depends if it works.",
    },
    {
      line1: "You're not talented enough",
      line2: "to get mad.",
    },
    {
      line1: "Trust the swing,",
      line2: "not the idiot in your head.",
    },
    {
      line1: "Golf is simple.",
      line2: "Hit ball. Find ball. Lie. Repeat.",
    },
  ];

  const playedHoleNumbers = Object.keys(scores)
    .map(Number)
    .sort((a, b) => a - b);

  const lastHoleNumber = playedHoleNumbers[playedHoleNumbers.length - 1];
  const lastHoleInfo = holes.find((h) => h.number === lastHoleNumber);
  const lastScore =
    lastHoleNumber !== undefined ? scores[lastHoleNumber] : undefined;

  const seed =
    currentHoleIndex +
    playedHoleNumbers.length +
    draftScore +
    hole.number;

  let selectedPool = randoms;

  if (!lastScore || !lastHoleInfo) {
    selectedPool = firstTee;
  } else {
    const lastDiff = lastScore - lastHoleInfo.par;

    if (lastDiff <= -3) selectedPool = tripleBogey;
    else if (lastDiff === 2) selectedPool = doubleBogey;
    else if (lastDiff === 1) selectedPool = bogey;
    else if (lastDiff === 0) selectedPool = par;
    else if (lastDiff <= -1) selectedPool = birdie;
    else if (hole.par === 3) selectedPool = par3;
    else if (hole.par === 5) selectedPool = par5;
  }

  const selectedMessage = pickBrownBomberLine(selectedPool, seed);

  return {
    ...brownBomberBase,
    ...selectedMessage,
  };
};



// =========================
// End of Caddie Messages
// =========================



// =========================
// TEAM FETCH FUNCTIONS
// =========================

const fetchTeams = async (tournamentId?: string) => {
  const idToUse = tournamentId || currentTournamentId;
  if (!idToUse) return;

  const { data, error } = await supabase
    .from("teams")
    .select("id, name, image_url, official_scorer_player_id, scorecard_status, scorecard_submitted_at")
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

  hole_number,

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





const fetchLeaderboardSponsors = async (tournamentId?: string) => {
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

  hole_number,

  starts_at,

  ends_at,

  sponsors (

    name,

    image_url,

    website_url,

    is_active

  )

`)
    .eq("placement_type", "leaderboard")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error fetching leaderboard sponsors:", error);
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

  console.log("ELIGIBLE LEADERBOARD SPONSORS:", eligibleSponsors);

  setJoinSponsors(eligibleSponsors);
};




const fetchJoinSponsors = async (tournamentId?: string) => {
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

  hole_number,

  starts_at,

  ends_at,

  sponsors (

    name,

    image_url,

    website_url,

    is_active

  )

`)
    .eq("placement_type", "join")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error fetching leaderboard sponsors:", error);
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

  console.log("ELIGIBLE LEADERBOARD SPONSORS:", eligibleSponsors);

  setLeaderboardSponsors(eligibleSponsors);
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
      .select("id, name, claimed, profile_image_url, scorecard_status, scorecard_submitted_at")
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
    return scoreMap;
  };

  const allHolesScored = holes.every(
  (h) => scores[h.number] !== undefined
  );

  const fetchScoresForTeam = async (teamId: string) => {
  const { data, error } = await supabase
    .from("scores")
    .select("hole_number, strokes")
    .eq("team_id", teamId);

  if (error) {
    console.error("Error fetching team scores:", error);
    return;
  }

  const scoreMap: Record<number, number> = {};

  (data || []).forEach((score) => {
    scoreMap[score.hole_number] = score.strokes;
  });

  setScores(scoreMap);
  return scoreMap;
};

  const fetchTickerEvents = async (tournamentId?: string) => {
    const idToUse = tournamentId || currentTournamentId;
    if (!idToUse) return;
const twentyMinutesAgo = new Date(
  Date.now() - 20 * 60 * 1000
).toISOString();

const { data, error } = await supabase
  .from("ticker_events")
  .select("id, message, event_type, created_at")
  .eq("tournament_id", idToUse)
  .gte("created_at", twentyMinutesAgo)
  .order("created_at", { ascending: false })
  .limit(10);

    if (error) {
      console.error("Error fetching ticker events:", error);
      return;
    }

    setTickerEvents(data || []);
  };


  const fetchBunkerEvents = async (tournamentId?: string) => {
  const idToUse = tournamentId || currentTournamentId;
  if (!idToUse) return;

  const { data, error } = await supabase
    .from("ticker_events")
    .select("id, message, event_type, created_at")
    .eq("tournament_id", idToUse)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching bunker events:", error);
    return;
  }

  setBunkerEvents(data || []);
};


const submitBunkerPost = async () => {
  const cleanPost = bunkerPost.trim();

  if (!cleanPost) return;

  if (cleanPost.length > 140) {
    alert("Keep it under 140 characters.");
    return;
  }

  const author =
    formatType === "individual"
      ? playerName
      : `${selectedTeamName} | ${playerName}`;

  const message = `🎙️ ${author}: ${cleanPost}`;

  const { error } = await supabase.from("ticker_events").insert({
    tournament_id: currentTournamentId,
    message,
    event_type: "bunker_post",
  });

  if (error) {
    console.error("Error posting to bunker:", error);
    alert("Post did not save.");
    return;
  }

  setBunkerPost("");
  setBunkerModalOpen(false);
  await fetchBunkerEvents(currentTournamentId);
  await fetchTickerEvents(currentTournamentId);
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
    await fetchLeaderboardSponsors(tournamentId);
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
  fetchBunkerEvents(savedTournamentId);
  fetchTournamentSettings(savedTournamentId);
}

    if (savedPlayerId && savedPlayerName) {
  setSelectedPlayerId(savedPlayerId);
  setPlayerName(savedPlayerName);
  setView("scorecard");

  if (savedTeamId) {
  fetchScoresForTeam(savedTeamId).then((scoreMap) => {
    if (scoreMap) {
      setCurrentHoleIndex(getResumeHoleIndex(scoreMap));
    }
  });
} else {
  fetchScoresForPlayer(savedPlayerId).then((scoreMap) => {
    if (scoreMap) {
      setCurrentHoleIndex(getResumeHoleIndex(scoreMap));
    }
  });
}
  }
  }, []);

  const caddieMessage =
  currentCharacterMessage || getCaddieMessage();


useEffect(() => {
  const message =
  currentCharacterMessage || getCaddieMessage();

const text = `${message.line1} ${message.line2}`;

  setTypedCaddieText("");

  let index = 0;

  const interval = setInterval(() => {
    index += 1;
    setTypedCaddieText(text.slice(0, index));

    if (index >= text.length) {
      clearInterval(interval);
    }
  }, 60);

  return () => clearInterval(interval);
}, [currentCharacterMessage]

);




  useEffect(() => {
    if (!currentTournamentId) return;

    const channel = supabase
      .channel(`live-tournament-${currentTournamentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores" },
        async () => {
          await fetchAllScores(currentTournamentId);

          if (formatType !== "individual" && selectedTeamId) {
  await fetchScoresForTeam(selectedTeamId);
} else if (selectedPlayerId) {
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
          await fetchBunkerEvents(currentTournamentId);
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
  }, [currentTournamentId, selectedPlayerId, selectedTeamId, formatType]);

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
    ? scoreTickerEvents[tickerIndex]?.message ||
      "🏌️ Everybody starts even. That ends now."
    : "🏌️ Everybody starts even. That ends now.";

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

   let loadedScores: Record<number, number> | undefined;

if (formatType !== "individual") {
  loadedScores = await fetchScoresForTeam(selectedTeamId);
} else {
  loadedScores = await fetchScoresForPlayer(data.id);
}

if (loadedScores) {
  setCurrentHoleIndex(getResumeHoleIndex(loadedScores));
}

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

  setView("join");
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
    //alert("ENTER SCORE IS RUNNING");

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

const leaderboardBefore = getLeaderboardSnapshot(allScores);    
const { error } = await supabase.from("scores").upsert(scorePayload, {
  onConflict: conflictTarget,
});



    if (error) {
      console.error("Error saving score:", error);
      alert("Score did not save. Try again.");
      setIsSaving(false);
      return;
    }
const getCaddieCategoryFromScore = (strokes: number, par: number) => {
  const diff = strokes - par;

  if (diff <= -3) return "triple_bogey";
  if (diff === 2) return "double_bogey";
  if (diff === 1) return "bogey";
  if (diff === 0) return "par";
  if (diff <= -1) return "birdie";

  return "random";
};

const caddieCategory = getCaddieCategoryFromScore(draftScore, hole.par);
const databaseCaddieMessage = await fetchCaddieTemplate(caddieCategory);

setCurrentCharacterMessage(
  databaseCaddieMessage || getCaddieMessage()
);

 const scoreDiff = draftScore - hole.par;
let tickerMessage = "";

const tickerName =
  formatType === "individual"
    ? playerName
    : selectedTeamName || selectedTeam?.name || "Team";

let category = "progress";
let eventType = "hole_complete";

if (scoreDiff === -1) {
  category = "score";
  eventType = "birdie";
}

if (scoreDiff === -2) {
  category = "score";
  eventType = "eagle";
}

if (scoreDiff === 2) {
  category = "score";
  eventType = "double_bogey";
}

if (scoreDiff >= 3) {
  category = "score";
  eventType = "triple_plus";
}

const template = await getFeedTemplate(category, eventType);

if (template) {
  tickerMessage = applyFeedTemplate(template, {
    name: tickerName,
    hole: hole.number,
    score: formatScore(scoreDiff),
  });
}


  console.log("ABOUT TO INSERT TICKER:", {
  currentTournamentId,
  tickerMessage,
});



if (currentTournamentId && tickerMessage) {
  const { data: tickerInsertData, error: tickerInsertError } = await supabase
    .from("ticker_events")
    .insert({
      tournament_id: currentTournamentId,
      message: tickerMessage,
      event_type: category,
    })
    .select();

  console.log("TICKER INSERT RESULT:", {
    tickerInsertData,
    tickerInsertError,
  });

  await fetchTickerEvents(currentTournamentId);
}

const freshScoreRows = await fetchFreshScoreRowsForCurrentTournament();
const leaderboardAfter = getLeaderboardSnapshot(freshScoreRows);

const scorerId =
  formatType === "individual" ? selectedPlayerId : selectedTeamId;

const beforeScorer = leaderboardBefore.find((item) => item.id === scorerId);
const afterScorer = leaderboardAfter.find((item) => item.id === scorerId);

const beforeLast = leaderboardBefore[leaderboardBefore.length - 1];
const afterLast = leaderboardAfter[leaderboardAfter.length - 1];

if (beforeScorer && afterScorer) {
  const wasLast = beforeLast?.id === scorerId;
  const isLast = afterLast?.id === scorerId;

  if (beforeScorer.position > 1 && afterScorer.position === 1) {
    await createLeaderboardStoryEvent("took_lead", {
      name: afterScorer.name,
    });
  } else if (wasLast && !isLast && afterLast) {
    await createLeaderboardStoryEvent("escaped_last_place", {
      escaped_name: afterScorer.name,
      new_last_place_name: afterLast.name,
    });
  } else if (!wasLast && isLast) {
    await createLeaderboardStoryEvent("last_place", {
      name: afterScorer.name,
    });
  } else if (afterScorer.position < beforeScorer.position) {
    await createLeaderboardStoryEvent("moved_up", {
      name: afterScorer.name,
    });
  } else if (afterScorer.position > beforeScorer.position) {
    await createLeaderboardStoryEvent("moved_down", {
      name: afterScorer.name,
    });
  }
}

setAllScores(freshScoreRows);
await fetchTickerEvents(currentTournamentId);


if (hole.number === 9) {
  const frontNineTemplate = await getFeedTemplate(
    "progress",
    "front_nine_complete"
  );

  if (frontNineTemplate) {
    const frontNineMessage = applyFeedTemplate(frontNineTemplate, {
      name: tickerName,
    });

    await supabase.from("ticker_events").insert({
      tournament_id: currentTournamentId,
      message: frontNineMessage,
      event_type: "progress",
    });
  }
}

    setScores((prev) => ({
      ...prev,
      [hole.number]: draftScore,
    }));

    if (formatType !== "individual") {
  await fetchScoresForTeam(selectedTeamId);
} else {
  await fetchScoresForPlayer(selectedPlayerId);
}

await fetchAllScores(currentTournamentId);

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
    return;
  }

  setRoundCompleteModalOpen(true);
}, 10000);
  };


  const submitScorecard = async () => {
  if (formatType !== "individual" && !selectedTeamId) return;

  const confirmed = confirm(
    "Submit final scorecard? The Tournament Director can reopen it if corrections are needed."
  );

  if (!confirmed) return;

  if (formatType === "individual") {
    const { error } = await supabase
      .from("tournament_players")
      .update({
        scorecard_status: "submitted",
        scorecard_submitted_at: new Date().toISOString(),
      })
      .eq("id", selectedPlayerId);

    if (error) {
      console.error("Error submitting player scorecard:", error);
      alert("Scorecard could not be submitted.");
      return;
    }

    await fetchPlayers(currentTournamentId);
  } else {
    const { error } = await supabase
      .from("teams")
      .update({
        scorecard_status: "submitted",
        scorecard_submitted_at: new Date().toISOString(),
      })
      .eq("id", selectedTeamId);

    if (error) {
      console.error("Error submitting team scorecard:", error);
      alert("Scorecard could not be submitted.");
      return;
    }

    await fetchTeams(currentTournamentId);
  }

  const clubhouseName =
    formatType === "individual"
      ? playerName
      : selectedTeamName || selectedTeam?.name || "Team";

  const clubhouseTemplate = await getFeedTemplate(
    "clubhouse",
    "entered_clubhouse"
  );

  if (clubhouseTemplate) {
    const clubhouseMessage = applyFeedTemplate(clubhouseTemplate, {
      name: clubhouseName,
      score: formatScore(net),
    });

    await supabase.from("ticker_events").insert({
      tournament_id: currentTournamentId,
      message: clubhouseMessage,
      event_type: "clubhouse",
    });

    await fetchTickerEvents(currentTournamentId);
  }

  setRoundCompleteModalOpen(false);
  setView("leaderboard");
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

const selectedTeamData = teams.find((team) => team.id === selectedTeamId);

const selectedPlayerData = players.find((player) => player.id === selectedPlayerId);

const scorecardSubmitted =
  formatType === "individual"
    ? selectedPlayerData?.scorecard_status === "submitted"
    : selectedTeamData?.scorecard_status === "submitted";

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

const getScoreStyle = (
  score: number | undefined,
  par: number
) => {
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
const getResumeHoleIndex = (scoreMap: Record<number, number>) => {

  const firstUnscoredHoleIndex = holes.findIndex(

    (h) => scoreMap[h.number] === undefined

  );

  if (firstUnscoredHoleIndex === -1) {

    return holes.length - 1;

  }

  return firstUnscoredHoleIndex;

};


const fetchCaddieTemplate = async (category: string) => {
  const { data, error } = await supabase
    .from("caddie_templates")
    .select(
      "character_name, character_title, avatar_url, category, message_line_1, message_line_2, is_global, tournament_id, priority"
    )
    .eq("category", category)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching caddie template:", error);
    return null;
  }

  const matchingTemplates = (data || []).filter((template: any) => {
    return (
      template.tournament_id === currentTournamentId ||
      template.is_global === true
    );
  });

  if (matchingTemplates.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * matchingTemplates.length);
  const selectedTemplate = matchingTemplates[randomIndex];

  return {
    character: selectedTemplate.character_name,
    title: selectedTemplate.character_title,
    avatar: selectedTemplate.avatar_url,
    line1: selectedTemplate.message_line_1,
    line2: selectedTemplate.message_line_2,
  };
};

const getCaddieCategory = () => {
  if (formatType !== "individual" && !canScore) return "view_only";

  const playedHoleNumbers = Object.keys(scores)
    .map(Number)
    .sort((a, b) => a - b);

  const lastHoleNumber = playedHoleNumbers[playedHoleNumbers.length - 1];
  const lastHoleInfo = holes.find((h) => h.number === lastHoleNumber);
  const lastScore =
    lastHoleNumber !== undefined ? scores[lastHoleNumber] : undefined;

  if (!lastScore || !lastHoleInfo) return "first_tee";

  const lastDiff = lastScore - lastHoleInfo.par;

  if (lastDiff <= -3) return "triple_bogey";
  if (lastDiff === 2) return "double_bogey";
  if (lastDiff === 1) return "bogey";
  if (lastDiff === 0) return "par";
  if (lastDiff <= -1) return "birdie";

  if (hole.par === 3) return "par_3";
  if (hole.par === 5) return "par_5";

  return "random";
};

const getFeedTemplate = async (category: string, eventType: string) => {
  const { data, error } = await supabase
    .from("feed_templates")
    .select("message_template, is_global, tournament_id, priority")
    .eq("category", category)
    .eq("event_type", eventType)
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching feed template:", error);
    return null;
  }

  const matchingTemplates = (data || []).filter((template: any) => {
    return (
      template.tournament_id === currentTournamentId ||
      template.is_global === true
    );
  });

  if (matchingTemplates.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * matchingTemplates.length);
  const matchingTemplate = matchingTemplates[randomIndex];

  console.log("RANDOM FEED TEMPLATE:", {
    category,
    eventType,
    count: matchingTemplates.length,
    randomIndex,
    selected: matchingTemplate.message_template,
  });

  return matchingTemplate.message_template;
};



const applyFeedTemplate = (
  template: string,
  values: Record<string, string | number>
) => {
  let message = template;

  Object.entries(values).forEach(([key, value]) => {
    message = message.replaceAll(`{${key}}`, String(value));
  });

  return message;

  
};

const getLeaderboardSnapshot = (scoreRows: ScoreRow[]) => {
  const competitors =
    formatType === "individual"
      ? players.map((player) => ({
          id: player.id,
          name: player.name,
          scores: scoreRows.filter(
            (score) => score.tournament_player_id === player.id
          ),
        }))
      : teams.map((team) => ({
          id: team.id,
          name: team.name,
          scores: scoreRows.filter((score) => score.team_id === team.id),
        }));

  return competitors
    .map((competitor) => {
      const scoreMap: Record<number, number> = {};

      competitor.scores.forEach((score) => {
        scoreMap[score.hole_number] = score.strokes;
      });

      const gross = getGrossTotal(scoreMap);
      const par = getParPlayed(scoreMap);

      return {
        id: competitor.id,
        name: competitor.name,
        net: gross - par,
        last6: getLastNToPar(scoreMap, 6),
        last3: getLastNToPar(scoreMap, 3),
        last1: getLastNToPar(scoreMap, 1),
      };
    })
    .sort((a, b) => {
      if (a.net !== b.net) return a.net - b.net;
      if (a.last6 !== b.last6) return a.last6 - b.last6;
      if (a.last3 !== b.last3) return a.last3 - b.last3;
      if (a.last1 !== b.last1) return a.last1 - b.last1;
      return a.name.localeCompare(b.name);
    })
    .map((item, index) => ({
      ...item,
      position: index + 1,
    }));
};

const fetchFreshScoreRowsForCurrentTournament = async () => {
  if (formatType === "individual") {
    const playerIds = players.map((player) => player.id);

    if (playerIds.length === 0) return [];

    const { data, error } = await supabase
      .from("scores")
      .select("tournament_player_id, team_id, hole_number, strokes")
      .in("tournament_player_id", playerIds);

    if (error) {
      console.error("Error fetching fresh individual scores:", error);
      return [];
    }

    return data || [];
  }

  const teamIds = teams.map((team) => team.id);

  if (teamIds.length === 0) return [];

  const { data, error } = await supabase
    .from("scores")
    .select("tournament_player_id, team_id, hole_number, strokes")
    .in("team_id", teamIds);

  if (error) {
    console.error("Error fetching fresh team scores:", error);
    return [];
  }

  return data || [];
};

const createLeaderboardStoryEvent = async (
  eventType: string,
  values: Record<string, string | number>
) => {
  const template = await getFeedTemplate("leaderboard", eventType);

  if (!template || !currentTournamentId) return;

  const message = applyFeedTemplate(template, values);

  await supabase.from("ticker_events").insert({
    tournament_id: currentTournamentId,
    message,
    event_type: "leaderboard",
  });
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

const headerScoreMap = scores;

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


  const currentPosition =
  sortedLeaderboard.findIndex(
    (entry) =>
      entry.id ===
      (formatType === "individual"
        ? selectedPlayerId
        : selectedTeamId)
  ) + 1;

const leaderScore =
  sortedLeaderboard.length > 0
    ? sortedLeaderboard[0].net
    : 0;

const strokesBehind =
  currentPosition > 1
    ? net - leaderScore
    : 0;

const betterThanLastPlace =
  Math.max(
    0,
    sortedLeaderboard.length - currentPosition
  );


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
 const currentHoleNumber = hole.number;

const holeSponsor = scorecardSponsors.find(
  (placement: any) =>
    placement.tournament_id === currentTournamentId &&
    placement.hole_number === currentHoleNumber
);

const tournamentSponsors = scorecardSponsors.filter(
  (placement: any) =>
    placement.scope_type === "tournament" &&
    placement.tournament_id === currentTournamentId &&
    !placement.hole_number
);

const globalSponsors = scorecardSponsors.filter(
  (placement: any) =>
    placement.scope_type === "global" &&
    !placement.hole_number
);

const rotatingTournamentSponsor =
  tournamentSponsors.length > 0
    ? tournamentSponsors[currentHoleIndex % tournamentSponsors.length]
    : null;

const rotatingGlobalSponsor =
  globalSponsors.length > 0
    ? globalSponsors[currentHoleIndex % globalSponsors.length]
    : null;

const activeScorecardSponsor =
  holeSponsor || rotatingTournamentSponsor || rotatingGlobalSponsor || null;

  const activeLeaderboardSponsor =
  leaderboardSponsors.length > 0
    ? leaderboardSponsors[0]
    : null;

const activeLeaderboardSponsorData = Array.isArray(
  activeLeaderboardSponsor?.sponsors
)
  ? activeLeaderboardSponsor?.sponsors[0]
  : activeLeaderboardSponsor?.sponsors;

const activeSponsor = Array.isArray(activeScorecardSponsor?.sponsors)
  ? activeScorecardSponsor?.sponsors[0]
  : activeScorecardSponsor?.sponsors;



  console.log("Current Tournament:", currentTournamentId);
console.log("Hole Sponsor:", holeSponsor);
console.log("Tournament Sponsors:", tournamentSponsors);
console.log("Global Sponsors:", globalSponsors);

const activeTournamentSponsor =
  tournamentSponsors[0] ||
  globalSponsors[0] ||
  null;

const activeTournamentSponsorData = Array.isArray(
  activeTournamentSponsor?.sponsors
)
  ? activeTournamentSponsor?.sponsors[0]
  : activeTournamentSponsor?.sponsors;

const activeTournamentSponsorImage =
  activeTournamentSponsorData?.image_url || "";

console.log("Leaderboard Sponsor:", activeLeaderboardSponsorData);
console.log("Tournament Sponsor:", activeTournamentSponsorData);



  return (
    <div
      className="relative min-h-[100dvh] overflow-y-auto p-4 text-white"
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
          {activeTournamentSponsorData && (
  <a
    href={activeTournamentSponsorData.website_url || "#"}
    target="_blank"
    rel="noreferrer"
    className="mt-5 flex items-center justify-center gap-3 rounded-2xl border border-white/20 bg-black/20 p-3"
  >
    <img
      src={activeTournamentSponsorData.image_url || "/ch-logo.png"}
      alt={activeTournamentSponsorData.name}
      className="h-14 w-14 rounded-xl object-contain"
    />

    <div className="text-left">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
        {activeTournamentSponsor?.placement_label || "Presented By"}
      </div>

      <div className="mt-1 text-sm font-black text-white">
        {activeTournamentSponsorData.name}
      </div>
    </div>
  </a>
)}
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


{bunkerModalOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black p-5 text-white shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
            The Bunker
          </div>

          <div className="mt-1 text-2xl font-black">
            SAY IT WITH YOUR CHEST!
          </div>
        </div>

        <button
          onClick={() => setBunkerModalOpen(false)}
          className="text-3xl leading-none"
        >
          ×
        </button>
      </div>

      <textarea
        value={bunkerPost}
        onChange={(e) => setBunkerPost(e.target.value.slice(0, 140))}
        placeholder="The Bunker is listening..."
        className="mt-5 h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-lg font-bold text-white outline-none"
      />

      <div className="mt-2 text-right text-xs font-black uppercase tracking-[0.14em] text-white/40">
        {140 - bunkerPost.length} characters left
      </div>

      {activeTournamentSponsorData && (
        <a
          href={activeTournamentSponsorData.website_url || "#"}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
        >
          <img
            src={activeTournamentSponsorData.image_url || "/ch-logo.png"}
            alt={activeTournamentSponsorData.name}
            className="h-12 w-12 rounded-xl object-contain"
          />

          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
              Powered By
            </div>

            <div className="mt-1 text-sm font-black text-white">
              {activeTournamentSponsorData.name}
            </div>
          </div>
        </a>
      )}

      <button
        onClick={submitBunkerPost}
        className="mt-5 w-full rounded-full bg-[#ff9900] px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-black"
      >
        Post To The Bunker
      </button>
    </div>
  </div>
)}



        {roundCompleteModalOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[2rem] border border-[#ff9900]/40 bg-black p-6 text-center text-white shadow-2xl">
      <div className="text-xs font-black uppercase tracking-[0.3em] text-[#ff9900]">
        🏁 Round Complete
      </div>

      <div className="mt-4 text-2xl font-black leading-tight">
        You have entered all 18 holes.
      </div>

      <div className="mt-3 text-sm text-white/60">
        Review your scorecard or submit it as complete.
      </div>

      <button
        onClick={async () => {
          if (formatType !== "individual") {
            await fetchScoresForTeam(selectedTeamId);
          }

          setRoundCompleteModalOpen(false);
        }}
        className="mt-6 w-full rounded-full border border-white/10 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white"
      >
        Review Scorecard
      </button>

      <button
        onClick={submitScorecard}
        className="mt-3 w-full rounded-full bg-[#ff9900] px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-black"
      >
        Submit Scorecard
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
          <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between gap-3 bg-black/50 px-4 py-4 backdrop-blur-md">
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
        <div className="h-20" />
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
                ["THE SCORE", "scorecard"],
                ["THE TURN", "leaderboard"],
                ["THE COURSE", "courseInfo"],
                ["THE RULES", "rules"],
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
                CHANGE PLAYER
              </button>
            </div>
          </div>
        )}

        {view === "join" && (
          <div className="flex h-screen flex-col items-center justify-center text-center">
            <img src="/clubs-n-holes.png" alt="Clubs & Holes" className="mb-6 h-24 w-auto" />

            <h1 className="text-4xl font-black">Join Tournament</h1>
            {activeTournamentSponsorData && (
  <a
    href={activeTournamentSponsorData.website_url || "#"}
    target="_blank"
    rel="noreferrer"
    className="mt-6 flex flex-col items-center"
  >
    <div className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-white/50">
      {activeTournamentSponsor?.placement_label || "Presented By"}
    </div>

    {activeTournamentSponsorData.image_url ? (
      <img
        src={activeTournamentSponsorData.image_url}
        alt={activeTournamentSponsorData.name}
        className="h-28 w-28 rounded-2xl object-contain"
      />
    ) : (
      <div className="text-xl font-black text-[#ff9900]">
        {activeTournamentSponsorData.name}
      </div>
    )}
  </a>
)}
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
    
          {activeTournamentSponsorData && (
  <a
    href={activeTournamentSponsorData.website_url || "#"}
    target="_blank"
    rel="noreferrer"
    className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-3"
  >
    <img
      src={activeTournamentSponsorData.image_url || "/ch-logo.png"}
      alt={activeTournamentSponsorData.name}
      className="h-14 w-14 rounded-xl object-contain"
    />

    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
        {activeTournamentSponsor?.placement_label || "Presented By"}
      </div>

      <div className="mt-1 text-sm font-black text-white">
        {activeTournamentSponsorData.name}
      </div>
    </div>
  </a>
)}
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
          {activeTournamentSponsorData && (
  <a
    href={activeTournamentSponsorData.website_url || "#"}
    target="_blank"
    rel="noreferrer"
    className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-3"
  >
    <img
      src={activeTournamentSponsorData.image_url || "/ch-logo.png"}
      alt={activeTournamentSponsorData.name}
      className="h-14 w-14 rounded-xl object-contain"
    />

    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
        {activeTournamentSponsor?.placement_label || "Presented By"}
      </div>

      <div className="mt-1 text-sm font-black text-white">
        {activeTournamentSponsorData.name}
      </div>
    </div>
  </a>
)}
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


{/* =========================

    scorecard SECTION Begin

========================= */}

    {view === "scorecard" && (
  <div className="pb-32">
    
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

      {canScore && !scorecardSubmitted ? (
        <div className="mt-6 flex flex-col items-center">
          <div className="mb-2 text-center text-lg font-black uppercase tracking-[0.25em] text-[#ff9900]">
              HOLE {hole.number}
            </div>
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

          <div className="mt-7 flex w-full items-center gap-3">
  <button
    onClick={goPrev}
    disabled={currentHoleIndex === 0}
    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/45 text-2xl font-black text-white disabled:opacity-20"
  >
    ←
  </button>

  <button
    onClick={enterScore}
    disabled={isSaving}
    className={`flex-1 rounded-full px-5 py-4 text-sm font-black uppercase tracking-[0.16em] shadow-xl transition-all disabled:opacity-50 ${
      scores[hole.number]
        ? "bg-white/10 text-white"
        : "bg-white text-black"
    }`}
  >
    {isSaving
      ? "SAVING..."
      : scores[hole.number]
      ? `EDIT SCORE`
      : `ENTER SCORE`}
  </button>

  <button
    onClick={goNext}
    disabled={currentHoleIndex === holes.length - 1}
    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/45 text-2xl font-black text-white disabled:opacity-20"
  >
    →
  </button>
</div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
              {scorecardSubmitted ? "Scorecard Submitted" : "View Only"}
            </div>

            <div className="mt-2 text-lg font-black">
              {scorecardSubmitted
                ? "Your final scorecard has been submitted."
                : "Official scorer controls are locked."}
            </div>

            <div className="mt-2 text-sm text-white/60">
              {scorecardSubmitted
                ? "Waiting for tournament results."
                : "You can follow the round, leaderboard, and live ticker."}
            </div>
          </div>
      )}
    </div>
      {allHolesScored && !scorecardSubmitted && (
  <button
    onClick={() => setRoundCompleteModalOpen(true)}
    className="mt-4 w-full rounded-full bg-[#ff9900] px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-black shadow-xl"
  >
    Finish Scorecard
  </button>
)}
   
      
    

  

{/* =========================
    BROWN BOMBER SECTION START
========================= */}

<div className="mt-4 rounded-2xl border border-white/10 bg-black/55 px-4 py-4 backdrop-blur-md">
  <div className="flex items-center gap-3">
    <img
      src="/brown-bomber-avatar.png"
      alt="Brown Bomber"
      className="h-12 w-12 rounded-full border border-[#ff9900]/30 object-cover"
    />

    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ff9900]">
        {caddieMessage.character}
      </div>

      <div className="mt-1 text-sm font-black uppercase tracking-[0.16em] text-white/45">
        {caddieMessage.title}
      </div>
    </div>
  </div>

  <div className="mt-3 text-base font-black leading-snug text-white">
    {typedCaddieText}
    <span className="animate-pulse text-[#ff9900]">|</span>
  </div>
</div>

{/* =========================
    BROWN BOMBER SECTION END
========================= */}

    
  </div>
)}
{/* =========================

    scorecard SECTION End

========================= */}

       {selectedLeaderboardPlayer && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black p-5 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
            Scorecard
          </div>

          <div className="mt-1 text-2xl font-black">
            {selectedLeaderboardPlayer.name}
          </div>
        </div>

        <button
          onClick={() => setSelectedLeaderboardPlayer(null)}
          className="text-3xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        {(() => {
          const playerScores =
            formatType === "individual"
              ? getPlayerScoreMap(selectedLeaderboardPlayer.id)
              : getTeamScoreMap(selectedLeaderboardPlayer.id);

          const frontHoles = holes.slice(0, 9);
          const backHoles = holes.slice(9, 18);

          const frontPar = frontHoles.reduce((t, h) => t + h.par, 0);
          const backPar = backHoles.reduce((t, h) => t + h.par, 0);
          const totalPar = frontPar + backPar;

          const frontScore = frontHoles.reduce(
            (t, h) => t + (playerScores[h.number] ?? 0),
            0
          );

          const backScore = backHoles.reduce(
            (t, h) => t + (playerScores[h.number] ?? 0),
            0
          );

          const totalScore = frontScore + backScore;

          const frontToPar = frontScore - frontPar;
          const backToPar = backScore - backPar;
          const totalToPar = totalScore - totalPar;

          const holeCellClass = "flex h-11 w-12 shrink-0 items-center justify-center border-r border-white/10 bg-gray-800 text-sm font-black text-white/60";

          const parCellClass = "flex h-11 w-12 shrink-0 items-center justify-center border-r border-white/10 bg-gray-700 text-sm font-black text-white/80";

          const scoreCellClass = "flex h-11 w-12 shrink-0 items-center justify-center border-r border-white/10 bg-black text-sm font-black text-white";

          const labelClass = "sticky left-0 z-10 flex h-11 w-20 shrink-0 items-center justify-start border-r border-white/20 bg-black px-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#ff9900]";

          const totalClass = "flex h-11 w-12 shrink-0 flex-col items-center justify-center border-r border-white/10 bg-gray-900 text-xs font-black text-[#ff9900]";

          const scoreTotalClass =
  "flex h-11 w-12 shrink-0 flex-col items-center justify-center border-r border-white/10 bg-gray-900 text-[11px] font-black leading-tight text-[#ff9900]";
          
          return (
            <div className="min-w-max overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="flex">
                <div className={labelClass}>Hole</div>

                {frontHoles.map((h) => (
                  <div key={`hole-front-${h.number}`} className={holeCellClass}>
                    {h.number}
                  </div>
                ))}

                <div className={totalClass}>OUT</div>

                {backHoles.map((h) => (
                  <div key={`hole-back-${h.number}`} className={holeCellClass}>
                    {h.number}
                  </div>
                ))}

                <div className={totalClass}>IN</div>
                <div className={totalClass}>TOT</div>
              </div>

              <div className="flex border-t border-white/10">
                <div className={labelClass}>Par</div>

                {frontHoles.map((h) => (
                  <div key={`par-front-${h.number}`} className={parCellClass}>
                    {h.par}
                  </div>
                ))}

                <div className={totalClass}>{frontPar}</div>

                {backHoles.map((h) => (
                  <div key={`par-back-${h.number}`} className={parCellClass}>
                    {h.par}
                  </div>
                ))}

                <div className={totalClass}>{backPar}</div>
                <div className={totalClass}>{totalPar}</div>
              </div>

              <div className="flex border-t border-white/10">
                <div className={labelClass}>Score</div>

                {frontHoles.map((h) => (
                  <div key={`score-front-${h.number}`} className={scoreCellClass}>
  {(() => {
    const score = playerScores[h.number];
    const style = getScoreStyle(score, h.par);

    return score ? (
      <div
        className={`flex items-center justify-center text-sm font-black ${style}`}
      >
        {score}
      </div>
    ) : (
      "-"
    );
  })()}
</div>
                ))}

                <div className={scoreTotalClass}>
                  <div>{frontScore || "-"}</div>
                  {frontScore ? (
                    <div className="text-[9px] text-white/60">
                      {formatScore(frontToPar)}
                    </div>
                  ) : null}
                </div>

                {backHoles.map((h) => (
                  <div key={`score-back-${h.number}`} className={scoreCellClass}>
  {(() => {
    const score = playerScores[h.number];
    const style = getScoreStyle(score, h.par);

    return score ? (
      <div
        className={`flex items-center justify-center text-sm font-black ${style}`}
      >
        {score}
      </div>
    ) : (
      "-"
    );
  })()}
</div>
                ))}

                <div className={scoreTotalClass}>
                  <div>{backScore || "-"}</div>
                  {backScore ? (
                    <div className="text-[9px] text-white/60">
                      {formatScore(backToPar)}
                    </div>
                  ) : null}
                </div>

                <div className={scoreTotalClass}>
                  <div>{totalScore || "-"}</div>
                  {totalScore ? (
                    <div className="text-[9px] text-white/60">
                      {formatScore(totalToPar)}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
        {activeTournamentSponsorData ? (
          <a
            href={activeTournamentSponsorData.website_url || "#"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
          >
            <img
              src={activeTournamentSponsorData.image_url || "/ch-logo.png"}
              alt={activeTournamentSponsorData.name}
              className="h-12 w-12 rounded-xl object-contain"
            />

            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                Powered By
              </div>

              <div className="mt-1 truncate text-sm font-black text-white">
                {activeTournamentSponsorData.name}
              </div>
            </div>
          </a>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3" />
        )}

        <div className="flex min-w-[110px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
            Total
          </div>

          <div className="mt-1 text-3xl font-black text-[#ff9900]">
            {formatScore(selectedLeaderboardPlayer.net)}
          </div>
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
                <h1 className="mt-1 text-4xl font-black">The Turn</h1>
                {activeTournamentSponsorData && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
                    {activeTournamentSponsor?.placement_label || "Presented By"}
                  </div>

                  {activeTournamentSponsorData.image_url ? (
                    <img
                      src={activeTournamentSponsorData.image_url}
                      alt={activeTournamentSponsorData.name}
                      className="h-8 w-auto object-contain"
                    />
                  ) : (
                    <div className="text-sm font-black text-[#ff9900]">
                      {activeTournamentSponsorData.name}
                    </div>
                  )}
                </div>
                )}
                <div className="mt-2 text-lg font-black text-white">
                  {tournamentName || "Tournament"}
                </div>

                <div className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/50">
                  {courseName || "Golf Course"}
                </div>
              </div>

              {activeTournamentSponsorData?.website_url ? (
  <a
    href={activeTournamentSponsorData.website_url}
    target="_blank"
    rel="noreferrer"
    className="flex items-center justify-center"
  >
    {activeTournamentSponsorData.image_url ? (
      <img
        src={activeTournamentSponsorData.image_url}
        alt={activeTournamentSponsorData.name}
        className="h-24 w-24 rounded-xl object-contain"
      />
    ) : (
      <div className="text-sm font-black text-[#ff9900]">
        {activeTournamentSponsorData.name}
      </div>
    )}
  </a>
) : null}
            </div>

            {leaderboardUpdatedMessage && (
              <div className="mt-3 text-right text-xs font-bold text-[#ff9900]">
                {leaderboardUpdatedMessage}
              </div>
            )}

            <div className="sticky top-2 z-40 mt-5 rounded-2xl border border-white/10 bg-black/85 px-4 py-3 text-center shadow-xl backdrop-blur-md">
              <div className="animate-ticker-fade text-sm font-bold text-[#ff9900]">
                {latestTickerMessage}
              </div>
            </div>

            <div className="mt-6 space-y-3 pb-32">
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
                      {index === 0
                        ? "🏆 Current Leader"
                        : index === sortedLeaderboard.length - 1
                        ? "🗑️ Last Place"
                        : `#${index + 1}`}
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
              {activeTournamentSponsorData && (
                  <a
                    href={activeTournamentSponsorData.website_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-3"
                  >
                    <img
                      src={activeTournamentSponsorData.image_url || "/ch-logo.png"}
                      alt={activeTournamentSponsorData.name}
                      className="h-14 w-14 rounded-xl object-contain"
                    />

                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                        {activeTournamentSponsor?.placement_label || "Presented By"}
                      </div>

                      <div className="mt-1 text-sm font-black text-white">
                        {activeTournamentSponsorData.name}
                      </div>
                    </div>
                  </a>
                )}
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

              
            </div>
          </div>
        )}


{view === "bunker" && (
  <div className="mt-8 pb-32">
    <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
      The Story of the Day
    </div>

    <h1 className="mt-1 text-4xl font-black">The Bunker</h1>

    {activeTournamentSponsorData && (
      <a
        href={activeTournamentSponsorData.website_url || "#"}
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-3"
      >
        <img
          src={activeTournamentSponsorData.image_url || "/ch-logo.png"}
          alt={activeTournamentSponsorData.name}
          className="h-14 w-14 rounded-xl object-contain"
        />

        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
            {activeTournamentSponsor?.placement_label || "Presented By"}
          </div>

          <div className="mt-1 text-sm font-black text-white">
            {activeTournamentSponsorData.name}
          </div>
        </div>
      </a>
    )}

    <div className="mt-6 space-y-3">
      {bunkerEvents.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/55 p-5 text-center text-white/60">
          Nothing in The Bunker yet.
        </div>
      ) : (
        bunkerEvents.map((event) => {
          const isAlert = event.event_type === "admin_alert";
          const isPlayerPost = event.event_type === "bunker_post";

          const accentClass = isAlert
            ? "border-l-red-500"
            : isPlayerPost
            ? "border-l-green-500"
            : "border-l-[#ff9900]";

          const label = isAlert
            ? "🚨 Tournament Alert"
            : isPlayerPost
            ? "🎙️ Player Post"
            : "🔥 Story Event";

          return (
            <div
              key={event.id}
              className={`rounded-2xl border border-white/10 border-l-4 ${accentClass} bg-black/55 p-4 backdrop-blur-md`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                  {label}
                </div>

                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
                  {new Date(event.created_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div className="mt-2 text-sm font-bold leading-snug text-white">
                {event.message}
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
)}


{selectedPlayerId &&
  !["join", "selectTeam", "selectPlayer"].includes(view) && (
    <button
      onClick={() => setBunkerModalOpen(true)}
      className="fixed bottom-24 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[#ff9900] text-4xl font-black leading-none text-black shadow-2xl transition-transform active:scale-95"
    >
      +
    </button>
)}



{view === "rules" && (
  <div className="mt-10">
    <div className="text-sm uppercase tracking-[0.3em] text-[#ff9900]">
      Tournament Rules
    </div>

    <h1 className="mt-3 text-4xl font-black">Rules</h1>
    {activeTournamentSponsorData && (
  <a
    href={activeTournamentSponsorData.website_url || "#"}
    target="_blank"
    rel="noreferrer"
    className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-3"
  >
    <img
      src={activeTournamentSponsorData.image_url || "/ch-logo.png"}
      alt={activeTournamentSponsorData.name}
      className="h-14 w-14 rounded-xl object-contain"
    />

    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
        {activeTournamentSponsor?.placement_label || "Presented By"}
      </div>

      <div className="mt-1 text-sm font-black text-white">
        {activeTournamentSponsorData.name}
      </div>
    </div>
  </a>
)}
    <div className="mt-8 whitespace-pre-line rounded-[2rem] border border-white/10 bg-black/55 p-5 text-lg leading-relaxed text-gray-300 backdrop-blur-md">
      {tournamentRules || "Tournament rules have not been added yet."}
    </div>
  </div>
)}
{selectedPlayerId &&

  view !== "join" &&

  view !== "selectTeam" &&

  view !== "selectPlayer" && (
<div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 backdrop-blur-xl">
  <div className="mx-auto flex max-w-md items-center justify-around py-3">

    <button
      onClick={() => openView("scorecard")}
      className={`flex flex-col items-center ${
        view === "scorecard"
          ? "text-[#ff9900]"
          : "text-white/50"
      }`}
    >
      <div className="text-xl">🏌️</div>
      <div className="text-[11px] font-black uppercase tracking-[0.12em]">
        The Score
      </div>
    </button>

    <button
      onClick={() => openView("leaderboard")}
      className={`flex flex-col items-center ${
        view === "leaderboard"
          ? "text-[#ff9900]"
          : "text-white/50"
      }`}
    >
      <div className="text-xl">🔥</div>
      <div className="text-[11px] font-black uppercase tracking-[0.12em]">
        The Turn
      </div>
    </button>

    <button
      onClick={() => openView("bunker")}
      className={`flex flex-col items-center ${
        view === "bunker" ? "text-[#ff9900]" : "text-white/50"
      }`}
    >
      <div className="text-xl">🍻</div>
      <div className="text-[11px] font-black uppercase tracking-[0.12em]">
        The Bunker
      </div>
    </button>

  </div>
</div>
)}
      </div>
    </div>
  );
}