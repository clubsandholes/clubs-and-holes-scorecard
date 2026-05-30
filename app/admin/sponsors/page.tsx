"use client";

import AdminNav from "../AdminNav";
import { useEffect, useState, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";

// =========================
// TYPES
// =========================

type Sponsor = {
  id: string;
  name: string;
  image_url?: string | null;
  website_url?: string | null;
  is_active?: boolean;
};

type Tournament = {
  id: string;
  name: string;
  code: string;
};

type SponsorPlacement = {
  id: string;
  sponsor_id: string;
  tournament_id?: string | null;
  placement_type: string;
  placement_label?: string | null;
  scope_type?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  priority?: number | null;
  is_active?: boolean;
};

// =========================
// PAGE COMPONENT
// =========================

export default function SponsorsAdminPage() {
  // =========================
  // STATE
  // =========================

  const [loading, setLoading] = useState(true);
  const [adminNotice, setAdminNotice] = useState("");

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [placements, setPlacements] = useState<SponsorPlacement[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  const [sponsorName, setSponsorName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sponsorImageFile, setSponsorImageFile] = useState<File | null>(null);

  const [placementSponsorId, setPlacementSponsorId] = useState("");
  const [scopeType, setScopeType] = useState("global");
  const [tournamentCode, setTournamentCode] = useState("");
  const [placementType, setPlacementType] = useState("scorecard");
  const [placementLabel, setPlacementLabel] = useState("Presented By");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [priority, setPriority] = useState("0");

  // =========================
  // HELPERS
  // =========================

  const showAdminNotice = (message: string) => {
    setAdminNotice(message);

    setTimeout(() => {
      setAdminNotice("");
    }, 2500);
  };

  const getSponsorName = (sponsorId: string) => {
    return sponsors.find((sponsor) => sponsor.id === sponsorId)?.name || "Sponsor";
  };

  const getTournamentLabel = (tournamentId?: string | null) => {
    if (!tournamentId) return "Global";

    const tournament = tournaments.find((item) => item.id === tournamentId);

    return tournament ? `${tournament.name} (${tournament.code})` : "Tournament";
  };

  // =========================
  // FETCH DATA
  // =========================

  const fetchSponsors = async () => {
    const { data, error } = await supabase
      .from("sponsors")
      .select("id, name, image_url, website_url, is_active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Sponsors could not be loaded.");
      return;
    }

    setSponsors(data || []);
  };

  const fetchPlacements = async () => {
    const { data, error } = await supabase
      .from("sponsor_placements")
      .select(
        "id, sponsor_id, tournament_id, placement_type, placement_label, scope_type, starts_at, ends_at, priority, is_active"
      )
      .order("priority", { ascending: false });

    if (error) {
      console.error(error);
      alert("Sponsor placements could not be loaded.");
      return;
    }

    setPlacements(data || []);
  };

  const fetchTournaments = async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name, code")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setTournaments(data || []);
  };

  const fetchPageData = async () => {
    setLoading(true);

    await fetchSponsors();
    await fetchPlacements();
    await fetchTournaments();

    setLoading(false);
  };

  // =========================
  // SPONSOR IMAGE UPLOAD
  // =========================

  const uploadSponsorImage = async (sponsorId: string, file: File) => {
    const fileExtension = file.name.split(".").pop() || "png";
    const filePath = `sponsors/${sponsorId}/card.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("scorecard-media")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      console.error("UPLOAD ERROR:", uploadError);

alert(
  `Sponsor image upload failed: ${
    uploadError?.message || "Unknown error"
  }`
);
    }

    const { data } = supabase.storage
      .from("scorecard-media")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // =========================
  // CREATE SPONSOR
  // =========================

  const createSponsor = async () => {
    if (!sponsorName.trim()) {
      alert("Enter sponsor name.");
      return;
    }

    const { data, error } = await supabase
      .from("sponsors")
      .insert({
        name: sponsorName.trim(),
        website_url: websiteUrl.trim() || null,
        image_url: imageUrl.trim() || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (error || !data) {
  console.error("SPONSOR CREATE ERROR:", error);

  alert(
    `Sponsor could not be created: ${
      error?.message || "No sponsor data returned"
    }`
  );

  return;
}

    if (sponsorImageFile) {
      const uploadedUrl = await uploadSponsorImage(data.id, sponsorImageFile);

      if (uploadedUrl) {
        await supabase
          .from("sponsors")
          .update({
            image_url: uploadedUrl,
          })
          .eq("id", data.id);
      }
    }

    setSponsorName("");
    setWebsiteUrl("");
    setImageUrl("");
    setSponsorImageFile(null);

    await fetchSponsors();
    showAdminNotice("Sponsor created.");
  };

  // =========================
  // CREATE PLACEMENT
  // =========================

  const createPlacement = async () => {
    if (!placementSponsorId) {
      alert("Select a sponsor.");
      return;
    }

    let tournamentId: string | null = null;

    if (scopeType === "tournament") {
      if (!tournamentCode.trim()) {
        alert("Enter tournament code.");
        return;
      }

      const { data: tournament, error } = await supabase
        .from("tournaments")
        .select("id")
        .eq("code", tournamentCode.trim().toUpperCase())
        .single();

      if (error || !tournament) {
        alert("Tournament not found.");
        return;
      }

      tournamentId = tournament.id;
    }

    const { error } = await supabase.from("sponsor_placements").insert({
      sponsor_id: placementSponsorId,
      scope_type: scopeType,
      tournament_id: tournamentId,
      placement_type: placementType,
      placement_label: placementLabel.trim() || "Presented By",
      starts_at: startsAt || null,
      ends_at: endsAt || null,
      priority: Number(priority) || 0,
      display_order: Number(priority) || 0,
      is_active: true,
    });

    if (error) {
      console.error(error);
      alert("Sponsor placement could not be created.");
      return;
    }

    setPlacementSponsorId("");
    setScopeType("global");
    setTournamentCode("");
    setPlacementType("scorecard");
    setPlacementLabel("Presented By");
    setStartsAt("");
    setEndsAt("");
    setPriority("0");

    await fetchPlacements();
    showAdminNotice("Sponsor placement created.");
  };

  // =========================
  // TOGGLE / DELETE SPONSOR
  // =========================

  const toggleSponsorStatus = async (sponsor: Sponsor) => {
    const { error } = await supabase
      .from("sponsors")
      .update({
        is_active: !sponsor.is_active,
      })
      .eq("id", sponsor.id);

    if (error) {
      console.error(error);
      alert("Sponsor status could not be updated.");
      return;
    }

    await fetchSponsors();
    showAdminNotice("Sponsor status updated.");
  };

  const deleteSponsor = async (sponsorId: string) => {
    const confirmed = confirm("Delete sponsor?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("sponsors")
      .delete()
      .eq("id", sponsorId);

    if (error) {
      console.error(error);
      alert("Sponsor could not be deleted.");
      return;
    }

    await fetchSponsors();
    await fetchPlacements();
    showAdminNotice("Sponsor deleted.");
  };

  // =========================
  // TOGGLE / DELETE PLACEMENT
  // =========================

  const togglePlacementStatus = async (placement: SponsorPlacement) => {
    const { error } = await supabase
      .from("sponsor_placements")
      .update({
        is_active: !placement.is_active,
      })
      .eq("id", placement.id);

    if (error) {
      console.error(error);
      alert("Placement status could not be updated.");
      return;
    }

    await fetchPlacements();
    showAdminNotice("Placement status updated.");
  };

  const deletePlacement = async (placementId: string) => {
    const confirmed = confirm("Delete sponsor placement?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("sponsor_placements")
      .delete()
      .eq("id", placementId);

    if (error) {
      console.error(error);
      alert("Placement could not be deleted.");
      return;
    }

    await fetchPlacements();
    showAdminNotice("Placement deleted.");
  };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    fetchPageData();
  }, []);

  // =========================
  // LOADING STATE
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 text-white">
        Loading sponsors...
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <AdminNav />

      {adminNotice && (
        <div className="mb-4 rounded-2xl border border-[#ff9900] bg-[#ff9900]/10 p-4 text-sm font-black uppercase tracking-[0.18em] text-[#ff9900]">
          {adminNotice}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Clubs & Holes Admin
      </div>

      <h1 className="mt-2 text-4xl font-black">Sponsors</h1>

      {/* CREATE SPONSOR */}
      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Sponsor Profile
        </div>

        <h2 className="mt-2 text-2xl font-black">Add Sponsor</h2>

        <div className="mt-6 space-y-4">
          <input
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
            placeholder="Sponsor Name"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="Sponsor Website URL"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Sponsor Card Image URL"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <label className="flex cursor-pointer items-center justify-center rounded-full border border-[#ff9900]/30 bg-[#ff9900]/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#ff9900]">
            Upload Sponsor Card Image

            <input
              type="file"
              accept="image/*"
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSponsorImageFile(e.target.files?.[0] || null)
              }
              className="hidden"
            />
          </label>

          {sponsorImageFile && (
            <div className="text-xs font-bold text-white/50">
              Selected: {sponsorImageFile.name}
            </div>
          )}

          <button
            onClick={createSponsor}
            className="w-full rounded-full bg-[#ff9900] px-6 py-4 font-black text-black"
          >
            ADD SPONSOR
          </button>
        </div>
      </div>

      {/* CREATE PLACEMENT */}
      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Sponsor Placement
        </div>

        <h2 className="mt-2 text-2xl font-black">Place Sponsor</h2>

        <div className="mt-6 space-y-4">
          <select
            value={placementSponsorId}
            onChange={(e) => setPlacementSponsorId(e.target.value)}
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          >
            <option value="">Select Sponsor</option>

            {sponsors.map((sponsor) => (
              <option key={sponsor.id} value={sponsor.id}>
                {sponsor.name}
              </option>
            ))}
          </select>

          <select
            value={scopeType}
            onChange={(e) => setScopeType(e.target.value)}
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          >
            <option value="global">Global</option>
            <option value="tournament">Tournament</option>
            <option value="league" disabled>
              League Future
            </option>
          </select>

          {scopeType === "tournament" && (
            <input
              value={tournamentCode}
              onChange={(e) => setTournamentCode(e.target.value.toUpperCase())}
              placeholder="Tournament Code"
              className="w-full rounded-2xl bg-black p-4 text-white outline-none"
            />
          )}

          <select
            value={placementType}
            onChange={(e) => setPlacementType(e.target.value)}
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          >
            <option value="scorecard">Scorecard Sponsor Card</option>
            <option value="leaderboard">Leaderboard</option>
            <option value="bunker">The Bunker Future</option>
            <option value="livefeed">Live Feed Future</option>
          </select>

          <input
            value={placementLabel}
            onChange={(e) => setPlacementLabel(e.target.value)}
            placeholder="Placement Label: Presented By"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="w-full rounded-2xl bg-black p-4 text-white outline-none"
            />

            <input
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-2xl bg-black p-4 text-white outline-none"
            />
          </div>

          <input
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            placeholder="Priority"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <button
            onClick={createPlacement}
            className="w-full rounded-full bg-[#ff9900] px-6 py-4 font-black text-black"
          >
            SAVE PLACEMENT
          </button>
        </div>
      </div>

      {/* SPONSOR LIST */}
      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Sponsor Inventory
        </div>

        <h2 className="mt-2 text-2xl font-black">Sponsors</h2>

        <div className="mt-6 space-y-3">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="rounded-2xl border border-white/10 bg-black p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-950">
                  {sponsor.image_url ? (
                    <img
                      src={sponsor.image_url}
                      alt={sponsor.name}
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-xl font-black text-[#ff9900]">
                      {sponsor.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-black">{sponsor.name}</div>

                  <div className="mt-1 truncate text-xs text-white/50">
                    {sponsor.website_url || "No website"}
                  </div>

                  <div className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/40">
                    {sponsor.is_active ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => toggleSponsorStatus(sponsor)}
                  className="rounded-full border border-white/10 px-4 py-3 text-xs font-black uppercase"
                >
                  {sponsor.is_active ? "Disable" : "Enable"}
                </button>

                <button
                  onClick={() => deleteSponsor(sponsor.id)}
                  className="rounded-full border border-red-500/30 px-4 py-3 text-xs font-black uppercase text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PLACEMENT LIST */}
      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Placement Inventory
        </div>

        <h2 className="mt-2 text-2xl font-black">Sponsor Placements</h2>

        <div className="mt-6 space-y-3">
          {placements.map((placement) => (
            <div
              key={placement.id}
              className="rounded-2xl border border-white/10 bg-black p-4"
            >
              <div className="text-lg font-black">
                {getSponsorName(placement.sponsor_id)}
              </div>

              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/50">
                {placement.placement_label || "Presented By"} ·{" "}
                {placement.placement_type} · {placement.scope_type}
              </div>

              <div className="mt-1 text-xs text-white/40">
                {getTournamentLabel(placement.tournament_id)}
              </div>

              <div className="mt-1 text-xs text-white/40">
                {placement.starts_at || "No start"} →{" "}
                {placement.ends_at || "No end"} · Priority{" "}
                {placement.priority ?? 0}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => togglePlacementStatus(placement)}
                  className="rounded-full border border-white/10 px-4 py-3 text-xs font-black uppercase"
                >
                  {placement.is_active ? "Disable" : "Enable"}
                </button>

                <button
                  onClick={() => deletePlacement(placement.id)}
                  className="rounded-full border border-red-500/30 px-4 py-3 text-xs font-black uppercase text-red-400"
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