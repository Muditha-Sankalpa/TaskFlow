import { request, setAccessToken } from "./api";
import type { User } from "@/types/task";

interface AuthResponse {
  user: User;
  accessToken: string;
}

export async function registerRequest(input: {
  email: string;
  name: string;
  password: string;
}): Promise<User> {
  const data = await request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
    skipAuthRetry: true,
  });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function loginRequest(input: {
  email: string;
  password: string;
}): Promise<User> {
  const data = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
    skipAuthRetry: true,
  });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function refreshSessionRequest(): Promise<boolean> {
  try {
    const data = await request<{ accessToken: string }>("/auth/refresh", {
      method: "POST",
      skipAuthRetry: true,
    });
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export async function logoutRequest(): Promise<void> {
  try {
    await request("/auth/logout", { method: "POST", skipAuthRetry: true });
  } finally {
    setAccessToken(null);
  }
}

export async function meRequest(): Promise<User> {
  return request<User>("/users/me");
}
