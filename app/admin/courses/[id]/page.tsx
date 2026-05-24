"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  map_url?: string;
  background_image_url?: string;
};

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");

  const fetchCourse = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, name, address, phone, map_url, background_image_url")
      .eq("id", courseId)
      .single();

    if (error) {
      console.error(error);
      alert("Course not found.");
      setLoading(false);
      return;
    }

    setCourse(data);
    setName(data.name || "");
    setAddress(data.address || "");
    setPhone(data.phone || "");
    setMapUrl(data.map_url || "");
    setBackgroundImageUrl(data.background_image_url || "");
    setLoading(false);
  };

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const saveCourse = async () => {
    const { error } = await supabase
      .from("courses")
      .update({
        name,
        address,
        phone,
        map_url: mapUrl,
        background_image_url: backgroundImageUrl,
      })
      .eq("id", courseId);

    if (error) {
      console.error(error);
      alert("Course could not be saved.");
      return;
    }

    await fetchCourse();
    alert("Course saved.");
  };

  if (loading) {
    return <div className="min-h-screen bg-black p-6 text-white">Loading course...</div>;
  }

  if (!course) {
    return <div className="min-h-screen bg-black p-6 text-white">Course not found.</div>;
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Clubs & Holes Admin
      </div>

      <h1 className="mt-2 text-4xl font-black">{course.name}</h1>

      <p className="mt-2 text-gray-400">
        Reusable course profile
      </p>

      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Course Info
        </div>

        <h2 className="mt-2 text-2xl font-black">Course Setup</h2>

        <div className="mt-6 space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Course Name"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Course Address"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Course Phone"
            className="w-full rounded-2xl bg-black p-4 text-white outline-none"
          />

          <input
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
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
            onClick={saveCourse}
            className="w-full rounded-full bg-[#ff9900] px-6 py-4 font-black text-black"
          >
            SAVE COURSE
          </button>
        </div>
      </div>
    </div>
  );
}