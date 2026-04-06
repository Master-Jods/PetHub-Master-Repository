import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "../supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load the user's profile row from public.profiles
  async function loadProfile(userId) {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, phone")
      .eq("id", userId)
      .single();

    if (error) {
      // If profile doesn't exist or RLS blocks it, keep profile null
      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
  }

  // Initialize session + keep state in sync on auth changes
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let alive = true;
    // Fallback in case Supabase auth/profile requests take too long.
    const initTimeout = setTimeout(() => {
      if (alive) setLoading(false);
    }, 5000);

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!alive) return;

        if (error) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        const sessionUser = data?.session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          // Do not block initial render on profile fetch.
          void loadProfile(sessionUser.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      } catch (_err) {
        if (!alive) return;
        setUser(null);
        setProfile(null);
        setLoading(false);
      } finally {
        clearTimeout(initTimeout);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;

      setUser(sessionUser);

      if (sessionUser) {
        void loadProfile(sessionUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      alive = false;
      clearTimeout(initTimeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,

      async login(email, password) {
        if (!supabase) {
          throw new Error("Supabase is not configured. Update your .env file.");
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw new Error(error.message);

        // Let the auth listener update state, but we can also eagerly load profile:
        const u = data?.user ?? null;
        if (u) await loadProfile(u.id);
      },

      async signup(payload) {
        if (!supabase) {
          throw new Error("Supabase is not configured. Update your .env file.");
        }

        const { firstName, lastName, phone, email, password } = payload;

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw new Error(error.message);

        const u = data?.user ?? null;

        // If email confirmation is OFF, session exists and we can write profile immediately.
        // If confirmation is ON, u may exist but session may be null-still okay to attempt
        // profile write only when we have a user id and RLS allows it.
        if (u?.id) {
          const { error: profErr } = await supabase.from("profiles").upsert({
            id: u.id,
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
          });

          if (profErr) throw new Error(profErr.message);

          await loadProfile(u.id);
        }
      },

      async refreshProfile() {
        if (!supabase) {
          throw new Error("Supabase is not configured. Update your .env file.");
        }

        if (!user?.id) return null;
        return loadProfile(user.id);
      },

      async updateProfile({ firstName, lastName, phone }) {
        if (!supabase) {
          throw new Error("Supabase is not configured. Update your .env file.");
        }
        if (!user?.id) {
          throw new Error("You must be signed in to update your profile.");
        }

        const updates = { id: user.id };
        if (typeof firstName === "string") updates.first_name = firstName.trim() || null;
        if (typeof lastName === "string") updates.last_name = lastName.trim() || null;
        if (typeof phone === "string") updates.phone = phone.trim() || null;

        const { error } = await supabase.from("profiles").upsert(updates);
        if (error) throw new Error(error.message);

        return loadProfile(user.id);
      },

      async updateEmail(email) {
        if (!supabase) {
          throw new Error("Supabase is not configured. Update your .env file.");
        }

        const nextEmail = String(email || "").trim();
        if (!nextEmail) throw new Error("Email is required.");

        const { data, error } = await supabase.auth.updateUser({ email: nextEmail });
        if (error) throw new Error(error.message);

        const updatedUser = data?.user ?? null;
        if (updatedUser) {
          setUser(updatedUser);
        } else {
          setUser((prev) => (prev ? { ...prev, email: nextEmail } : prev));
        }

        return updatedUser;
      },

      async changePassword({ currentPassword, newPassword }) {
        if (!supabase) {
          throw new Error("Supabase is not configured. Update your .env file.");
        }
        if (!user?.email) {
          throw new Error("Signed-in user email is unavailable.");
        }

        // Re-authenticate first so we can fail early on incorrect current password.
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (signInError) {
          throw new Error("Current password is incorrect.");
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw new Error(error.message);
      },

      async requestPasswordReset(email) {
        if (!supabase) {
          throw new Error("Supabase is not configured. Update your .env file.");
        }

        const nextEmail = String(email || "").trim();
        if (!nextEmail) {
          throw new Error("Email is required.");
        }

        const redirectTo =
          typeof window !== "undefined" && window.location?.origin
            ? `${window.location.origin}/reset-password`
            : undefined;

        const { error } = await supabase.auth.resetPasswordForEmail(nextEmail, {
          redirectTo,
        });
        if (error) throw new Error(error.message);
      },

      async resetPassword(newPassword) {
        if (!supabase) {
          throw new Error("Supabase is not configured. Update your .env file.");
        }

        const nextPassword = String(newPassword || "");
        if (nextPassword.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }

        const { error } = await supabase.auth.updateUser({ password: nextPassword });
        if (error) throw new Error(error.message);
      },

      async logout() {
        if (!supabase) {
          throw new Error("Supabase is not configured. Update your .env file.");
        }

        // Optimistic UI: clear auth state immediately on click.
        setUser(null);
        setProfile(null);

        // Local sign-out clears the stored session immediately.
        const { error } = await supabase.auth.signOut({ scope: "local" });
        if (error) throw new Error(error.message);
      },
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
