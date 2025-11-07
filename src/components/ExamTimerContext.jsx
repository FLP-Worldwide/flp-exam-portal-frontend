"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

const ExamTimerContext = createContext(null);

const formatTime = (secs) => {
  if (!secs || secs <= 0) return "00:00:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

export function ExamTimerProvider({ children }) {
  const [activeTestId, setActiveTestId] = useState(null);
  const [endTime, setEndTime] = useState(null); // timestamp in ms
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const tickRef = useRef(null);

  // Utility localStorage keys
  const getEndKey = (testId) => (testId ? `exam_end_${testId}` : null);
  const ACTIVE_TEST_KEY = "exam_active_testId";

  // initialize from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTestId = localStorage.getItem(ACTIVE_TEST_KEY);
    if (savedTestId) {
      const endRaw = localStorage.getItem(getEndKey(savedTestId));
      const end = endRaw ? Number(endRaw) : null;
      if (end && !isNaN(end) && end > Date.now()) {
        setActiveTestId(savedTestId);
        setEndTime(end);
        setRemainingSeconds(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
      } else {
        // cleanup stale entries
        localStorage.removeItem(ACTIVE_TEST_KEY);
        if (endRaw) localStorage.removeItem(getEndKey(savedTestId));
      }
    }
  }, []);

  // tick interval to update remainingSeconds
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!endTime) {
      setRemainingSeconds(0);
      return;
    }

    const tick = () => {
      const secs = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemainingSeconds(secs);
      if (secs <= 0) {
        // auto stop when time's up
        stopTimer();
      }
    };

    tick(); // initial
    tickRef.current = setInterval(tick, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime]);

  // storage listener to sync across tabs/windows
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === ACTIVE_TEST_KEY) {
        const newTestId = e.newValue;
        if (!newTestId) {
          // cleared
          setActiveTestId(null);
          setEndTime(null);
          setRemainingSeconds(0);
          return;
        }
        const endRaw = localStorage.getItem(getEndKey(newTestId));
        const end = endRaw ? Number(endRaw) : null;
        if (end && !isNaN(end) && end > Date.now()) {
          setActiveTestId(newTestId);
          setEndTime(end);
          setRemainingSeconds(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
        } else {
          setActiveTestId(null);
          setEndTime(null);
          setRemainingSeconds(0);
        }
      }

      // if some other tab updated the specific exam_end_{id}, reflect it too
      if (e.key && e.key.startsWith("exam_end_")) {
        const id = e.key.replace("exam_end_", "");
        const savedActive = localStorage.getItem(ACTIVE_TEST_KEY);
        if (savedActive === id) {
          const end = e.newValue ? Number(e.newValue) : null;
          if (end && end > Date.now()) {
            setEndTime(end);
            setRemainingSeconds(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
            setActiveTestId(id);
          } else {
            setActiveTestId(null);
            setEndTime(null);
            setRemainingSeconds(0);
          }
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // startTimer: sets localStorage and internal state
  const startTimer = ({ testId, durationSeconds, assignmentId = null }) => {
    if (!testId || !durationSeconds || durationSeconds <= 0) return false;
    const end = Date.now() + durationSeconds * 1000;
    localStorage.setItem(getEndKey(testId), String(end));
    localStorage.setItem(ACTIVE_TEST_KEY, testId);
    if (assignmentId) localStorage.setItem(`exam_assignment_${testId}`, assignmentId);

    setActiveTestId(testId);
    setEndTime(end);
    setRemainingSeconds(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    return true;
  };

  const stopTimer = () => {
    if (activeTestId) {
      localStorage.removeItem(getEndKey(activeTestId));
      localStorage.removeItem(ACTIVE_TEST_KEY);
      // optionally keep assignment id for history
    }
    setActiveTestId(null);
    setEndTime(null);
    setRemainingSeconds(0);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const value = {
    activeTestId,
    endTime,
    remainingSeconds,
    formatted: formatTime(remainingSeconds),
    startTimer,
    stopTimer,
  };

  return <ExamTimerContext.Provider value={value}>{children}</ExamTimerContext.Provider>;
}

export function useExamTimer() {
  const ctx = useContext(ExamTimerContext);
  if (!ctx) throw new Error("useExamTimer must be used within ExamTimerProvider");
  return ctx;
}
