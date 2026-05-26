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
  course_name?: string;
  background_image_url?: string;
  course_address?: string;
  course_phone?: string;
  course_map_url?: string;
  tournament_date?: string;
  status?: string;
};

export default function TournamentAdminPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminMessage, setAdminMessage] = useState("");

  const [courseName, setCourseName] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [courseAddress, setCourseAddress] = useState("");
  const [coursePhone, setCoursePhone] = useState("");
  const [courseMapUrl, setCourseMapUrl] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [tournamentStatus, setTournamentStatus] = useState("draft");
  const [players, setPlayers] = useState<any[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [formatType, setFormatType] = useState("individual");

  const fetchTournament = async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select(
          "id, name, code, course_id, tournament_date, status, course_name, background_image_url, course_address, course_phone, course_map_url"
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
    setCourseName(data.course_name || "");
    setBackgroundImageUrl(data.background_image_url || "");
    setCourseAddress(data.course_address || "");
    setCoursePhone(data.course_phone || "");
    setCourseMapUrl(data.course_map_url || "");
    setSelectedCourseId(data.course_id || "");
    setTournamentCodeValue(data.code || "");
    setTournamentDate(data.tournament_date || "");
    setTournamentStatus(data.status || "draft");
    setTournament(data);
    setLoading(false);
    setFormatType(data.format_type || "individual");
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

  useEffect(() => {
    if (tournamentId) {
      fetchTournament();
      fetchPlayers();
      fetchCourses();
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
      code: cleanedCode,
      course_id: selectedCourseId || null,
      tournament_date: tournamentDate || null,
      course_name: courseName,
      background_image_url: backgroundImageUrl,
      course_address: courseAddress,
      course_phone: coursePhone,
      course_map_url: courseMapUrl,
      status: tournamentStatus,
      name: tournamentName,
      format_type: formatType,
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
    alert("Admin alert sent.");
  };
  const [tournamentDate, setTournamentDate] = useState("");
  const [tournamentCodeValue, setTournamentCodeValue] = useState("");
  const clearTicker = async () => {
    const confirmed = confirm("Clear ticker events for this tournament?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("ticker_events")
      .delete()
      .eq("tournament_id", tournamentId);

    if (error) {
      console.error(error);
      alert("Ticker could not be cleared.");
      return;
    }

    alert("Ticker cleared.");
  };

  const clearScores = async () => {
    const confirmed = confirm("Clear all scores for this tournament?");
    if (!confirmed) return;

    const { data: tournamentPlayers, error: playersError } = await supabase
      .from("tournament_players")
      .select("id")
      .eq("tournament_id", tournamentId);

    if (playersError) {
      console.error(playersError);
      alert("Could not find tournament players.");
      return;
    }

    const playerIds = (tournamentPlayers || []).map((p) => p.id);

    if (playerIds.length === 0) {
      alert("No players found.");
      return;
    }

    const { error } = await supabase
      .from("scores")
      .delete()
      .in("tournament_player_id", playerIds);

    if (error) {
      console.error(error);
      alert("Scores could not be cleared.");
      return;
    }

    alert("Scores cleared.");
  };

  const unlockPlayers = async () => {
    const confirmed = confirm("Unlock all players for this tournament?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("tournament_players")
      .update({
        claimed: false,
        claimed_at: null,
      })
      .eq("tournament_id", tournamentId);

    if (error) {
      console.error(error);
      alert("Players could not be unlocked.");
      return;
    }

    await fetchPlayers();
    alert("Players unlocked.");
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim()) {
      alert("Enter player name.");
      return;
    }

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
      return;
    }

    fetchPlayers();
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
      return;
    }

    fetchPlayers();
  };

  const handleCourseSelect = async (courseId: string) => {
  setSelectedCourseId(courseId);

  if (!courseId) {
    setCourseName("");
    setCourseAddress("");
    setCoursePhone("");
    setCourseMapUrl("");
    setBackgroundImageUrl("");
    return;
  }

  const { data, error } = await supabase
    .from("courses")
    .select("name, address, phone, map_url, background_image_url")
    .eq("id", courseId)
    .single();

  if (error || !data) {
    console.error(error);
    alert("Could not load course details.");
    return;
  }

  setCourseName(data.name || "");
  setCourseAddress(data.address || "");
  setCoursePhone(data.phone || "");
  setCourseMapUrl(data.map_url || "");
  setBackgroundImageUrl(data.background_image_url || "");
};

  if (loading) {
    return <div className="min-h-screen bg-black p-6 text-white">Loading tournament...</div>;
  }

  if (!tournament) {
    return <div className="min-h-screen bg-black p-6 text-white">Tournament not found.</div>;
  }

  return (
    
    <div className="min-h-screen bg-black p-6 text-white">
      <AdminNav />
      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Clubs & Holes Admin
      </div>

      <label className="block">
          <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
            Tournament Name
          </div>

          <input
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            placeholder="Belt Invitational"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />
        </label>

      <p className="mt-2 text-gray-400">
        Tournament Code: <span className="font-black text-[#ff9900]">{tournament.code}</span>
      </p>


      <label className="block">
  <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
    Tournament Format
  </div>

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
</label>


      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Tournament Info
        </div>

        <h2 className="mt-2 text-2xl font-black">Event Setup</h2>

        <div className="mt-6 space-y-4">
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

          <label className="block">
          <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
            Tournament Code
          </div>

            <input
              value={tournamentCodeValue}
              onChange={(e) =>
                setTournamentCodeValue(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                )
              }
              placeholder="PLAY16"
              className="w-full rounded-2xl bg-black p-4 text-white outline-none"
            />
          </label>

          <label className="block">
            <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
              Tournament Date
            </div>

            <input
              type="date"
              value={tournamentDate}
              onChange={(e) => setTournamentDate(e.target.value)}
              className="w-full rounded-2xl bg-black p-4 text-white outline-none"
            />
          </label>

              <label className="block">
                <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
                  Tournament Status
                </div>

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
              </label>

          <input
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Course Name"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <input
            value={courseAddress}
            onChange={(e) => setCourseAddress(e.target.value)}
            placeholder="Course Address"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <input
            value={coursePhone}
            onChange={(e) => setCoursePhone(e.target.value)}
            placeholder="Course Phone"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <input
            value={courseMapUrl}
            onChange={(e) => setCourseMapUrl(e.target.value)}
            placeholder="Course Map URL"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <input
            value={backgroundImageUrl}
            onChange={(e) => setBackgroundImageUrl(e.target.value)}
            placeholder="Background Image URL"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <button
            onClick={saveTournamentSettings}
            className="w-full rounded-full bg-[#ff9900] px-6 py-4 font-black text-black"
          >
            SAVE TOURNAMENT SETTINGS
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Live Controls
        </div>

        <h2 className="mt-2 text-2xl font-black">Event Control Room</h2>

        <textarea
          value={adminMessage}
          onChange={(e) => setAdminMessage(e.target.value)}
          placeholder="Type admin alert..."
          className="mt-5 min-h-28 w-full rounded-2xl bg-black p-4 text-white outline-none"
        />

        <button
          onClick={sendAdminAlert}
          className="mt-4 w-full rounded-full bg-[#ff9900] px-6 py-4 font-black text-black"
        >
          SEND ADMIN ALERT
        </button>

        <div className="mt-6 grid gap-3">
          <button onClick={clearTicker} className="rounded-2xl border border-white/10 bg-black p-4 text-left font-black text-white">
            Clear Ticker
          </button>

          <button onClick={clearScores} className="rounded-2xl border border-white/10 bg-black p-4 text-left font-black text-white">
            Clear Scores
          </button>

          <button onClick={unlockPlayers} className="rounded-2xl border border-white/10 bg-black p-4 text-left font-black text-white">
            Unlock Players
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Players
        </div>

        <h2 className="mt-2 text-2xl font-black">Tournament Players</h2>

        <div className="mt-5 flex gap-3">
          <input
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Add player..."
            className="flex-1 rounded-2xl bg-black p-4 text-white outline-none"
          />

          <button onClick={addPlayer} className="rounded-full bg-[#ff9900] px-6 font-black text-black">
            ADD
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black p-4">
              <div>
                <div className="text-lg font-black">{player.name}</div>

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