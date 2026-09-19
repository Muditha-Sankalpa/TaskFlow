"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
          TaskFlow
        </Link>
        {user && (
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>
              Welcome, <span className="font-medium text-slate-900">{user.name}</span>
            </span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
