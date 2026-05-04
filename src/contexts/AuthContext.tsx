import React, { createContext, useContext, useState } from "react";
import {
  SessionUser,
  getCurrentSession,
  login as doLogin,
  logout as doLogout,
  signup as doSignup,
} from "../lib/auth";

type AuthContextValue = {
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => getCurrentSession());

  const login = async (email: string, password: string) => {
    const session = await doLogin(email, password);
    setUser(session);
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const session = await doSignup(email, password, displayName);
    setUser(session);
  };

  const logout = () => {
    doLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
