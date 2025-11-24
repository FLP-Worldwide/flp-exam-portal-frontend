"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import ExamHeader from "../../components/ExamHeader";
import {
  BarChartOutlined,
  CheckCircleOutlined,
  BookOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import api from "../../utils/axios";
import { useExamTimer } from "../../components/ExamTimerContext";

export default function StudentDashboard() {
  const [tests, setTests] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { activeTestId, remainingSeconds, formatted } = useExamTimer();

  // --- helpers ---
  const normalizeTests = (testsArray) => {
    return (testsArray || []).map((t) => ({
      ...t,
      _id: t._id || t.assignmentId || (t.test && t.test._id) || null,
      testName: t.test?.testName || t.testName || "Unknown Test",
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
      message.error("Failed to load dashboard data!");
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
    if (!testId) return message.error("Invalid test ID");

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

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 md:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top running-exam banner */}
        {activeTestId && remainingSeconds > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-red-50 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-amber-800">
                An exam is currently running — it will auto-submit when the timer
                completes.
              </div>
              <div className="mt-1 text-xs text-amber-800/90">
                Time remaining:{" "}
                <span className="font-mono font-semibold">
                  {formatted}
                </span>
                {" • "}
                <button
                  onClick={() =>
                    router.push(`/dashboard/exam/${activeTestId}/start`)
                  }
                  className="underline underline-offset-2 font-medium"
                >
                  Click to continue exam
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
              Continue Exam
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Welcome back, {student?.name || "Student"} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Here&apos;s an overview of your exams and progress.
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookOutlined />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Total Tests Assigned
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
                Tests Completed
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
                Passing Ratio
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
                Account Created
              </div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {student?.createdAt
                  ? new Date(student.createdAt).toLocaleDateString()
                  : "--"}
              </div>
            </div>
          </div>
        </div>

        {/* Assigned tests table */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">
              Assigned Tests
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
            </div>
          ) : tests.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No tests assigned yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Test
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Assigned
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Expiry
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
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
                          <button
                            onClick={() => handleActionClick(record)}
                            disabled={
                              record.status !== "active" && !isLive
                            }
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
                            {isLive ? "Go to Submit Exam" : "Start Test"}
                          </button>
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
    </div>
  );
}
