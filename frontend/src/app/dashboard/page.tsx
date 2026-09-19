"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { Navbar } from "@/components/navbar";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorMessage } from "@/components/error-message";
import { TaskCard } from "@/components/task-card";
import { deleteTask, listTasks } from "@/lib/tasks-api";
import { ApiError } from "@/lib/api";
import type { Task, TaskStatus } from "@/types/task";

const FILTERS: { label: string; value: TaskStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
];

function DashboardContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadTasks = useCallback(async (status: TaskStatus | "ALL") => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listTasks(status === "ALL" ? {} : { status });
      setTasks(result.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // loadTasks sets loading/error state synchronously before its first
    // await (so switching filters shows a spinner immediately) — intentional,
    // not the accidental-cascading-render pattern this rule targets.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks(filter);
  }, [filter, loadTasks]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete task.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Your Tasks</h1>
        <Link
          href="/tasks/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          + New Task
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              filter === f.value
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error && <ErrorMessage message={error} />}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner label="Loading tasks…" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="text-slate-500">No tasks here yet.</p>
            <Link href="/tasks/new" className="mt-2 inline-block text-sm font-medium text-slate-900 hover:underline">
              Create your first task
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={handleDelete}
                isDeleting={deletingId === task.id}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <DashboardContent />
    </ProtectedRoute>
  );
}
