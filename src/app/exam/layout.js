import ExamHeader from "../../components/ExamHeader";
const AuthLayout = ({ children }) => {
  return (
    <div>
      <ExamHeader />
      {children}
    </div>
  );
};

export default AuthLayout;