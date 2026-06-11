"use client";
import { useEffect, useState } from "react";

import Link from "next/link";
import AdminNav from "./AdminNav";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type Tournament = {
  id: string;
  name: string;
  code: string;
  status: "draft" | "active" | "completed" | "archived";
};

export default function AdminPage() {

  const [password, setPassword] = useState("");

  const [isUnlocked, setIsUnlocked] = useState(false);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const unlockAdmin = () => {

    if (password === "swingreckless") {

      setIsUnlocked(true);

    } else {

      alert("Wrong password.");

    }

  };

  const fetchTournaments = async () => {

    const { data, error } = await supabase

      .from("tournaments")

      .select("id, name, code, status")

      .order("created_at", { ascending: false });

    if (error) {

      console.error(error);

      return;

    }

    setTournaments(data || []);

    setLoading(false);

  };

  useEffect(() => {

    if (isUnlocked) {

      fetchTournaments();

    }

  }, [isUnlocked]);

  const createTournament = async () => {
  const defaultName = "New Tournament";
  const randomCode = `CH${Math.floor(1000 + Math.random() * 9000)}`;

  const { data, error } = await supabase
    .from("tournaments")
    .insert({
      name: defaultName,
      code: randomCode,
      status: "draft",
      format_type: "individual",
    })
    .select("id")
    .single();

  if (error || !data) {
  console.error("Create tournament error:", error);
  alert(error?.message || "Tournament could not be created.");
  return;
}

  router.push(`/admin/tournament/${data.id}`);
};

  if (!isUnlocked) {

    return (

      <div className="min-h-screen bg-black p-6 text-white">
        <div className="mx-auto max-w-6xl">

        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center">

          <h1 className="text-4xl font-black">Admin</h1>

          <p className="mt-2 text-gray-400">

            Tournament Control Panel

          </p>

          <input

            type="password"

            value={password}

            onChange={(e) => setPassword(e.target.value)}

            placeholder="ENTER ADMIN PASSWORD"

            className="mt-8 rounded-xl bg-gray-900 p-4 text-center font-bold uppercase outline-none"

          />

          <button

            onClick={unlockAdmin}

            className="mt-4 rounded-full bg-[#ff9900] px-6 py-4 font-black text-black"

          >

            ENTER ADMIN

          </button>

        </div>
        </div>
      </div>

    );

  }

 const getStatusStyle = (status: Tournament["status"]) => {
  if (status === "draft") {
    return "border-white/10 bg-white/10 text-white";
  }

  if (status === "active") {
    return "border-green-400/30 bg-green-500/15 text-green-300";
  }

  if (status === "completed") {
    return "border-[#ff9900]/30 bg-[#ff9900]/15 text-[#ff9900]";
  }

  return "border-red-400/30 bg-red-500/15 text-red-300";
}; 

return (
  <div className="min-h-screen bg-black p-6 text-white">
    <AdminNav />

      <div className="flex items-center justify-between">

        <div>

          <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">

            Clubs & Holes

          </div>

          <h1 className="mt-1 text-4xl font-black">

            Tournament Manager

          </h1>

        </div>

        <button
            onClick={createTournament}
            className="rounded-full bg-[#ff9900] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
          >
            + New Tournament
          </button>

      </div>

      <div className="mt-8">

        {loading ? (

          <div className="text-gray-500">Loading tournaments...</div>

        ) : tournaments.length === 0 ? (

          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center text-gray-400">

            No tournaments found.

          </div>

        ) : (

          <div className="space-y-4">

            {tournaments.map((tournament) => (

              <Link

                key={tournament.id}

                href={`/admin/tournament/${tournament.id}`}

                className="block rounded-[2rem] border border-white/10 bg-black/50 p-5 shadow-xl backdrop-blur-md transition-all hover:border-[#ff9900]"

              >

                <div className="flex items-center justify-between">

                  <div>

                    <div className="text-xs font-black uppercase tracking-[0.18em] text-[#ff9900]">

                      Tournament

                    </div>

                    <div className="mt-1 text-2xl font-black">

                      {tournament.name}

                    </div>

                    <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white/60">

                      Code: {tournament.code}
                      <div
                        className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusStyle(
                          tournament.status
                        )}`}
                      >
                        {tournament.status}
                      </div>

                    </div>

                  </div>

                  <div className="text-3xl text-white/30">

                    →

                  </div>

                </div>

              </Link>

            ))}

          </div>

        )}

      </div>

    </div>

  );

}