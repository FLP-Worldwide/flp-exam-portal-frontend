'use client';
import { useState } from "react";
import api from "../utils/axios";
import { useRouter } from "next/navigation";
import LoaderComp from "../components/shared/LoaderComp";

const loginUser = async (email, password) => {
  try {
    const response = await api.post("/auth/login", {
      email,
      password,
    });
    return response.data; // should contain token and user info
  } catch (error) {
    console.error("Login API Error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Login failed" };
  }
};

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginUser(email, password);

      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("role", res.data.role);

      const role = res.data.role;
      if (role === "student") router.push("/dashboard");
      else if (role === "teacher") router.push("/admin");
      else if (role === "admin") router.push("/admin");
      else router.push("/");
    } catch (err) {
      setError(err.message || "Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      {/* Global loader overlay */}
      {loading && <LoaderComp />}

      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sm:p-8">
          {/* Logo + title */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-2">
            <img
              src="https://www.rjtravelagency.com/wp-content/uploads/2024/06/Germany-Flag.jpg"
              alt="Germany Flag"
              className="h-5 w-auto"
            />
            <span className="text-2xl font-bold text-black">
              Testyourgerman.com
            </span>
          </div>
            <h3 className="mt-4 text-md sm:text-md font-bold text-slate-900 text-center">
              Login to your exam portal
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 text-center max-w-md">
              Use the login credentials shared with you by Testyourgerman.com to start
              your German practice tests.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/80 focus:border-blue-600 text-sm bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/80 focus:border-blue-600 text-sm bg-white"
                required
              />
            </div>

            {error && (
              <p className="text-red-600 text-xs sm:text-sm mt-1">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full justify-center items-center px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Footer actions */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex justify-center items-center px-4 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              ← Back to homepage
            </button>

            <p className="text-[11px] sm:text-xs text-slate-500 text-right">
              Need help? Contact{" "}
              <a
                href="mailto:testyourgermanskill@gmail.com"
                className="text-blue-600 hover:underline"
              >
                testyourgermanskill@gmail.com
              </a>
            </p>
          </div>
        </div>

        {/* Small bottom note (optional) */}
        <p className="mt-4 text-center text-[11px] text-slate-500">
          This portal is for registered Testyourgerman.com German learners. For new access,
          please contact the Testyourgerman.com team.
        </p>
      </div>
    </div>
  );
}
