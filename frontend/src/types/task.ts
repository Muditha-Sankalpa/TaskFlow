export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
