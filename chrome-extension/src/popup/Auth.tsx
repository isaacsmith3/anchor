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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          // Save session with access_token and refresh_token for storage
          await saveSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          onAuthSuccess();
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          // User is automatically signed in after signup
          await saveSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          onAuthSuccess();
        } else {
          // Email confirmation required
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await clearSession();
    setIsLogin(true);
    setEmail("");
    setPassword("");
    setError(null);
  };

  return (
    <div className="flex flex-col w-full min-w-[400px] min-h-full antialiased bg-gradient-to-b from-gray-50 to-white text-mono-black">
      <header className="px-6 py-7 text-center border-b shadow-sm bg-gradient-to-br from-mono-dark via-mono-black to-mono-dark border-mono-black text-black">
        <div className="text-2xl mb-1">⚓</div>
        <h1 className="text-xl font-semibold mb-0.5 tracking-tight">
          Anchor Blocker
        </h1>
      </header>

      <div className="flex-1 px-6 py-8">
        <div className="max-w-sm mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-mono-black text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-sm text-mono-gray-muted text-center mb-8">
            {isLogin
              ? "Sign in to sync your modes across devices"
              : "Sign up to get started with Anchor Blocker"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold mb-2 text-mono-black tracking-wide"
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
                className="w-full px-4 py-3 border-2 border-mono-gray-input rounded-lg text-sm bg-white text-mono-black transition-all focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blueLight placeholder:text-mono-gray-muted"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold mb-2 text-mono-black tracking-wide"
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
                className="w-full px-4 py-3 border-2 border-mono-gray-input rounded-lg text-sm bg-white text-mono-black transition-all focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blueLight placeholder:text-mono-gray-muted"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-5 py-3 border-2 border-accent-blue rounded-lg bg-white text-accent-blue font-semibold text-sm tracking-wide transition-all hover:bg-accent-blue hover:text-white hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setPassword("");
              }}
              className="text-sm text-accent-blue hover:text-accent-purple font-medium transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
