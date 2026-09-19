"use client";

import Link from "next/link";
import type { Task } from "@/types/task";

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-slate-100 text-slate-600",
};

const STATUS_STYLES: Record<Task["status"], string> = {
  PENDING: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<Task["status"], string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export function TaskCard({
  task,
  onDelete,
  isDeleting,
}: {
  task: Task;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-medium text-slate-900">{task.title}</h3>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{task.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
            >
              {task.priority} Priority
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status]}`}
            >
              {STATUS_LABELS[task.status]}
            </span>
            {task.dueDate && (
              <span className="text-xs text-slate-400">
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-3 text-sm">
          <Link href={`/tasks/${task.id}`} className="font-medium text-slate-600 hover:text-slate-900">
            Edit
          </Link>
          <button
            onClick={() => onDelete(task.id)}
            disabled={isDeleting}
            className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </li>
  );
}
