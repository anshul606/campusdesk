"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  authFetch: async () => new Response(),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("campusdesk_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("campusdesk_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const activeToken = token || localStorage.getItem("campusdesk_token");
    const headers = new Headers(options.headers || {});
    if (activeToken) {
      headers.set("Authorization", `Bearer ${activeToken}`);
    }
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      logout();
    }
    return response;
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("campusdesk_token");
    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Invalid session");
        }
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          logout();
        }
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
