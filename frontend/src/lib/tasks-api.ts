import { request } from "./api";
import type { Task, TaskListResponse, TaskPriority, TaskStatus } from "@/types/task";

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export async function listTasks(filter: TaskFilter = {}): Promise<TaskListResponse> {
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.priority) params.set("priority", filter.priority);
  const qs = params.toString();
  return request<TaskListResponse>(`/tasks${qs ? `?${qs}` : ""}`);
}

export async function getTask(id: string): Promise<Task> {
  return request<Task>(`/tasks/${id}`);
}

export async function createTask(input: TaskInput): Promise<Task> {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteTask(id: string): Promise<void> {
  await request<void>(`/tasks/${id}`, { method: "DELETE" });
}
