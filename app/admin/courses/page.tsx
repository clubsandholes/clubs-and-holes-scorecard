"use client";
import AdminNav from "../AdminNav";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string;
  name: string;
  address?: string;
};

export default function CoursesAdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [newCourseName, setNewCourseName] = useState("");

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id, name, address")
      .order("name");

    if (error) {
      console.error(error);
      alert("Could not load courses.");
      return;
    }

    setCourses(data || []);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const addCourse = async () => {
    if (!newCourseName.trim()) {
      alert("Enter a course name.");
      return;
    }

    const { error } = await supabase.from("courses").insert({
      name: newCourseName.trim(),
    });

    if (error) {
      console.error(error);
      alert("Course could not be added.");
      return;
    }

    setNewCourseName("");
    fetchCourses();
  };

  const deleteCourse = async (courseId: string) => {
    const confirmed = confirm("Delete this course?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (error) {
      console.error(error);
      alert("Course could not be deleted.");
      return;
    }

    fetchCourses();
  };

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <AdminNav />
      <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
        Clubs & Holes Admin
      </div>

      <h1 className="mt-2 text-4xl font-black">Course Manager</h1>

      <p className="mt-2 text-gray-400">
        Create reusable courses once, then assign them to tournaments.
      </p>

      <div className="mt-8 rounded-[2rem] border border-white/10 bg-gray-950 p-5">
        <div className="text-xs font-black uppercase tracking-[0.25em] text-[#ff9900]">
          Add Course
        </div>

        <div className="mt-5 flex gap-3">
          <input
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            placeholder="Course name..."
            className="flex-1 rounded-2xl bg-black p-4 text-white outline-none"
          />

          <button
            onClick={addCourse}
            className="rounded-full bg-[#ff9900] px-6 font-black text-black"
          >
            ADD
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-gray-950 p-5"
          >
            <Link href={`/admin/courses/${course.id}`} className="block flex-1">
              <div className="text-xl font-black">{course.name}</div>
              <div className="mt-1 text-sm text-white/50">
                {course.address || "No address set"}
              </div>
            </Link>

            <button
              onClick={() => deleteCourse(course.id)}
              className="rounded-full border border-red-500/30 px-4 py-2 text-xs font-black uppercase text-red-400"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}