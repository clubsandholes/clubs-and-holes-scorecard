"use client";
import LeaderboardRow from "@/components/LeaderboardRow";
import ScorecardModal from "@/components/ScorecardModal";
import AdminNav from "../../AdminNav";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";


type Tournament = {
  id: string;
  name: string;
  code: string;
  course_id?: string;
  tournament_date?: string;
  status?: string;
  format_type?: string;
  course_name?: string;
  background_image_url?: string;
  course_address?: string;
  course_phone?: string;
  course_map_url?: string;
  live_video_url?: string;
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

export default function TournamentAdminPage() {

  // =========================
  // ROUTER / PARAMS
  // =========================

  const params = useParams();
  const tournamentId = params.id as string;

  const [allScores, setAllScores] = useState<ScoreRow[]>([]);



// =========================
// LEADERBOARD 
// =========================

const [selectedLeaderboardPlayer, setSelectedLeaderboardPlayer] =
  useState<any | null>(null);


  // =========================
// LIVE CONTROL FUNCTIONS
// =========================

const sendAdminAlert = async () => {
  if (!adminMessage.trim()) {
    alert("Enter an admin alert message.");
    return;
  }

  const { error } = await supabase.from("ticker_events").insert({
    tournament_id: tournamentId,
    message: `🚨 ADMIN ALERT: ${adminMessage.trim()}`,
    event_type: "admin",
  });

  if (error) {
    console.error(error);
    alert("Admin alert failed.");
    return;
  }

  setAdminMessage("");
setAdminAlertModalOpen(false);
showAdminNotice("Admin alert sent.");
};

const [adminAlertModalOpen, setAdminAlertModalOpen] = useState(false);

  // =========================
  // LOADING / UI
  // =========================

  const [loading, setLoading] = useState(true);
  const [adminNotice, setAdminNotice] = useState("");

  // =========================
  // TOURNAMENT STATE
  // =========================

  const [tournament, setTournament] = useState<Tournament | null>(null);

  const [tournamentName, setTournamentName] = useState("");
  const [tournamentCodeValue, setTournamentCodeValue] = useState("");
  const [tournamentDate, setTournamentDate] = useState("");
  const [tournamentStatus, setTournamentStatus] = useState("draft");
  const [formatType, setFormatType] = useState("individual");
  const [tournamentRules, setTournamentRules] = useState("");
  const [liveVideoUrl, setLiveVideoUrl] = useState("");


  const [selectedLeaderboardEntry, setSelectedLeaderboardEntry] = useState<any | null>(null);

  const [selectedScorecard, setSelectedScorecard] = useState<any[]>([]);

  const [editingScore, setEditingScore] = useState<any | null>(null);
const [editingValue, setEditingValue] = useState(0);




  // =========================
  // COURSE STATE
  // =========================

  const [courseName, setCourseName] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [courseAddress, setCourseAddress] = useState("");
  const [coursePhone, setCoursePhone] = useState("");
  const [courseMapUrl, setCourseMapUrl] = useState("");

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  // =========================
  // PLAYER STATE
  // =========================

  const [players, setPlayers] = useState<any[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");

  // =========================
  // TEAM STATE
  // =========================

  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");

  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);


  // =========================
  // SECTION STATE
  // =========================
 const [openSections, setOpenSections] = useState({
  info: true,
  leaderboard: true,
  live: false,
  teams: false,
  players: false,
});

const toggleSection = (section: keyof typeof openSections) => {
  setOpenSections((prev) => ({
    ...prev,
    [section]: !prev[section],
  }));
};

  // =========================
  // LIVE CONTROL STATE
  // =========================

  const [adminMessage, setAdminMessage] = useState("");

  

  // =========================
  // HELPERS
  // =========================

  const showAdminNotice = (message: string) => {
    setAdminNotice(message);

    setTimeout(() => {
      setAdminNotice("");
    }, 2500);
  };

  const isValidTournamentCode = (code: string) => {
    return /^[A-Z0-9]{4,12}$/.test(code);
  };

  const getMaxPlayersPerTeam = () => {
    if (formatType === "2v2") return 2;
    if (formatType === "4v4") return 4;

    return 999;
  };

  // =========================
  // FETCH FUNCTIONS
  // =========================

  const fetchTournament = async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select(`
        id,
        name,
        code,
        rules,
        course_id,
        tournament_date,
        status,
        format_type,
        course_name,
        background_image_url,
        course_address,
        course_phone,
        course_map_url,
        live_video_url
      `)
      .eq("id", tournamentId)
      .single();

    if (error) {
      console.error(error);
      alert("Tournament not found.");
      setLoading(false);
      return;
    }

    setTournament(data);

    setTournamentName(data.name || "");
    setTournamentCodeValue(data.code || "");
    setTournamentDate(data.tournament_date || "");
    setTournamentStatus(data.status || "draft");
    setFormatType(data.format_type || "individual");
    setTournamentRules(data.rules || "");
    setLiveVideoUrl(data.live_video_url || "");

    setSelectedCourseId(data.course_id || "");

    setCourseName(data.course_name || "");
    setBackgroundImageUrl(data.background_image_url || "");
    setCourseAddress(data.course_address || "");
    setCoursePhone(data.course_phone || "");
    setCourseMapUrl(data.course_map_url || "");

    setLoading(false);
  };

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("id, name")
      .order("name");

    setCourses(data || []);
  };

  const fetchPlayers = async () => {
    const { data } = await supabase
      .from("tournament_players")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("name");

    setPlayers(data || []);
  };

  const fetchTeams = async () => {
    const { data } = await supabase
      .from("teams")
      .select("id, name, image_url, official_scorer_player_id")
      .eq("tournament_id", tournamentId)
      .order("name");

    setTeams(data || []);
  };

  const fetchTeamPlayers = async () => {
    const { data } = await supabase
      .from("team_players")
      .select("*");

    setTeamPlayers(data || []);
  };

  const fetchAllScores = async () => {
  const { data, error } = await supabase
    .from("scores")
    .select("tournament_player_id, team_id, hole_number, strokes");

  if (error) {
    console.error("Error fetching scores:", error);
    return;
  }

  setAllScores(data || []);
};

  // =========================
  // EFFECTS
  // =========================

  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
      fetchCourses();
      fetchPlayers();
      fetchTeams();
      fetchTeamPlayers();
      fetchAllScores();
    }
  }, [tournamentId]);

  useEffect(() => {
  if (tournament?.name) {
    document.title = `${tournament.name} | Clubs & Holes`;
  }
}, [tournament]);

  // =========================
  // TOURNAMENT SAVE
  // =========================

  const saveTournamentSettings = async () => {

    const cleanedCode =
      tournamentCodeValue.trim().toUpperCase();

    if (!isValidTournamentCode(cleanedCode)) {
      alert(
        "Tournament code must be 4-12 characters using only letters and numbers."
      );
      return;
    }

    const { data: existingTournament } = await supabase
      .from("tournaments")
      .select("id")
      .eq("code", cleanedCode)
      .neq("id", tournamentId)
      .maybeSingle();

    if (existingTournament) {
      alert("Tournament code already exists.");
      return;
    }

    const { error } = await supabase
      .from("tournaments")
      .update({
        name: tournamentName,
        code: cleanedCode,
        rules: tournamentRules,
        tournament_date: tournamentDate || null,
        status: tournamentStatus,
        format_type: formatType,

        course_id: selectedCourseId || null,
        course_name: courseName,
        background_image_url: backgroundImageUrl,
        course_address: courseAddress,
        course_phone: coursePhone,
        course_map_url: courseMapUrl,
        live_video_url: liveVideoUrl || null
      })
      .eq("id", tournamentId);

    if (error) {
      console.error(error);
      alert("Tournament settings could not be saved.");
      return;
    }

    await fetchTournament();

    showAdminNotice("Tournament settings saved.");
  };


  // =========================
  // COURSE FUNCTIONS
  // =========================

 const handleCourseSelect = async (courseId: string) => {
  setSelectedCourseId(courseId);

  if (!courseId) return;

  const { data, error } = await supabase
    .from("courses")
    .select("name, address, phone, map_url")
    .eq("id", courseId)
    .single();

  if (error || !data) {
    console.error(error);
    alert("Course details could not be loaded.");
    return;
  }

  setCourseName(data.name || "");
  setCourseAddress(data.address || "");
  setCoursePhone(data.phone || "");
  setCourseMapUrl(data.map_url || "");
};
  // =========================
  // PLAYER FUNCTIONS
  // =========================

  const addPlayer = async () => {
    if (!newPlayerName.trim()) return;

    const { error } = await supabase.from("tournament_players").insert({
      tournament_id: tournamentId,
      name: newPlayerName.trim(),
      claimed: false,
    });

    if (error) {
      console.error(error);
      alert("Player could not be added.");
      return;
    }

    setNewPlayerName("");
    fetchPlayers();
    showAdminNotice("Player added.");
  };

  const deletePlayer = async (playerId: string) => {
    const confirmed = confirm("Delete player?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("tournament_players")
      .delete()
      .eq("id", playerId);

    if (error) {
      console.error(error);
      alert("Player could not be deleted.");
      return;
    }

    fetchPlayers();
    showAdminNotice("Player deleted.");
  };

  const unlockSinglePlayer = async (playerId: string) => {
    const { error } = await supabase
      .from("tournament_players")
      .update({
        claimed: false,
        claimed_at: null,
      })
      .eq("id", playerId);

    if (error) {
      console.error(error);
      alert("Player could not be unlocked.");
      return;
    }

    fetchPlayers();
    showAdminNotice("Player unlocked.");
  };

  // =========================
  // TEAM FUNCTIONS
  // =========================

  const addTeam = async () => {
    if (!newTeamName.trim()) return;

    const { error } = await supabase.from("teams").insert({
      tournament_id: tournamentId,
      name: newTeamName.trim(),
    });

    if (error) {
      console.error(error);
      alert("Team could not be added.");
      return;
    }

    setNewTeamName("");
    fetchTeams();
    showAdminNotice("Team added.");
  };

  const deleteTeam = async (teamId: string) => {
    const confirmed = confirm("Delete team?");
    if (!confirmed) return;

    const { error } = await supabase.from("teams").delete().eq("id", teamId);

    if (error) {
      console.error(error);
      alert("Team could not be deleted.");
      return;
    }

    fetchTeams();
    fetchTeamPlayers();
    showAdminNotice("Team deleted.");
  };

  const assignPlayerToTeam = async (teamId: string, playerId: string) => {
    if (!playerId) return;

    const maxPlayers = getMaxPlayersPerTeam();

    const currentTeamCount = teamPlayers.filter(
      (tp) => tp.team_id === teamId
    ).length;

    if (currentTeamCount >= maxPlayers) {
      alert(`This team is already full. Max players: ${maxPlayers}`);
      return;
    }

    const playerAlreadyAssigned = teamPlayers.some(
      (tp) => tp.tournament_player_id === playerId
    );

    if (playerAlreadyAssigned) {
      alert("This player is already assigned to a team.");
      return;
    }

    const { error } = await supabase.from("team_players").insert({
      team_id: teamId,
      tournament_player_id: playerId,
    });

    if (error) {
      console.error(error);
      alert("Player could not be assigned.");
      return;
    }

    fetchTeamPlayers();
    showAdminNotice("Player assigned to team.");
  };

  const removePlayerFromTeam = async (teamPlayerId: string) => {
    const { error } = await supabase
      .from("team_players")
      .delete()
      .eq("id", teamPlayerId);

    if (error) {
      console.error(error);
      alert("Player could not be removed.");
      return;
    }

    fetchTeamPlayers();
    showAdminNotice("Player removed from team.");
  };

  const setOfficialScorer = async (teamId: string, playerId: string) => {
    const { error } = await supabase
      .from("teams")
      .update({
        official_scorer_player_id: playerId,
      })
      .eq("id", teamId);

    if (error) {
      console.error(error);
      alert("Official scorer could not be set.");
      return;
    }

    fetchTeams();
    showAdminNotice("Official scorer updated.");
  };


  // =========================
// TOURNAMENT IMAGE UPLOAD
// =========================


const handleTournamentBackgroundUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  const fileExtension = file.name.split(".").pop() || "jpg";

  const filePath = `tournaments/${tournamentId}/background.${fileExtension}`;

  const { error: uploadError } = await supabase.storage
    .from("scorecard-media")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error(uploadError);
    alert("Tournament background upload failed.");
    return;
  }

  const { data } = supabase.storage
    .from("scorecard-media")
    .getPublicUrl(filePath);

  const publicUrl = data.publicUrl;

  setBackgroundImageUrl(publicUrl);

  showAdminNotice("Tournament background uploaded.");
};

  // =========================
// PLAYER IMAGE UPLOAD
// =========================

const handlePlayerImageUpload = async (
  playerId: string,
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const fileExtension = file.name.split(".").pop() || "jpg";
  const filePath = `players/${playerId}/profile.${fileExtension}`;

  const { error: uploadError } = await supabase.storage
    .from("scorecard-media")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error(uploadError);
    alert("Player image upload failed.");
    return;
  }

  const { data } = supabase.storage
    .from("scorecard-media")
    .getPublicUrl(filePath);

  const publicUrl = data.publicUrl;

  const { error: updateError } = await supabase
    .from("tournament_players")
    .update({
      profile_image_url: publicUrl,
    })
    .eq("id", playerId);

  if (updateError) {
    console.error(updateError);
    alert("Player image could not be saved.");
    return;
  }

  fetchPlayers();
  showAdminNotice("Player image uploaded.");
};

    // =========================
  // LOADING / NOT FOUND STATES
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 text-white">
        Loading tournament...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-black p-6 text-white">
        Tournament not found.
      </div>
    );
  }

  // =========================
// TEAM IMAGE UPLOAD
// =========================

const handleTeamImageUpload = async (
  teamId: string,
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];

  if (!file) return;

  const fileExtension = file.name.split(".").pop() || "jpg";

  const filePath = `teams/${teamId}/logo.${fileExtension}`;

  const { error: uploadError } = await supabase.storage
    .from("scorecard-media")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error(uploadError);
    alert("Team image upload failed.");
    return;
  }

  const { data } = supabase.storage
    .from("scorecard-media")
    .getPublicUrl(filePath);

  const publicUrl = data.publicUrl;

  const { error: updateError } = await supabase
    .from("teams")
    .update({
      image_url: publicUrl,
    })
    .eq("id", teamId);

  if (updateError) {
    console.error(updateError);
    alert("Team image could not be saved.");
    return;
  }

  fetchTeams();

  showAdminNotice("Team image uploaded.");
};
const updateTournamentStatus = async (
  nextStatus: "draft" | "active" | "completed" | "archived"
) => {
  const confirmed = confirm(`Change tournament status to ${nextStatus}?`);
  if (!confirmed) return;

  const { error } = await supabase
    .from("tournaments")
    .update({
      status: nextStatus,
    })
    .eq("id", tournamentId);

  if (error) {
    console.error(error);
    alert("Tournament status could not be updated.");
    return;
  }

  setTournamentStatus(nextStatus);
  await fetchTournament();

  showAdminNotice(`Tournament marked ${nextStatus}.`);
};


const getAdminScoreMap = (id: string) => {
  const map: Record<number, number> = {};

  allScores
    .filter((score) =>
      formatType === "individual"
        ? score.tournament_player_id === id
        : score.team_id === id
    )
    .forEach((score) => {
      map[score.hole_number] = score.strokes;
    });

  return map;
};

const getAdminGrossTotal = (scoreMap: Record<number, number>) => {
  return Object.values(scoreMap).reduce((total, score) => total + score, 0);
};

const getAdminParPlayed = (scoreMap: Record<number, number>) => {
  return Object.keys(scoreMap).reduce((total, holeNumber) => {
    const hole = Number(holeNumber);
    return total + 4; // temporary default par
  }, 0);
};

const adminLeaderboard =
  formatType === "individual"
    ? players.map((player) => {
        const scoreMap = getAdminScoreMap(player.id);
        const thru = Object.keys(scoreMap).length;
        const gross = getAdminGrossTotal(scoreMap);
        const par = getAdminParPlayed(scoreMap);

        return {
          id: player.id,
          name: player.name,
          thru,
          gross,
          net: gross - par,
          submitted: player.scorecard_status === "submitted",
        };
      })
    : teams.map((team) => {
        const scoreMap = getAdminScoreMap(team.id);
        const thru = Object.keys(scoreMap).length;
        const gross = getAdminGrossTotal(scoreMap);
        const par = getAdminParPlayed(scoreMap);

        return {
          id: team.id,
          name: team.name,
          thru,
          gross,
          net: gross - par,
          submitted: false,
        };
      });

const sortedAdminLeaderboard = adminLeaderboard
  .filter((entry) => entry.thru > 0)
  .sort((a, b) => {
    if (a.net !== b.net) return a.net - b.net;

    // If scores are tied, the team/player farther through the round ranks higher.
    if (a.thru !== b.thru) return b.thru - a.thru;

    return a.name.localeCompare(b.name);
  });


  const openScorecard = async (entry: any) => {
  setSelectedLeaderboardEntry(entry);

  const scoreField =
    formatType === "individual"
      ? "tournament_player_id"
      : "team_id";

  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq(scoreField, entry.id)
    .order("hole_number");

  if (error) {
    console.error(error);
    return;
  }

  setSelectedScorecard(data || []);
};

  // =========================
  // UI
  // =========================

  return (




    
  <div className="min-h-screen bg-black p-6 text-white">
    <div className="mx-auto max-w-6xl">
      <AdminNav />

      {adminAlertModalOpen && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[2rem] border border-red-500/40 bg-black p-5 text-white shadow-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-red-400">
            Tournament Alert
          </div>

          <div className="mt-1 text-2xl font-black">
            Send Announcement
          </div>
        </div>

        <button
          onClick={() => setAdminAlertModalOpen(false)}
          className="text-3xl leading-none"
        >
          ×
        </button>
      </div>

      <textarea
        value={adminMessage}
        onChange={(e) => setAdminMessage(e.target.value)}
        placeholder="Type tournament announcement..."
        className="mt-5 min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-lg font-bold text-white outline-none"
      />

      <button
        onClick={sendAdminAlert}
        className="mt-5 w-full rounded-full bg-red-500 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white"
      >
        Send Alert
      </button>
    </div>
  </div>
)}

      {adminNotice && (
        <div className="mb-4 rounded-2xl border border-[#ff9900] bg-[#ff9900]/10 p-4 text-sm font-black uppercase tracking-[0.18em] text-[#ff9900]">
          {adminNotice}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Clubs & Holes Admin
      </div>

      <h1 className="mt-2 text-4xl font-black">{tournament.name}</h1>

      <div className="mt-5 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Tournament Status
      </div>

      <div className="mt-2 text-2xl font-black uppercase">
        {tournamentStatus}
      </div>

      <div className="mt-1 text-sm text-white/50">
        Draft = setup · Active = playable · Completed = historical · Archived = hidden
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      {tournamentStatus === "draft" && (
        <button
          onClick={() => updateTournamentStatus("active")}
          className="rounded-full bg-green-500 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-black"
        >
          Activate
        </button>
      )}

      {tournamentStatus === "active" && (
        <button
          onClick={() => updateTournamentStatus("completed")}
          className="rounded-full bg-[#ff9900] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-black"
        >
          Complete
        </button>
      )}

      {tournamentStatus === "completed" && (
        <button
          onClick={() => updateTournamentStatus("archived")}
          className="rounded-full bg-red-500 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-black"
        >
          Archive
        </button>
      )}

      {tournamentStatus === "archived" && (
        <button
          onClick={() => updateTournamentStatus("completed")}
          className="rounded-full border border-[#ff9900]/30 bg-[#ff9900]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#ff9900]"
        >
          Restore
        </button>
      )}
    </div>
  </div>
</div>

      {/* TOURNAMENT SETTINGS */}
<div className="mt-8 max-w-3xl rounded-[2rem] border border-white/10 bg-gray-950 p-5">
  <button
    onClick={() => toggleSection("info")}
    className="flex w-full items-center justify-between text-left"
  >
    <div>
      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Tournament Info
      </div>

      <h2 className="mt-2 text-2xl font-black">Event Setup</h2>
    </div>

    <div className="text-3xl font-black text-[#ff9900]">
      {openSections.info ? "−" : "+"}
    </div>
  </button>

  {openSections.info && (
    <div className="mt-6 space-y-4">
      <input
        value={tournamentName}
        onChange={(e) => setTournamentName(e.target.value)}
        placeholder="Tournament Name"
        className="w-full rounded-2xl bg-black p-4 text-white outline-none"
      />

      <input
        value={tournamentCodeValue}
        onChange={(e) =>
          setTournamentCodeValue(
            e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
          )
        }
        placeholder="Tournament Code"
        className="w-full rounded-2xl bg-black p-4 text-white outline-none"
      />

      <input
        type="date"
        value={tournamentDate}
        onChange={(e) => setTournamentDate(e.target.value)}
        className="w-full rounded-2xl bg-black p-4 text-white outline-none"
      />

      <select
        value={tournamentStatus}
        onChange={(e) => setTournamentStatus(e.target.value)}
        className="w-full rounded-2xl bg-black p-4 text-white outline-none"
      >
        <option value="draft">Draft</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="archived">Archived</option>
      </select>

      <select
        value={formatType}
        onChange={(e) => setFormatType(e.target.value)}
        className="w-full rounded-2xl bg-black p-4 text-white outline-none"
      >
        <option value="individual">Individual</option>
        <option value="2v2">2v2 Team</option>
        <option value="4v4">4v4 Team</option>
        <option value="custom">Custom</option>
      </select>

      <select
        value={selectedCourseId}
        onChange={(e) => handleCourseSelect(e.target.value)}
        className="w-full rounded-2xl bg-black p-4 text-white outline-none"
      >
        <option value="">Select Course</option>

        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.name}
          </option>
        ))}
      </select>

      <textarea
        value={tournamentRules}
        onChange={(e) => setTournamentRules(e.target.value)}
        placeholder="Tournament Rules"
        className="min-h-40 w-full rounded-2xl bg-black p-4 text-white outline-none"
      />

      <input
        value={liveVideoUrl}
        onChange={(e) => setLiveVideoUrl(e.target.value)}
        placeholder="Live Video URL: YouTube / Twitch / Kick"
        className="w-full rounded-2xl bg-black p-4 text-white outline-none"
      />

      <div className="rounded-2xl border border-white/10 bg-black p-4">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-[#ff9900]">
          Tournament Background
        </div>

        <label className="mt-4 flex cursor-pointer items-center justify-center rounded-full bg-[#ff9900] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black">
          Upload Background

          <input
            type="file"
            accept="image/*"
            onChange={handleTournamentBackgroundUpload}
            className="hidden"
          />
        </label>

        {backgroundImageUrl && (
          <div className="mt-4 overflow-hidden rounded-xl">
            <img
              src={backgroundImageUrl}
              alt="Tournament Background"
              className="h-40 w-full object-cover"
            />
          </div>
        )}
      </div>

      <button
        onClick={saveTournamentSettings}
        className="w-full rounded-full bg-[#ff9900] px-6 py-4 font-black text-black"
      >
        SAVE TOURNAMENT SETTINGS
      </button>
    </div>
  )}
</div>


{/* ADMIN LEADERBOARD */}
<div className="mt-8 max-w-3xl rounded-[2rem] border border-white/10 bg-gray-950 p-5">
  <button
    onClick={() => toggleSection("leaderboard")}
    className="flex w-full items-center justify-between text-left"
  >
    <div>
      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Leaderboard
      </div>

      <h2 className="mt-2 text-2xl font-black">Live Standings</h2>
    </div>

    <div className="text-3xl font-black text-[#ff9900]">
      {openSections.leaderboard ? "−" : "+"}
    </div>
  </button>

  {openSections.leaderboard && (
    <div className="mt-6 space-y-3">
      <button
        onClick={fetchAllScores}
        className="w-full rounded-full border border-[#ff9900]/30 bg-[#ff9900]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#ff9900]"
      >
        Refresh Leaderboard
      </button>

      {sortedAdminLeaderboard.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black p-5 text-center text-white/50">
          No scores entered yet.
        </div>
      ) : (
        sortedAdminLeaderboard.map((entry, index) => (
<LeaderboardRow
  key={entry.id}
  player={entry}
  index={index}
  totalPlayers={sortedAdminLeaderboard.length}
  onClick={() => openScorecard(entry)}
/>
))
      )}
    </div>
  )}
</div>


{/* TEAM MANAGER */}
{formatType !== "individual" && (
  <div className="mt-8 max-w-3xl rounded-[2rem] border border-white/10 bg-gray-950 p-5">
    <button
      onClick={() => toggleSection("teams")}
      className="flex w-full items-center justify-between text-left"
    >
      <div>
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Teams
        </div>

        <h2 className="mt-2 text-2xl font-black">Team Manager</h2>
      </div>

      <div className="text-3xl font-black text-[#ff9900]">
        {openSections.teams ? "−" : "+"}
      </div>
    </button>

    {openSections.teams && (
      <div className="mt-6">
        <div className="flex gap-3">
          <input
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Add team..."
            className="flex-1 rounded-2xl bg-black p-4 text-white outline-none"
          />

          <button
            onClick={addTeam}
            className="rounded-full bg-[#ff9900] px-6 font-black text-black"
          >
            ADD
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-2xl border border-white/10 bg-black p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="truncate text-lg font-black">
                  {team.name}
                </div>

                <button
                  onClick={() => deleteTeam(team.id)}
                  className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-black uppercase text-red-400"
                >
                  Delete
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-gray-950 p-4">
                <label className="flex cursor-pointer items-center justify-center rounded-full bg-[#ff9900] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black">
                  Upload Team Photo

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleTeamImageUpload(team.id, e)}
                    className="hidden"
                  />
                </label>

                {team.image_url && (
                  <div className="mt-4 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-black p-4">
                    <img
                      src={team.image_url}
                      alt={team.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <select
                  defaultValue=""
                  onChange={(e) => assignPlayerToTeam(team.id, e.target.value)}
                  className="w-full rounded-xl bg-gray-950 p-3 text-white outline-none"
                >
                  <option value="">Assign player...</option>

                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>

                <div className="mt-3 space-y-2">
                  {teamPlayers
                    .filter((tp) => tp.team_id === team.id)
                    .map((tp) => {
                      const player = players.find(
                        (p) => p.id === tp.tournament_player_id
                      );

                      return (
                        <div
                          key={tp.id}
                          className="flex items-center justify-between rounded-xl bg-gray-950 p-3"
                        >
                          <div>
                            <div className="font-bold">
                              {player?.name || "Unknown Player"}
                            </div>

                            {team.official_scorer_player_id === player?.id ? (
                              <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff9900]">
                                ⭐ Official Scorer
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  player && setOfficialScorer(team.id, player.id)
                                }
                                className="mt-2 rounded-full border border-[#ff9900]/30 bg-[#ff9900]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff9900]"
                              >
                                Make Official Scorer
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => removePlayerFromTeam(tp.id)}
                            className="text-xs font-black uppercase text-red-400"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}

{editingScore && (
  <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-black p-6 text-white">

      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Edit Score
      </div>

      <div className="mt-2 text-2xl font-black">
        Hole {editingScore.hole_number}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">

        <button
          onClick={() =>
            setEditingValue(Math.max(1, editingValue - 1))
          }
          className="h-12 w-12 rounded-full border border-white/10 text-2xl font-black"
        >
          −
        </button>

        <div className="w-20 text-center text-5xl font-black">
          {editingValue}
        </div>

        <button
          onClick={() =>
            setEditingValue(editingValue + 1)
          }
          className="h-12 w-12 rounded-full border border-white/10 text-2xl font-black"
        >
          +
        </button>

      </div>

      <button
        onClick={async () => {
  const { error } = await supabase
    .from("scores")
    .update({
      strokes: editingValue,
    })
    .eq("id", editingScore.id);

  if (error) {
    console.error(error);
    alert("Score could not be updated.");
    return;
  }

  await fetchAllScores();

  if (selectedLeaderboardEntry) {
    await openScorecard(selectedLeaderboardEntry);
  }

  setEditingScore(null);

  showAdminNotice("Score updated.");
}}
        className="mt-6 w-full rounded-full bg-[#ff9900] px-6 py-4 font-black text-black"
      >
        SAVE
      </button>

      <button
        onClick={() => setEditingScore(null)}
        className="mt-3 w-full rounded-full border border-white/10 px-6 py-4 font-black"
      >
        CANCEL
      </button>

    </div>
  </div>
)}
     
      {/* PLAYER MANAGER */}
<div className="mt-8 max-w-3xl rounded-[2rem] border border-white/10 bg-gray-950 p-5">
  <button
    onClick={() => toggleSection("players")}
    className="flex w-full items-center justify-between text-left"
  >
    <div>
      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Players
      </div>

      <h2 className="mt-2 text-2xl font-black">Tournament Players</h2>
    </div>

    <div className="text-3xl font-black text-[#ff9900]">
      {openSections.players ? "−" : "+"}
    </div>
  </button>

  {openSections.players && (
    <div className="mt-6">
      <div className="flex gap-3">
        <input
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Add player..."
          className="flex-1 rounded-2xl bg-black p-4 text-white outline-none"
        />

        <button
          onClick={addPlayer}
          className="rounded-full bg-[#ff9900] px-6 font-black text-black"
        >
          ADD
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {players.map((player) => (
          <div
            key={player.id}
            className="rounded-2xl border border-white/10 bg-black p-4"
          >
            <div className="flex items-start gap-4">
              {player.profile_image_url && (
                <img
                  src={player.profile_image_url}
                  alt={player.name}
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                />
              )}

              <div className="min-w-0 flex-1">
                <div className="text-lg font-black">{player.name}</div>

                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/50">
                  {player.claimed ? "Claimed" : "Available"}
                </div>

                <label className="mt-4 flex w-fit cursor-pointer items-center justify-center whitespace-nowrap rounded-full border border-[#ff9900]/30 bg-[#ff9900]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff9900]">
                  Upload Player Photo

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePlayerImageUpload(player.id, e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => unlockSinglePlayer(player.id)}
                className="rounded-full border border-white/10 px-4 py-3 text-xs font-black uppercase"
              >
                Unlock
              </button>

              <button
                onClick={() => deletePlayer(player.id)}
                className="rounded-full border border-red-500/30 px-4 py-3 text-xs font-black uppercase text-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</div>

{selectedLeaderboardEntry && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-black p-6 text-white shadow-2xl">

      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
            Scorecard
          </div>

          <div className="mt-1 text-2xl font-black">
            {selectedLeaderboardEntry.name}
          </div>
        </div>

        <button
          onClick={() => setSelectedLeaderboardEntry(null)}
          className="text-3xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="mt-6">
  {selectedScorecard.length === 0 ? (
    <div className="rounded-2xl border border-white/10 bg-gray-950 p-5 text-center text-white/50">
      No scores entered.
    </div>
  ) : (
    <>
      <div className="mb-4 text-center">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
          Out
        </div>
      </div>

      <div className="grid grid-cols-9 gap-2">
        {Array.from({ length: 9 }, (_, i) => {
          const holeNumber = i + 1;

          const score = selectedScorecard.find(
            (s) => s.hole_number === holeNumber
          );

          return (
            <div key={holeNumber} className="text-center">
              <div className="text-xs font-black text-white/40">
                {holeNumber}
              </div>

              <div className="mt-1 rounded-xl border border-white/10 bg-gray-950 py-3 text-lg font-black">
                <button
                  onClick={() => {
                    if (!score) return;

                    setEditingScore(score);
                    setEditingValue(score.strokes);
                  }}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-gray-950 py-3 text-lg font-black transition-all hover:border-[#ff9900]"
                >
                  {score?.strokes ?? "-"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 mb-4 text-center">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
          In
        </div>
      </div>

      <div className="grid grid-cols-9 gap-2">
        {Array.from({ length: 9 }, (_, i) => {
          const holeNumber = i + 10;

          const score = selectedScorecard.find(
            (s) => s.hole_number === holeNumber
          );

          return (
            <div key={holeNumber} className="text-center">
              <div className="text-xs font-black text-white/40">
                {holeNumber}
              </div>

              <div className="mt-1 rounded-xl border border-white/10 bg-gray-950 py-3 text-lg font-black">
                <button
                  onClick={() => {
                    if (!score) return;

                    setEditingScore(score);
                    setEditingValue(score.strokes);
                  }}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-gray-950 py-3 text-lg font-black transition-all hover:border-[#ff9900]"
                >
                  {score?.strokes ?? "-"}
                </button>
              </div>
            </div>

            
          );
        })}
      </div>
      
    </>
  )}
</div>
    </div>
  </div>

  
)}





<button
  onClick={() => setAdminAlertModalOpen(true)}
  className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-4xl font-black leading-none text-white shadow-2xl transition-transform active:scale-95"
>
  +
</button>

    </div>
  </div>

  
);
}