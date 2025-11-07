
'use client';
import {useState} from "react"
import api from "../utils/axios";
import { useRouter } from 'next/navigation'

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
   const router = useRouter()
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
    } finally {
      setLoading(false);
    }
  };

return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="https://flpworldwide.com/wp-content/uploads/2024/12/FLP-Logo-e1739693871975-1024x344.png"
            alt="App Logo"
            width={120}
            height={40}
          />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Login to your Exam portal
        </h2>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm"
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
