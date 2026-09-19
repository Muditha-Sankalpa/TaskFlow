"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Navbar } from "@/components/navbar";
import { TaskForm } from "@/components/task-form";
import { createTask, type TaskInput } from "@/lib/tasks-api";
import { ApiError } from "@/lib/api";

function NewTaskContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(input: TaskInput) {
    setError(null);
    try {
      await createTask(input);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create task.");
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:underline">
        &larr; Back to tasks
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">New Task</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <TaskForm onSubmit={handleSubmit} submitLabel="Create Task" error={error} />
      </div>
    </div>
  );
}

export default function NewTaskPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <NewTaskContent />
    </ProtectedRoute>
  );
}
