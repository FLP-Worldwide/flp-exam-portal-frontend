"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../utils/axios";

export default function BuyPage() {
  const searchParams = useSearchParams();
  const packId = searchParams.get("packId");  // <-- Received package ID
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
  });
  const [loading, setLoading] = useState(true);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
        const payload = {
            ...form,
            packId,
        };

        const response = await api.post("/shop/buy-test", payload);   // <--- POST to API

        console.log("Buy Response:", response.data);

        alert("Vielen Dank! Unser Team wird sich bald mit Ihnen in Verbindung setzen."); // German optional
        setForm({ name: "", phone: "",email:"", city: "" });

        router.push(`/thank-you?packId=${packId}`);
        } catch (error) {
        console.error("Buy API Error:", error.response?.data || error.message);
        alert(error.response?.data?.message || "Failed to submit request");
        } finally {
        setLoading(false);
        }
    };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center px-4 py-6">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-6 border border-slate-200">

        <Link href="/" className="text-xs text-slate-600 hover:text-blue-600">
          ← Back to Home
        </Link>

        <h1 className="text-xl font-bold text-slate-900 mt-3 mb-1">
          Purchase Test Package
        </h1>
        <p className="text-sm text-slate-600 mb-4">
          Selected Package: <span className="font-semibold text-blue-600">{packId}</span>
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Mobile Number</label>
            <input
              type="tel"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email address"
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">City</label>
            <input
              type="text"
              name="city"
              required
              value={form.city}
              onChange={handleChange}
              placeholder="Enter your city"
              className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium"
          >
            Submit & Continue
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-3 text-center">
          We will call you or send payment link within a few minutes.
        </p>
      </div>
    </div>
  );
}
