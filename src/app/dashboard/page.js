"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import {
  BarChartOutlined,
  CheckCircleOutlined,
  BookOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import api from "../../utils/axios";
import { useExamTimer } from "../../components/ExamTimerContext";

// Razorpay script loader (plain JS)
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

// Plans
const plans = [
  {
    id: "pack-1",
    title: "1 Model Test",
    subtitle: "Perfect for a quick level check",
    price: "₹500",
    tests: "1 full-length practice test",
    badge: "Starter",
    highlight: false,
  },
  {
    id: "pack-3",
    title: "Pack of 3 Model Tests",
    subtitle: "Build confidence with more practice",
    price: "₹1200",
    tests: "3 full-length practice tests",
    badge: "Most Popular",
    highlight: true,
  },
  {
    id: "pack-5",
    title: "Pack of 5 Model Tests",
    subtitle: "For serious exam preparation",
    price: "₹1750",
    tests: "5 full-length practice tests",
    badge: "Best Value",
    highlight: false,
  },
  {
    id: "pack-10",
    title: "Pack of 10 Model Tests",
    subtitle: "Maximum practice for top scores",
    price: "₹3000",
    tests: "10 full-length practice tests",
    badge: "Intensive",
    highlight: false,
  },
];

export default function StudentDashboard() {
  const [tests, setTests] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // extra state for payment prompt
  const [showPlans, setShowPlans] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [selectedPackId, setSelectedPackId] = useState(null);

  const router = useRouter();
  const { activeTestId, remainingSeconds, formatted } = useExamTimer();

  const normalizeTests = (testsArray) => {
    return (testsArray || []).map((t) => ({
      ...t,
      _id: t._id || t.assignmentId || (t.test && t.test._id) || null,
      testName: t.test?.testName || t.testName || "Unbekannter Test",
      language: t.test?.language || "N/A",
      duration: t.test?.duration || t.duration || 0,
      price: t.test?.price || t.price || 0,
      rawTest: t.test || null,
    }));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/student/dashboard");

      const rawTests = res.data.tests || [];
      const normalized = normalizeTests(rawTests);

      setTests(normalized);
      setStudent(res.data.student || null);
    } catch (error) {
      console.error(error);
      message.error("Fehler beim Laden der Dashboard-Daten!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const langBadgeClasses = (lang) => {
    if (!lang) return "bg-slate-100 text-slate-700";
    switch (String(lang).toLowerCase()) {
      case "english":
        return "bg-blue-50 text-blue-700";
      case "german":
      case "deutsch":
        return "bg-purple-50 text-purple-700";
      case "hindi":
        return "bg-amber-50 text-amber-700";
      case "spanish":
        return "bg-orange-50 text-orange-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const statusBadgeClasses = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "completed")
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    if (s === "expired")
      return "bg-red-50 text-red-700 border border-red-200";
    if (s === "active")
      return "bg-blue-50 text-blue-700 border border-blue-200";
    return "bg-slate-50 text-slate-700 border border-slate-200";
  };

  const handleActionClick = (record) => {
    const testId = record.test?._id || record._id || record.testId;
    if (!testId) return message.error("Ungültige Test-ID!");

    if (activeTestId && String(activeTestId) === String(testId)) {
      router.push(`/dashboard/exam/${testId}/start`);
      return;
    }

    router.push(`/dashboard/exam/${testId}`);
  };

  const totalAssigned = tests.length;
  const totalCompleted = tests.filter((t) => t.status === "completed").length;
  const passingRatio = totalAssigned
    ? ((totalCompleted / totalAssigned) * 100).toFixed(0)
    : 0;

  // Razorpay payment for selected pack + phone
  const startPaymentForPack = async (packId, phone) => {
    if (!student) {
      message.error("Studentendaten nicht geladen.");
      return;
    }

    if (!phone || phone.trim().length < 8) {
      message.error("Bitte eine gültige Handynummer eingeben.");
      return;
    }

    setPaymentLoading(true);

    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        message.error("Razorpay SDK konnte nicht geladen werden.");
        setPaymentLoading(false);
        return;
      }

      const payload = {
        name: student.name,
        email: student.email,
        phone: phone.trim(),
        city: "", // dashboard se city nahi aa rahi, isliye blank
        packId,
      };

      // 1️⃣ Backend: create order
      const orderRes = await api.post("/shop/buy-test/create-order", payload);
      const { orderId, amount, currency, keyId } = orderRes.data;

      // 2️⃣ Razorpay Checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: "Model Test Package",
        description: "Purchase " + packId,
        order_id: orderId,
        prefill: {
          name: student.name,
          email: student.email,
          contact: phone.trim(),
        },
        theme: {
          color: "#2563eb",
        },
        handler: async function (response) {
          try {
            // 3️⃣ Backend: verify payment
            const verifyRes = await api.post("/shop/buy-test/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              name: student.name,
              email: student.email,
              phone: phone.trim(),
              city: "",
              packId,
            });

            console.log("Verify payment response:", verifyRes.data);
            message.success("Zahlung erfolgreich! Neue Tests wurden hinzugefügt.");
            setShowPlans(false);
            setSelectedPackId(null);
            fetchDashboardData();
          } catch (err) {
            console.error("Verify payment error:", err);
            message.error(
              (err &&
                err.response &&
                err.response.data &&
                err.response.data.message) ||
                "Zahlung wurde bei Razorpay erfasst, aber Server-Verifizierung ist fehlgeschlagen."
            );
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Create order error:", error);
      message.error(
        (error &&
          error.response &&
          error.response.data &&
          error.response.data.message) || "Fehler beim Starten der Zahlung."
      );
      setPaymentLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 md:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {activeTestId && remainingSeconds > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-red-50 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-amber-800">
                Eine Prüfung läuft derzeit — sie wird automatisch abgegeben,
                wenn die Zeit endet.
              </div>
              <div className="mt-1 text-xs text-amber-800/90">
                Verbleibende Zeit:{" "}
                <span className="font-mono font-semibold">{formatted}</span>
                {" • "}
                <button
                  onClick={() =>
                    router.push(`/dashboard/exam/${activeTestId}/start`)
                  }
                  className="underline underline-offset-2 font-medium"
                >
                  Prüfung fortsetzen
                </button>
              </div>
            </div>
            <button
              onClick={() =>
                router.push(`/dashboard/exam/${activeTestId}/start`)
              }
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <PlayCircleOutlined />
              Weiter
            </button>
          </div>
        )}

        {/* Header + Buy button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Willkommen zurück, {student?.name || "Student"} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Hier sehen Sie den Überblick über Ihre Prüfungen und Ihren
              Fortschritt.
            </p>
          </div>

          {totalAssigned > 0 && (
            <button
              onClick={() => {
                setShowPlans(true);
                setPhoneInput("");
                setSelectedPackId(null);
              }}
              disabled={paymentLoading}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:bg-emerald-300"
            >
              {paymentLoading ? "Zahlung wird vorbereitet…" : "Mehr Tests kaufen"}
            </button>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookOutlined />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Gesamtprüfungen
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {totalAssigned}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircleOutlined />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Abgeschlossen
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {totalCompleted}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <BarChartOutlined />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Erfolgsquote
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-slate-900">
                  {passingRatio}
                </span>
                <span className="text-xs text-slate-500">%</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
              <CalendarOutlined />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Konto erstellt
              </div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {student?.createdAt
                  ? new Date(student.createdAt).toLocaleDateString()
                  : "--"}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">
              Zugewiesene Prüfungen
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
            </div>
          ) : tests.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Keine Prüfungen zugewiesen.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Nr.
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Prüfung
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Zugewiesen
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ablaufdatum
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Aktion
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((record, index) => {
                    const testId = record.test?._id || record._id;
                    const isLive =
                      activeTestId &&
                      String(activeTestId) === String(testId);

                    return (
                      <tr
                        key={record._id || index}
                        className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900">
                                {record.testName}
                              </span>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${langBadgeClasses(
                                  record.language
                                )}`}
                              >
                                {record.language}
                              </span>
                              {isLive && (
                                <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200">
                                  LIVE
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusBadgeClasses(
                              record.status
                            )}`}
                          >
                            {record.status || "--"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {record.assignedAt
                            ? new Date(
                                record.assignedAt
                              ).toLocaleDateString()
                            : "--"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {record.expiryDate
                            ? new Date(
                                record.expiryDate
                              ).toLocaleDateString()
                            : "--"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {record.status === "completed" ? (
                            <button
                              onClick={() =>
                                router.push(`/dashboard/result/${testId}`)
                              }
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm bg-green-600 text-white hover:bg-green-700"
                            >
                              Ergebnis ansehen
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActionClick(record)}
                              disabled={record.status !== "active" && !isLive}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium shadow-sm ${
                                isLive
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50"
                              } ${
                                record.status !== "active" && !isLive
                                  ? "opacity-50 cursor-not-allowed hover:bg-white"
                                  : ""
                              }`}
                            >
                              <PlayCircleOutlined />
                              {isLive ? "Prüfung abgeben" : "Test starten"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment prompt overlay */}
      {showPlans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Weitere Testpakete kaufen
                </h3>
                <p className="text-xs text-slate-500">
                  Wählen Sie ein Paket aus und geben Sie Ihre Handynummer für den Zahlungslink an.
                </p>
              </div>
              <button
                onClick={() => !paymentLoading && setShowPlans(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Schließen ✕
              </button>
            </div>

            {/* Phone input */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Handynummer
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="z.B. 017612345678"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400">
                Wir verwenden Ihre Nummer für Zahlungsbestätigung oder Rückfragen.
              </p>
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const isSelected = selectedPackId === plan.id;
                return (
                  <button
                    key={plan.id}
                    disabled={paymentLoading}
                    onClick={() => {
                      if (!phoneInput || phoneInput.trim().length < 8) {
                        message.error("Bitte zuerst eine gültige Handynummer eingeben.");
                        return;
                      }
                      setSelectedPackId(plan.id);
                      startPaymentForPack(plan.id, phoneInput);
                    }}
                    className={`text-left rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                      plan.highlight
                        ? "border-emerald-500 bg-emerald-50/40"
                        : "border-slate-200 bg-slate-50/40"
                    } ${
                      isSelected ? "ring-2 ring-emerald-400" : ""
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {plan.title}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {plan.subtitle}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-slate-900">
                          {plan.price}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {plan.tests}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-[11px] inline-flex rounded-full px-2 py-0.5 font-medium bg-white text-slate-700 border border-slate-200">
                      {plan.badge}
                    </div>
                  </button>
                );
              })}
            </div>

            {paymentLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-blue-500" />
                Zahlung wird vorbereitet…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
