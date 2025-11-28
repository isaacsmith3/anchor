import React, { useState } from "react";
import { supabase, saveSession, clearSession } from "../lib/supabase";

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Color definitions (light mode for auth)
  const colors = {
    bg: "#ffffff",
    text: "#0f0f0f",
    textMuted: "#737373",
    border: "#e5e5e5",
    cardBg: "#fafafa",
    inputBorder: "#d4d4d4",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          await saveSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          onAuthSuccess();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          await saveSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          onAuthSuccess();
        } else {
          setError(
            "Please check your email to confirm your account before signing in."
          );
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minWidth: "400px",
        minHeight: "100%",
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "28px 24px",
          textAlign: "center",
          backgroundColor: "#0f0f0f",
          color: "#ffffff",
        }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            margin: 0,
          }}
        >
          ANCHOR
        </h1>
      </header>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: "32px 24px",
        }}
      >
        <div style={{ maxWidth: "320px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "8px",
              textAlign: "center",
              color: colors.text,
            }}
          >
            {isLogin ? "Welcome back" : "Create account"}
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: colors.textMuted,
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            {isLogin
              ? "Sign in to sync your modes across devices"
              : "Sign up to get started with Anchor"}
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: colors.text,
                }}
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `2px solid ${colors.inputBorder}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: colors.bg,
                  color: colors.text,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: colors.text,
                }}
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength={6}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: `2px solid ${colors.inputBorder}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  backgroundColor: colors.bg,
                  color: colors.text,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "14px 20px",
                border: `2px solid ${colors.text}`,
                borderRadius: "8px",
                backgroundColor: colors.text,
                color: colors.bg,
                fontWeight: 600,
                fontSize: "14px",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setPassword("");
              }}
              style={{
                background: "none",
                border: "none",
                fontSize: "14px",
                color: colors.textMuted,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <span style={{ color: colors.text, fontWeight: 600 }}>
                {isLogin ? "Sign up" : "Sign in"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
