"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useExamTimer } from "../components/ExamTimerContext";
import Link from "next/link";

export default function ExamHeader({
  title = "testyourgerman.com",
  subtitle = "Practice Exam Portal",
  logoSrc = "https://upload.wikimedia.org/wikipedia/en/thumb/b/ba/Flag_of_Germany.svg/330px-Flag_of_Germany.svg.png",
  onMenuToggle,
  userName,            // <- dynamic
  userRole = "Student" // <- optional
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { formatted, remainingSeconds, activeTestId } = useExamTimer();

  const displayName =
    userName && userName.trim().length > 0 ? userName : "Student";

  function toggle() {
    setOpen(!open);
    onMenuToggle?.(!open);
  }

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    router.push("/");
  };

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start sm:items-center justify-between py-3 md:py-4 gap-4">
          {/* left */}
          <div className="flex items-start sm:items-center gap-3">
            <button
              onClick={toggle}
              aria-label="Toggle menu"
              className="sm:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-20 h-10 rounded-md overflow-hidden flex items-center justify-center">
                <Link href="/dashboard">
                  <img src={logoSrc} alt="Logo" className="h-full w-auto cursor-pointer" />
                </Link>
              </div>

              <div className="leading-tight">
                <div className="text-lg font-semibold text-gray-900">{title}</div>
                {subtitle ? (
                  <div className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                    {subtitle}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* middle breadcrumb */}
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
            <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
              <ol className="flex items-center gap-2">
                <li>Dashboard</li>
                <li className="text-gray-300">/</li>
                <li>Exams</li>
              </ol>
            </nav>
          </div>

          {/* right */}
          <div className="flex items-center gap-3">
            {/* notifications */}
            <button
              className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"
                />
                <path
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.73 21a2 2 0 01-3.46 0"
                />
              </svg>
            </button>

            {/* exam timer */}
            {remainingSeconds > 0 ? (
              <button
                onClick={() => activeTestId && router.push(`/dashboard/exam/${activeTestId}/start`)}
                className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                aria-label="Exam timer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2 2" />
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 20a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <span className="font-mono font-medium text-gray-800">{formatted}</span>
              </button>
            ) : (
              <button
                disabled
                className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-100 text-sm text-gray-400 cursor-default"
                aria-label="Exam timer"
              >
                <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2 2" />
                  <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 20a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <span>00:00:00</span>
              </button>
            )}

            {/* user */}
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-800">{displayName}</div>
                <div className="text-xs text-gray-500">{userRole}</div>
              </div>
              <button
                className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center"
                aria-label="Open profile"
              >
                <span className="text-sm font-semibold text-gray-700">
                  {(displayName || "U").charAt(0)}
                </span>
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>

        {/* mobile menu */}
        {open && (
          <div className="sm:hidden mt-2 pb-3 border-t border-gray-100">
            <div className="flex flex-col gap-1 px-1 text-sm">
              <button className="px-3 py-2 rounded hover:bg-gray-50 text-left">
                Dashboard
              </button>
              <button className="px-3 py-2 rounded hover:bg-gray-50 text-left">
                My Exams
              </button>
              <button className="px-3 py-2 rounded hover:bg-gray-50 text-left">
                Results
              </button>
              <button className="px-3 py-2 rounded hover:bg-gray-50 text-left">
                Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
