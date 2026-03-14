"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProjectForm from "@/app/components/ProjectForm";

export default function EditProjectPage() {
  const params = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href={`/projects/${params.id}`} className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to Project
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold text-slate-900">Edit Project</h1>
      <ProjectForm initialData={project as unknown as Record<string, unknown>} isEdit />
    </div>
  );
}
