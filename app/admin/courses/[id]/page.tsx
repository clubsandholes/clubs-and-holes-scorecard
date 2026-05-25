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

type CourseHole = {
  id?: string;
  course_id?: string;
  hole_number: number;
  par: number;
  yards: number;
  image_url?: string;
};

const MEDIA_BUCKET = "scorecard-media";

const defaultHoles: CourseHole[] = Array.from({ length: 18 }, (_, index) => ({
  hole_number: index + 1,
  par: 4,
  yards: 0,
  image_url: "",
}));

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");

  const [holes, setHoles] = useState<CourseHole[]>(defaultHoles);

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error(error);
      alert("Upload failed.");
      return "";
    }

    return getPublicUrl(path);
  };

  const handleBackgroundUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const fileExtension = file.name.split(".").pop() || "jpg";
    const path = `courses/${courseId}/background.${fileExtension}`;
    const publicUrl = await uploadFile(file, path);

    if (publicUrl) {
      setBackgroundImageUrl(publicUrl);
    }

    setIsUploading(false);
  };

  const handleHoleImageUpload = async (
    holeNumber: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const fileExtension = file.name.split(".").pop() || "jpg";
    const path = `courses/${courseId}/holes/hole-${holeNumber}.${fileExtension}`;
    const publicUrl = await uploadFile(file, path);

    if (publicUrl) {
      updateHoleField(holeNumber, "image_url", publicUrl);
    }

    setIsUploading(false);
  };

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

  const fetchHoles = async () => {
    const { data, error } = await supabase
      .from("course_holes")
      .select("id, course_id, hole_number, par, yards, image_url")
      .eq("course_id", courseId)
      .order("hole_number");

    if (error) {
      console.error(error);
      alert("Could not load holes.");
      return;
    }

    const mergedHoles = defaultHoles.map((defaultHole) => {
      const existingHole = (data || []).find(
        (hole) => hole.hole_number === defaultHole.hole_number
      );

      return existingHole || defaultHole;
    });

    setHoles(mergedHoles);
  };

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchHoles();
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

  const updateHoleField = (
    holeNumber: number,
    field: "par" | "yards" | "image_url",
    value: string
  ) => {
    setHoles((currentHoles) =>
      currentHoles.map((hole) => {
        if (hole.hole_number !== holeNumber) return hole;

        if (field === "par" || field === "yards") {
          return {
            ...hole,
            [field]: Number(value),
          };
        }

        return {
          ...hole,
          [field]: value,
        };
      })
    );
  };

  const saveHoles = async () => {
    const rowsToSave = holes.map((hole) => ({
      course_id: courseId,
      hole_number: hole.hole_number,
      par: hole.par || 4,
      yards: hole.yards || 0,
      image_url: hole.image_url || "",
    }));

    const { error } = await supabase.from("course_holes").upsert(rowsToSave, {
      onConflict: "course_id,hole_number",
    });

    if (error) {
      console.error(error);
      alert("Holes could not be saved.");
      return;
    }

    await fetchHoles();
    alert("Hole setup saved.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 text-white">
        Loading course...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-black p-6 text-white">
        Course not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Clubs & Holes Admin
      </div>

      <h1 className="mt-2 text-4xl font-black">{course.name}</h1>

      <p className="mt-2 text-gray-400">Reusable course profile</p>

      {isUploading && (
        <div className="mt-4 rounded-2xl border border-[#ff9900] bg-[#ff9900]/10 p-4 text-sm font-black uppercase tracking-[0.18em] text-[#ff9900]">
          Uploading image...
        </div>
      )}

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

          <div className="rounded-2xl border border-white/10 bg-black p-4">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
              Course Background Image
            </div>

            {backgroundImageUrl && (
              <img
                src={backgroundImageUrl}
                alt="Course background preview"
                className="mt-3 h-40 w-full rounded-xl object-cover"
              />
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="mt-4 w-full text-sm text-white/70"
            />

            <input
              value={backgroundImageUrl}
              onChange={(e) => setBackgroundImageUrl(e.target.value)}
              placeholder="Background Image URL"
              className="mt-3 w-full rounded-2xl bg-gray-950 p-4 text-white outline-none"
            />
          </div>

          <button
            onClick={saveCourse}
            className="w-full rounded-full bg-[#ff9900] px-6 py-4 font-black text-black"
          >
            SAVE COURSE
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Hole Setup
        </div>

        <h2 className="mt-2 text-2xl font-black">18 Hole Manager</h2>

        <div className="mt-6 space-y-4">
          {holes.map((hole) => (
            <div
              key={hole.hole_number}
              className="rounded-2xl border border-white/10 bg-black p-4"
            >
              <div className="text-lg font-black text-[#ff9900]">
                Hole {hole.hole_number}
              </div>

              {hole.image_url && (
                <img
                  src={hole.image_url}
                  alt={`Hole ${hole.hole_number}`}
                  className="mt-3 h-40 w-full rounded-xl object-contain bg-gray-950"
                />
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
                    Par
                  </div>

                  <input
                    type="number"
                    value={hole.par || ""}
                    onChange={(e) =>
                      updateHoleField(hole.hole_number, "par", e.target.value)
                    }
                    placeholder="4"
                    className="w-full rounded-xl bg-gray-950 p-3 text-white outline-none"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/50">
                    Yards
                  </div>

                  <input
                    type="number"
                    value={hole.yards || ""}
                    onChange={(e) =>
                      updateHoleField(hole.hole_number, "yards", e.target.value)
                    }
                    placeholder="0"
                    className="w-full rounded-xl bg-gray-950 p-3 text-white outline-none"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-gray-950 p-3">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-white/50">
                  Hole Image Upload
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleHoleImageUpload(hole.hole_number, e)}
                  className="mt-3 w-full text-sm text-white/70"
                />

                <input
                  value={hole.image_url || ""}
                  onChange={(e) =>
                    updateHoleField(
                      hole.hole_number,
                      "image_url",
                      e.target.value
                    )
                  }
                  placeholder="Hole image URL"
                  className="mt-3 w-full rounded-xl bg-black p-3 text-white outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={saveHoles}
          className="mt-6 w-full rounded-full bg-[#ff9900] px-6 py-4 font-black text-black"
        >
          SAVE 18 HOLES
        </button>
      </div>
    </div>
  );
}