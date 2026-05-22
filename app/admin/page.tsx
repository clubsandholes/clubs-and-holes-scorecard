"use client";

import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  const unlockAdmin = () => {
    if (password === "swingreckless") {
      setIsUnlocked(true);
    } else {
      alert("Wrong password.");
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-black p-6 text-white">
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center">
          <h1 className="text-4xl font-black">Admin</h1>
          <p className="mt-2 text-gray-400">Tournament Control Panel</p>

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
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <h1 className="text-4xl font-black">Tournament Control Panel</h1>
      <p className="mt-2 text-gray-400">Clubs & Holes Admin</p>

      <div className="mt-8 grid gap-4">
        {["Tournament Setup", "Players", "Live Controls", "Reset Tools"].map(
          (item) => (
            <button
              key={item}
              className="rounded-2xl border border-gray-800 bg-gray-950 p-5 text-left text-xl font-black"
            >
              {item}
            </button>
          )
        )}
      </div>
    </div>
  );
}