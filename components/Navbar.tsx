"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { LogOut, Sun, Moon } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  if (!user || pathname === "/login") {
    return null;
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  const linkClass = (path: string) =>
    `px-3 py-1.5 text-sm font-medium transition-colors border-b-2 ${
      isActive(path)
        ? "border-[var(--color-sandstone)] text-[var(--color-ink)] dark:text-white"
        : "border-transparent text-stone-500 hover:text-[var(--color-ink)] dark:text-stone-400 dark:hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-[var(--color-parchment)] dark:border-stone-800 dark:bg-[var(--color-night)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/resources" className="font-display text-[1.1rem] leading-none tracking-tight text-[var(--color-ink)] dark:text-[#E8E4DC]">
            Campus<em className="text-[var(--color-sandstone)]">Desk</em>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <Link href="/resources" className={linkClass("/resources")}>
              Rooms
            </Link>

            {user.role !== "admin" && (
              <Link href="/my-bookings" className={linkClass("/my-bookings")}>
                Bookings
              </Link>
            )}

            {user.role === "admin" && (
              <Link href="/admin" className={linkClass("/admin")}>
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:text-[var(--color-ink)] dark:text-stone-400 dark:hover:text-white transition-colors"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-2 border-l border-stone-200 pl-3 dark:border-stone-800">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[var(--color-ink)] dark:text-white leading-none">{user.name}</p>
              <p className="text-xs text-stone-500 mt-0.5">
                {user.role === "admin" ? "Admin" : "Student"}
              </p>
            </div>

            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-md text-stone-400 hover:text-[var(--color-clay)] transition-colors"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
