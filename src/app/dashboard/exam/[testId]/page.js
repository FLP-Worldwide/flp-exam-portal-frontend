"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../utils/axios";
import { useExamTimer } from "../../../../components/ExamTimerContext";

export default function StartExamModule() {
  const { testId } = useParams();
  const router = useRouter();

  // use context
  const { startTimer } = useExamTimer();

  const [testObj, setTestObj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const storageKey = testId ? `exam_end_${testId}` : null;

  useEffect(() => {
    if (!testId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/course-test/detail-instruction/${testId}`);
        // normalize response shapes
        const payload =
          (res && res.data && res.data.test) ||
          (res && res.data && res.data.data && res.data.data.test) ||
          res.data ||
          null;
        const final =
          (payload && payload.test) || (payload && payload.data) || payload || null;

        if (!final) {
          console.error("Unexpected test response shape:", res);
          setTestObj(null);
        } else {
          setTestObj(final);
        }
      } catch (err) {
        console.error("Error fetching test details:", err?.response || err);
        setTestObj(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [testId]);

  // helper: return seconds remaining if an active endTime is present
  const getStoredRemainingSeconds = () => {
    if (!storageKey) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const end = Number(raw);
      if (!end || isNaN(end)) return null;
      return Math.max(0, Math.ceil((end - Date.now()) / 1000));
    } catch (e) {
      return null;
    }
  };

  const formatTime = (secs) => {
    if (secs <= 0) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const hh = h > 0 ? String(h).padStart(2, "0") + ":" : "";
    return `${hh}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // The Start flow: ensure attemptsLeft > 0, call server to consume attempt, then set endTime via context and redirect.
  const startExamAndRedirect = async () => {
    if (!testObj) return alert("Test data not loaded.");
    if (!testId) return alert("Missing test id.");

    const attemptsInfo = testObj.attemptsInfo || null;
    const attemptsLeft = attemptsInfo?.attemptsLeft ?? null;
    const assignmentId = attemptsInfo?.assignmentId ?? null;

    // if server didn't return attemptsInfo, we behave conservatively and allow start — but it's better that server returns it.
    if (attemptsLeft !== null && attemptsLeft <= 0) {
      return alert("No attempts left for this test.");
    }

    // If there is already an active attempt (endTime stored), only allow Continue
    const existingSecs = getStoredRemainingSeconds();
    if (existingSecs && existingSecs > 0) {
      // If an active attempt exists, we shouldn't consume another attempt — just continue
      router.push(`/dashboard/exam/${testId}/start`);
      return;
    }

    // Now consume an attempt server-side
    setStarting(true);
    try {
      const payload = assignmentId ? { assignmentId } : {};
      const startRes = await api.post(`/course-test/attempt/${testId}`, payload);

      const respData =
        (startRes && startRes.data && startRes.data.data) ||
        (startRes && startRes.data) ||
        null;

      if (!respData) {
        console.warn("Start API returned unexpected shape, proceeding locally. Ensure server increments attempts.");
      }

      const newAttemptsInfo = respData?.attemptsInfo || null;
      if (newAttemptsInfo && typeof newAttemptsInfo.attemptsLeft === "number") {
        if (
          newAttemptsInfo.attemptsLeft <= 0 &&
          (newAttemptsInfo.attemptsGiven || 0) >= (newAttemptsInfo.maxAttempts || 0)
        ) {
          // server says no attempts left
          return toast("No attempts left (server). You cannot start the test.");
        }
      }

      // Determine durationSeconds (assumes duration values are in seconds)
      const durationSeconds = Number((respData && respData.duration) ?? testObj.duration ?? 0);

      if (!durationSeconds || durationSeconds <= 0) {
        return toast("Invalid test duration.");
      }

      // Use context to start timer (this will persist to localStorage and sync across tabs)
      const returnedAssignmentId =
        newAttemptsInfo?.assignmentId || respData?.assignmentId || assignmentId || null;

      const started = startTimer({
        testId,
        durationSeconds,
        assignmentId: returnedAssignmentId,
      });

      if (!started) {
        toast("Failed to initialize exam timer.");
        setStarting(false);
        return;
      }

      // navigate to the questions page
      router.push(`/dashboard/exam/${testId}/start`);
    } catch (err) {
      console.error("Failed to start exam:", err?.response || err);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message || "Failed to start exam.";
      if (status === 403 || status === 400) {
        toast(msg || "Cannot start exam: attempts exhausted or not allowed.");
      } else {
        toast("Failed to start exam. Please try again.");
      }
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: 40 }}>Loading...</div>;
  }

  if (!testObj) {
    return <div style={{ textAlign: "center", marginTop: 40 }}>No test data found</div>;
  }

  // Display values
  const testName = testObj.testName || testObj.title || "Untitled Test";
  const durationRaw = testObj.duration || 0;
  const price = testObj.price ?? 0;
  const totalSections = testObj.totalSections ?? testObj.total_sections ?? "--";
  const totalLevels = testObj.totalLevels ?? testObj.total_levels ?? "--";
  const attemptsInfo = testObj.attemptsInfo || null;
  const attemptsLeft = attemptsInfo?.attemptsLeft ?? null;

  // If there is an active in-progress endTime
  const existingSecs = getStoredRemainingSeconds();

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>{testName}</h1>
        <div style={{ fontSize: 14, color: "#666" }}>Duration: {Math.floor(durationRaw / 60)} mins</div>
      </div>

      <p style={{ fontSize: 16, color: "#444" }}>
        <strong>Price:</strong> ₹{price} <br />
        <strong>Sections:</strong> {totalSections} &nbsp; <strong>Levels:</strong> {totalLevels}
      </p>

      <div style={{ marginTop: 20, padding: 16, border: "1px solid #eee", borderRadius: 6 }}>
        <h3 style={{ marginTop: 0 }}>Instructions</h3>
        <ul>
          <li>Read each question carefully.</li>
          <li>You have {Math.floor(durationRaw / 60)} minutes to complete the test.</li>
          <li>Do not refresh the page while the test is running.</li>
          <li>The test will be automatically submitted when the timer ends.</li>
        </ul>
      </div>

      <div style={{ marginTop: 22, display: "flex", gap: 12, alignItems: "center" }}>
        {/* Show attempts status if returned by server */}
        {attemptsInfo ? (
          <div style={{ fontWeight: 600 }}>
            Attempts left: {attemptsLeft} / {attemptsInfo.maxAttempts}
          </div>
        ) : null}

        {/* If an attempt is already active in localStorage, allow only Continue */}
        {existingSecs && existingSecs > 0 ? (
          <>
            <div style={{ alignSelf: "center", fontWeight: 600 }}>
              Active attempt — Time remaining: {formatTime(existingSecs)}
            </div>
            <button
              onClick={() => router.push(`/dashboard/exam/${testId}/start`)}
              style={{
                backgroundColor: "#1677ff",
                color: "#fff",
                padding: "10px 18px",
                border: "none",
                borderRadius: 6,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Continue Exam
            </button>
          </>
        ) : (
          <>
            {/* If attemptsLeft is known and zero -> disable start */}
            <button
              onClick={startExamAndRedirect}
              disabled={starting || (attemptsLeft !== null && attemptsLeft <= 0)}
              style={{
                backgroundColor: attemptsLeft === 0 ? "#d9d9d9" : "#1677ff",
                color: attemptsLeft === 0 ? "#777" : "#fff",
                padding: "10px 18px",
                border: "none",
                borderRadius: 6,
                fontSize: 16,
                cursor: attemptsLeft === 0 ? "not-allowed" : "pointer",
              }}
            >
              {starting ? "Starting..." : "Start Exam"}
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              style={{
                backgroundColor: "#fff",
                color: "#333",
                padding: "10px 14px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Back to Dashboard
            </button>
          </>
        )}
      </div>

      {/* If attempts exhausted show message */}
      {attemptsLeft !== null && attemptsLeft <= 0 && (
        <div style={{ marginTop: 12, color: "#cf1322", fontWeight: 600 }}>
          You have used all attempts for this test.
        </div>
      )}
    </div>
  );
}
