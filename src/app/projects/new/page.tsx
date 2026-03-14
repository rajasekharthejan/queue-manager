"use client";

import Link from "next/link";
import ProjectForm from "@/app/components/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back to Dashboard
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold text-slate-900">Create New Project</h1>
      <ProjectForm />
    </div>
  );
}
