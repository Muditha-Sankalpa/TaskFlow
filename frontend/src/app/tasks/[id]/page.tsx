"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Navbar } from "@/components/navbar";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ErrorMessage } from "@/components/error-message";
import { TaskForm, type TaskFormValues } from "@/components/task-form";
import { deleteTask, getTask, updateTask, type TaskInput } from "@/lib/tasks-api";
import { ApiError } from "@/lib/api";

function toDateInputValue(isoDate: string | null): string {
  if (!isoDate) return "";
  return isoDate.slice(0, 10);
}

function EditTaskContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<TaskFormValues | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTask(params.id)
      .then((task) => {
        if (cancelled) return;
        setInitialValues({
          title: task.title,
          description: task.description ?? "",
          status: task.status,
          priority: task.priority,
          dueDate: toDateInputValue(task.dueDate),
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "Failed to load task.");
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleSubmit(input: TaskInput) {
    setSubmitError(null);
    try {
      await updateTask(params.id, input);
      router.push("/dashboard");
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to update task.");
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteTask(params.id);
      router.push("/dashboard");
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to delete task.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-8">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:underline">
        &larr; Back to tasks
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Edit Task</h1>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {loadError ? (
          <ErrorMessage message={loadError} />
        ) : !initialValues ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner label="Loading task…" />
          </div>
        ) : (
          <>
            <TaskForm
              initialValues={initialValues}
              onSubmit={handleSubmit}
              submitLabel="Save Changes"
              error={submitError}
            />
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="mt-4 w-full rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Delete Task"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function EditTaskPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <EditTaskContent />
    </ProtectedRoute>
  );
}
