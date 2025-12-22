"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import api from "../../utils/axios";

// Razorpay script loader
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existingScript) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function BuyClient({ packId }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!packId) {
      alert("Invalid pack selected.");
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Razorpay script load karo
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert(
          "Razorpay SDK failed to load. Please check your internet connection."
        );
        setLoading(false);
        return;
      }

      // 2️⃣ Backend se order create karo
      const payload = {
        ...form,
        packId,
      };

      const orderRes = await api.post("/shop/buy-test/create-order", payload);

      const { orderId, amount, currency, keyId } = orderRes.data;

      // 3️⃣ Razorpay Checkout options
      const options = {
        key: keyId,
        amount,
        currency,
        name: "Testyourgerman.com - Exam Portal",
        description: `Purchase test package ${packId}`,
        order_id: orderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: "#2563eb",
        },
        handler: async function (response) {
          try {
            const verifyRes = await api.post(
              "/shop/buy-test/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                name: form.name,
                email: form.email,
                phone: form.phone,
                city: form.city,
                packId,
              }
            );

            console.log("Verify Response:", verifyRes.data);

            alert("Payment successful! Your test pack has been activated.");

            setForm({ name: "", phone: "", email: "", city: "" });
            router.push(`/thank-you?packId=${packId}`);
          } catch (err) {
            console.error(
              "Verify payment error:",
              err.response?.data || err.message
            );
            alert(
              err.response?.data?.message ||
                "Payment verified on Razorpay but failed on server. Please contact support."
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(
        "Create order error:",
        error.response?.data || error.message
      );
      alert(error.response?.data?.message || "Failed to start payment.");
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
          Selected Package:{" "}
          <span className="font-semibold text-blue-600">
            {packId || "Not selected"}
          </span>
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Full Name
            </label>
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
            <label className="text-sm font-medium text-slate-700">
              Mobile Number
            </label>
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
            <label className="text-sm font-medium text-slate-700">
              Email
            </label>
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
            <label className="text-sm font-medium text-slate-700">
              City
            </label>
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
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg py-2 text-sm font-medium"
          >
            {loading ? "Processing..." : "Pay & Activate"}
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-3 text-center">
          Payment is processed securely via Razorpay.
        </p>
      </div>
    </div>
  );
}
