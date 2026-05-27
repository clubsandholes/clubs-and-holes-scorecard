"use client";

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

export default function TournamentAdminPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [loading, setLoading] = useState(true);

  const [tournament, setTournament] = useState<Tournament | null>(null);

  const [tournamentName, setTournamentName] = useState("");
  const [tournamentCodeValue, setTournamentCodeValue] = useState("");
  const [tournamentDate, setTournamentDate] = useState("");
  const [tournamentStatus, setTournamentStatus] = useState("draft");
  const [formatType, setFormatType] = useState("individual");

  const [courseName, setCourseName] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [courseAddress, setCourseAddress] = useState("");
  const [coursePhone, setCoursePhone] = useState("");
  const [courseMapUrl, setCourseMapUrl] = useState("");

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [players, setPlayers] = useState<any[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");

  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");

  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);

  const [adminMessage, setAdminMessage] = useState("");

  const [adminNotice, setAdminNotice] = useState("");

  const fetchTournament = async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select(
        "id, name, code, course_id, tournament_date, status, format_type, course_name, background_image_url, course_address, course_phone, course_map_url"
      )
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

    setSelectedCourseId(data.course_id || "");

    setCourseName(data.course_name || "");
    setBackgroundImageUrl(data.background_image_url || "");
    setCourseAddress(data.course_address || "");
    setCoursePhone(data.course_phone || "");
    setCourseMapUrl(data.course_map_url || "");

    setLoading(false);
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, name")
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setCourses(data || []);
  };

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from("tournament_players")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setPlayers(data || []);
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, image_url, official_scorer_player_id")
      .eq("tournament_id", tournamentId)
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setTeams(data || []);
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
};

  const fetchTeamPlayers = async () => {
    const { data, error } = await supabase
      .from("team_players")
      .select("id, team_id, tournament_player_id");

    if (error) {
      console.error(error);
      return;
    }

    setTeamPlayers(data || []);
  };

  const getMaxPlayersPerTeam = () => {
  if (formatType === "2v2") return 2;
  if (formatType === "4v4") return 4;
  return 999;
  };

  const showAdminNotice = (message: string) => {
  setAdminNotice(message);

  setTimeout(() => {
    setAdminNotice("");
  }, 2500);
};

  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
      fetchCourses();
      fetchPlayers();
      fetchTeams();
      fetchTeamPlayers();
    }
  }, [tournamentId]);

  const isValidTournamentCode = (code: string) => {
    return /^[A-Z0-9]{4,12}$/.test(code);
  };

  const saveTournamentSettings = async () => {
    const cleanedCode = tournamentCodeValue.trim().toUpperCase();

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
        tournament_date: tournamentDate || null,
        status: tournamentStatus,
        format_type: formatType,

        course_id: selectedCourseId || null,
        course_name: courseName,
        background_image_url: backgroundImageUrl,
        course_address: courseAddress,
        course_phone: coursePhone,
        course_map_url: courseMapUrl,
      })
      .eq("id", tournamentId);

    if (error) {
      console.error(error);
      alert("Tournament settings could not be saved.");
      return;
    }

    await fetchTournament();

    alert("Tournament settings saved.");
  };

  const handleCourseSelect = async (courseId: string) => {
    setSelectedCourseId(courseId);

    if (!courseId) return;

    const { data, error } = await supabase
      .from("courses")
      .select("name, address, phone, map_url, background_image_url")
      .eq("id", courseId)
      .single();

    if (error || !data) {
      console.error(error);
      return;
    }

    setCourseName(data.name || "");
    setCourseAddress(data.address || "");
    setCoursePhone(data.phone || "");
    setCourseMapUrl(data.map_url || "");
    setBackgroundImageUrl(data.background_image_url || "");
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim()) return;

    await supabase.from("tournament_players").insert({
      tournament_id: tournamentId,
      name: newPlayerName.trim(),
      claimed: false,
    });

    setNewPlayerName("");
    fetchPlayers();
  };

  const deletePlayer = async (playerId: string) => {
    await supabase
      .from("tournament_players")
      .delete()
      .eq("id", playerId);

    fetchPlayers();
  };

  const unlockSinglePlayer = async (playerId: string) => {
    await supabase
      .from("tournament_players")
      .update({
        claimed: false,
        claimed_at: null,
      })
      .eq("id", playerId);

    fetchPlayers();
    showAdminNotice("Player unlocked.");
  };

  const addTeam = async () => {
    if (!newTeamName.trim()) return;

    await supabase.from("teams").insert({
      tournament_id: tournamentId,
      name: newTeamName.trim(),
    });

    setNewTeamName("");
    fetchTeams();
  };

  const deleteTeam = async (teamId: string) => {
    await supabase.from("teams").delete().eq("id", teamId);

    fetchTeams();
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
};

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

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <AdminNav />

      {adminNotice && (
  <div className="mb-4 rounded-2xl border border-[#ff9900] bg-[#ff9900]/10 p-4 text-sm font-black uppercase tracking-[0.18em] text-[#ff9900]">
    {adminNotice}
  </div>
)}

      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Clubs & Holes Admin
      </div>

      <h1 className="mt-2 text-4xl font-black">
        {tournament.name}
      </h1>

      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Tournament Info
        </div>

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

          <button
            onClick={saveTournamentSettings}
            className="w-full rounded-full bg-[#ff9900] px-6 py-4 font-black text-black"
          >
            SAVE TOURNAMENT SETTINGS
          </button>
        </div>
      </div>

      {formatType !== "individual" && (
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
            Teams
          </div>

          <div className="mt-5 flex gap-3">
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
                <div className="flex items-center justify-between">
                  <div className="text-lg font-black">
                    {team.name}
                  </div>

                  <button
                    onClick={() => deleteTeam(team.id)}
                    className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-black uppercase text-red-400"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-4">
                  <select
                    defaultValue=""
                    onChange={(e) =>
                      assignPlayerToTeam(team.id, e.target.value)
                    }
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
                          (p) =>
                            p.id === tp.tournament_player_id
                        );

                        return (
                          <div
                            key={tp.id}
                            className="flex items-center justify-between rounded-xl bg-gray-950 p-3"
                          >
                            <div className="font-bold">
                              {player?.name || "Unknown Player"} 
                              {team.official_scorer_player_id === player?.id ? (

                                  <div className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-[#ff9900]">

                                    ⭐ Official Scorer

                                  </div>

                                ) : (

                                  <button

                                    onClick={() => setOfficialScorer(team.id, player!.id)}

                                    className="mt-3 rounded-full border border-[#ff9900]/30 bg-[#ff9900]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#ff9900]"

                                  >

                                    Make Official Scorer

                                  </button>

                                )}

                            </div>

                            <button
                              onClick={() =>
                                removePlayerFromTeam(tp.id)
                              }
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

      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Players
        </div>

        <div className="mt-5 flex gap-3">
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
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black p-4"
            >
              <div>
                <div className="text-lg font-black">
                  {player.name}
                </div>

                <div className="text-xs uppercase tracking-[0.18em] text-white/50">
                  {player.claimed ? "Claimed" : "Available"}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => unlockSinglePlayer(player.id)}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-black uppercase"
                >
                  Unlock
                </button>

                <button
                  onClick={() => deletePlayer(player.id)}
                  className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-black uppercase text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}