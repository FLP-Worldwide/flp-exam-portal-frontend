"use client";
import React, { useEffect, useState } from "react";
import ExamHeader from "../../components/ExamHeader";
import ProtectedRoute from "../../utils/ProtectedRoute";
import { ExamTimerProvider } from "../../components/ExamTimerContext";
import api from "../../utils/axios";

const AuthLayout = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingStudent(true);
        const res = await api.get("/student/dashboard");
        if (!mounted) return;

        // assuming your /student/dashboard response shape: { student, tests, ... }
        setStudent(res.data?.student || null);
      } catch (err) {
        console.error("Failed to load student for header:", err?.response || err);
        if (mounted) setStudent(null);
      } finally {
        if (mounted) setLoadingStudent(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const userName = student?.name || "";

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <ExamTimerProvider>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <ExamHeader
            userName={userName}
            userRole="Student"
            title="Exam Portal"
            subtitle={
              loadingStudent
                ? "Loading your profile..."
                : "Classroom or Practice Test"
            }
          />
          <main className="flex-1">{children}</main>
        </div>
      </ExamTimerProvider>
    </ProtectedRoute>
  );
};

export default AuthLayout;
