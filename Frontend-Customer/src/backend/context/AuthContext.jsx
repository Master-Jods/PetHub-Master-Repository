import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "../supabaseClient";

const AuthContext = createContext(null);

function splitFullName(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };

  const parts = trimmed.split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
}

function buildDisplayName(profile, user) {
  const firstName = profile?.first_name?.trim() || "";
  const lastName = profile?.last_name?.trim() || "";
  const joined = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (joined) return joined;
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  if (user?.email) return user.email.split("@")[0];
  return "Pet Parent";
}

async function ensureCustomerProfile(authUser, overrides = {}) {
  if (!supabase || !authUser?.id) return null;

  const metadata = authUser.user_metadata || {};
  const existingProfile = overrides.existingProfile || null;
  const firstName =
    typeof overrides.first_name === "string"
      ? overrides.first_name.trim()
      : typeof overrides.firstName === "string"
        ? overrides.firstName.trim()
        : typeof existingProfile?.first_name === "string" && existingProfile.first_name.trim()
          ? existingProfile.first_name.trim()
        : typeof metadata.first_name === "string"
          ? metadata.first_name.trim()
          : "";
  const lastName =
    typeof overrides.last_name === "string"
      ? overrides.last_name.trim()
      : typeof overrides.lastName === "string"
        ? overrides.lastName.trim()
        : typeof existingProfile?.last_name === "string" && existingProfile.last_name.trim()
          ? existingProfile.last_name.trim()
        : typeof metadata.last_name === "string"
          ? metadata.last_name.trim()
          : "";
  const displayName =
    typeof overrides.display_name === "string"
      ? overrides.display_name.trim()
      : typeof overrides.displayName === "string"
        ? overrides.displayName.trim()
        : typeof existingProfile?.display_name === "string" && existingProfile.display_name.trim()
          ? existingProfile.display_name.trim()
        : [firstName, lastName].filter(Boolean).join(" ").trim() ||
          (typeof metadata.display_name === "string" ? metadata.display_name.trim() : "");
  const phone =
    typeof overrides.phone === "string"
      ? overrides.phone.trim()
      : typeof existingProfile?.phone === "string" && existingProfile.phone.trim()
        ? existingProfile.phone.trim()
      : typeof metadata.phone === "string"
        ? metadata.phone.trim()
        : "";

  const payload = {
    user_id: authUser.id,
    role: existingProfile?.role || "customer",
    email: authUser.email || existingProfile?.email || null,
    first_name: firstName || null,
    last_name: lastName || null,
    display_name: displayName || null,
    phone: phone || null,
  };

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
  if (error) throw new Error(error.message);

  return payload;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId, authUser = null) {
    if (!supabase || !userId) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, role, email, first_name, last_name, display_name, phone, username, address, city, bio, avatar_url")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      setProfile(null);
      return null;
    }

    const needsProfileRepair =
      Boolean(authUser?.id) &&
      (
        !data ||
        (!data.first_name && !data.last_name && !data.display_name) ||
        !data.phone
      );

    if (needsProfileRepair) {
      try {
        await ensureCustomerProfile(authUser, { existingProfile: data || null });
        const { data: retryData, error: retryError } = await supabase
          .from("profiles")
          .select("user_id, role, email, first_name, last_name, display_name, phone, username, address, city, bio, avatar_url")
          .eq("user_id", userId)
          .maybeSingle();

        if (!retryError && retryData) {
          const recoveredProfile = {
            ...retryData,
            id: retryData.user_id,
            role: retryData.role || "customer",
            display_name: retryData.display_name || buildDisplayName(retryData, authUser),
          };
          setProfile(recoveredProfile);
          return recoveredProfile;
        }
      } catch (_profileCreateError) {
        setProfile(null);
        return null;
      }
    }

    const nextProfile = data
      ? {
          ...data,
          id: data.user_id,
          role: data.role || "customer",
          display_name: data.display_name || buildDisplayName(data, authUser),
        }
      : null;

    setProfile(nextProfile);
    return nextProfile;
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let alive = true;
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
          void loadProfile(sessionUser.id, sessionUser);
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
        void loadProfile(sessionUser.id, sessionUser);
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

        const nextUser = data?.user ?? null;
        if (nextUser) {
          await ensureCustomerProfile(nextUser);
          await loadProfile(nextUser.id, nextUser);
        }
      },

      async signup(payload) {
        if (!supabase) {
          throw new Error("Supabase is not configured. Update your .env file.");
        }

        const { firstName, lastName, phone, email, password } = payload;

        const displayName = [firstName, lastName].filter(Boolean).join(" ").trim();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName?.trim() || "",
              last_name: lastName?.trim() || "",
              display_name: displayName || "",
              phone: phone?.trim() || "",
              role: "customer",
            },
          },
        });
        if (error) throw new Error(error.message);

        const nextUser = data?.user ?? null;
        if (!nextUser?.id) return;

        if (data.session) {
          await ensureCustomerProfile(nextUser, {
            firstName,
            lastName,
            displayName,
            phone,
          });
          await loadProfile(nextUser.id, nextUser);
        }
      },

      async refreshProfile() {
        if (!supabase) {
          throw new Error("Supabase is not configured. Update your .env file.");
        }

        if (!user?.id) return null;
        return loadProfile(user.id, user);
      },

      async updateProfile({ firstName, lastName, phone, username, address, city, bio, avatarUrl }) {
        if (!supabase) {
          throw new Error("Supabase is not configured. Update your .env file.");
        }
        if (!user?.id) {
          throw new Error("You must be signed in to update your profile.");
        }

        const nextFirstName = typeof firstName === "string" ? firstName.trim() : profile?.first_name || "";
        const nextLastName = typeof lastName === "string" ? lastName.trim() : profile?.last_name || "";
        const displayName = [nextFirstName, nextLastName].filter(Boolean).join(" ").trim();

        const updates = {
          user_id: user.id,
          role: profile?.role || "customer",
          email: user.email || profile?.email || null,
          first_name: nextFirstName || null,
          last_name: nextLastName || null,
          display_name: displayName || null,
        };

        if (typeof phone === "string") updates.phone = phone.trim() || null;
        if (typeof username === "string") updates.username = username.trim() || null;
        if (typeof address === "string") updates.address = address.trim() || null;
        if (typeof city === "string") updates.city = city.trim() || null;
        if (typeof bio === "string") updates.bio = bio.trim() || null;
        if (typeof avatarUrl === "string") updates.avatar_url = avatarUrl.trim() || null;

        const { error } = await supabase.from("profiles").upsert(updates, { onConflict: "user_id" });
        if (error) throw new Error(error.message);

        return loadProfile(user.id, user);
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

        if (user?.id) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ email: nextEmail })
            .eq("user_id", user.id);

          if (profileError) throw new Error(profileError.message);
          await loadProfile(user.id, updatedUser || user);
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

        setUser(null);
        setProfile(null);
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
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
