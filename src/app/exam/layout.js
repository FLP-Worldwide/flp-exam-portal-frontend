"use client";
import ExamHeader from "../../components/ExamHeader";
import ProtectedRoute from "../../utils/ProtectedRoute";


const AuthLayout = ({ children }) => {
  return (
    <ProtectedRoute allowedRoles={['student']}>
    <div>
      <ExamHeader />
      {children}
    </div>
    </ProtectedRoute>
  );
};

export default AuthLayout;