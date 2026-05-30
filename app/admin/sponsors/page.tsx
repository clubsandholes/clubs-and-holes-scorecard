"use client";

import AdminNav from "../AdminNav";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// =========================
// TYPES
// =========================

type Sponsor = {
  id: string;
  name: string;
  image_url?: string;
  website_url?: string;
  is_active?: boolean;
};

// =========================
// PAGE COMPONENT
// =========================

export default function SponsorsAdminPage() {
  // =========================
  // STATE
  // =========================

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  const [sponsorName, setSponsorName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [adminNotice, setAdminNotice] = useState("");

  // =========================
  // HELPERS
  // =========================

  const showAdminNotice = (message: string) => {
    setAdminNotice(message);

    setTimeout(() => {
      setAdminNotice("");
    }, 2500);
  };

  // =========================
  // FETCH SPONSORS
  // =========================

  const fetchSponsors = async () => {
    const { data, error } = await supabase
      .from("sponsors")
      .select("id, name, image_url, website_url, is_active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Sponsors could not be loaded.");
      setLoading(false);
      return;
    }

    setSponsors(data || []);
    setLoading(false);
  };

  // =========================
  // CREATE SPONSOR
  // =========================

  const createSponsor = async () => {
    if (!sponsorName.trim()) {
      alert("Enter sponsor name.");
      return;
    }

    const { error } = await supabase.from("sponsors").insert({
      name: sponsorName.trim(),
      website_url: websiteUrl.trim() || null,
      image_url: imageUrl.trim() || null,
      is_active: true,
    });

    if (error) {
      console.error(error);
      alert("Sponsor could not be created.");
      return;
    }

    setSponsorName("");
    setWebsiteUrl("");
    setImageUrl("");

    await fetchSponsors();
    showAdminNotice("Sponsor created.");
  };

  // =========================
  // TOGGLE SPONSOR STATUS
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

  // =========================
  // DELETE SPONSOR
  // =========================

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
    showAdminNotice("Sponsor deleted.");
  };

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    fetchSponsors();
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
          Sponsor Setup
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
            placeholder="Website URL"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Logo/Image URL"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <button
            onClick={createSponsor}
            className="w-full rounded-full bg-[#ff9900] px-6 py-4 font-black text-black"
          >
            ADD SPONSOR
          </button>
        </div>
      </div>

      {/* SPONSOR LIST */}
      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Sponsor Inventory
        </div>

        <h2 className="mt-2 text-2xl font-black">Active Sponsors</h2>

        <div className="mt-6 space-y-3">
          {sponsors.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black p-5 text-center text-white/50">
              No sponsors added yet.
            </div>
          ) : (
            sponsors.map((sponsor) => (
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
                    <div className="truncate text-lg font-black">
                      {sponsor.name}
                    </div>

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
            ))
          )}
        </div>
      </div>
    </div>
  );
}