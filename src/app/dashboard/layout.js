"use client";
import ExamHeader from "../../components/ExamHeader";
import ProtectedRoute from "../../utils/ProtectedRoute";
import { ExamTimerProvider } from "../../components/ExamTimerContext";

const AuthLayout = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <ExamTimerProvider>
        <div>
          <ExamHeader />
          {children}
        </div>
      </ExamTimerProvider>
    </ProtectedRoute>
  );
};

export default AuthLayout;
