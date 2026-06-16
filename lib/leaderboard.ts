export type Hole = {
  number: number;
  par: number;
  yards?: number;
  image_url?: string;
};

export type Player = {
  id: string;
  name: string;
  profile_image_url?: string | null;
};

export type Team = {
  id: string;
  name: string;
  image_url?: string | null;
};

export type ScoreRow = {
  tournament_player_id?: string | null;
  team_id?: string | null;
  hole_number: number;
  strokes: number;
};

export type LeaderboardEntry = {
  id: string;
  name: string;
  image_url?: string | null;
  profile_image_url?: string | null;
  thru: number;
  gross: number;
  net: number;
  lastHole: number | null;
  lastHoleScore: number | null;
  last6: number;
  last3: number;
  last1: number;
};

export const formatScore = (score: number) => {
  if (score > 0) return `+${score}`;
  if (score === 0) return "E";
  return `${score}`;
};

export const getScoreStyle = (
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

export const getScoreMapForPlayer = (
  scores: ScoreRow[],
  playerId: string
) => {
  const map: Record<number, number> = {};

  scores
    .filter((score) => score.tournament_player_id === playerId)
    .forEach((score) => {
      map[score.hole_number] = score.strokes;
    });

  return map;
};

export const getScoreMapForTeam = (
  scores: ScoreRow[],
  teamId: string
) => {
  const map: Record<number, number> = {};

  scores
    .filter((score) => score.team_id === teamId)
    .forEach((score) => {
      map[score.hole_number] = score.strokes;
    });

  return map;
};

export const getGrossTotal = (
  scoreMap: Record<number, number>,
  holes: Hole[]
) => {
  return holes.reduce(
    (total, h) => total + (scoreMap[h.number] ?? 0),
    0
  );
};

export const getParPlayed = (
  scoreMap: Record<number, number>,
  holes: Hole[]
) => {
  return holes.reduce(
    (total, h) =>
      scoreMap[h.number] !== undefined ? total + h.par : total,
    0
  );
};

export const getLastHole = (scoreMap: Record<number, number>) => {
  const played = Object.keys(scoreMap)
    .map(Number)
    .sort((a, b) => a - b);

  return played.length ? played[played.length - 1] : null;
};

export const getLastNToPar = (
  scoreMap: Record<number, number>,
  holes: Hole[],
  count: number
) => {
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

export const sortLeaderboard = (entries: LeaderboardEntry[]) => {
  return [...entries].sort((a, b) => {
    if (a.net !== b.net) return a.net - b.net;

    // If scores are tied, the team/player farther through the round ranks higher.
    if (a.thru !== b.thru) return b.thru - a.thru;

    if (a.last6 !== b.last6) return a.last6 - b.last6;
    if (a.last3 !== b.last3) return a.last3 - b.last3;
    if (a.last1 !== b.last1) return a.last1 - b.last1;

    return a.name.localeCompare(b.name);
  });
};

export const buildLeaderboard = ({
  formatType,
  players,
  teams,
  scores,
  holes,
}: {
  formatType: string;
  players: Player[];
  teams: Team[];
  scores: ScoreRow[];
  holes: Hole[];
}) => {
  const playerLeaderboard: LeaderboardEntry[] = players.map((player) => {
    const playerScores = getScoreMapForPlayer(scores, player.id);
    const gross = getGrossTotal(playerScores, holes);
    const par = getParPlayed(playerScores, holes);
    const thru = Object.keys(playerScores).length;
    const lastHole = getLastHole(playerScores);

    return {
      id: player.id,
      name: player.name,
      image_url: null,
      profile_image_url: player.profile_image_url || null,
      thru,
      gross,
      net: gross - par,
      lastHole,
      lastHoleScore: lastHole ? playerScores[lastHole] : null,
      last6: getLastNToPar(playerScores, holes, 6),
      last3: getLastNToPar(playerScores, holes, 3),
      last1: getLastNToPar(playerScores, holes, 1),
    };
  });

  const teamLeaderboard: LeaderboardEntry[] = teams.map((team) => {
    const teamScores = getScoreMapForTeam(scores, team.id);
    const gross = getGrossTotal(teamScores, holes);
    const par = getParPlayed(teamScores, holes);
    const thru = Object.keys(teamScores).length;
    const lastHole = getLastHole(teamScores);

    return {
      id: team.id,
      name: team.name,
      image_url: team.image_url || null,
      profile_image_url: null,
      thru,
      gross,
      net: gross - par,
      lastHole,
      lastHoleScore: lastHole ? teamScores[lastHole] : null,
      last6: getLastNToPar(teamScores, holes, 6),
      last3: getLastNToPar(teamScores, holes, 3),
      last1: getLastNToPar(teamScores, holes, 1),
    };
  });

  const leaderboard =
    formatType === "individual" ? playerLeaderboard : teamLeaderboard;

  return sortLeaderboard(
    leaderboard.filter((entry) => entry.thru > 0)
  );
};