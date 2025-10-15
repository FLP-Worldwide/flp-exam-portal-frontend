
'use client'
import { useState } from "react";
import { useRouter } from 'next/navigation'
export default function ExamHeader({   
  title = "Exam Portal",
  subtitle = "Midterm — Computer Science 101",
  logoSrc = "https://flpworldwide.com/wp-content/uploads/2024/12/FLP-Logo-e1739693871975-1024x344.png",
  onMenuToggle,
  userName = "Student Name",
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  function toggle() {
    setOpen(!open);
    if (onMenuToggle) onMenuToggle(!open);
  }

    // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('role')
    router.push('/')
  }

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start sm:items-center justify-between py-3 md:py-4 gap-4">
          {/* left: logo + title */}
          <div className="flex items-start sm:items-center gap-3">
            <button
              onClick={toggle}
              aria-label="Toggle menu"
              className="sm:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
            >
              {/* hamburger */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-30 h-10 rounded-md overflow-hidden flex items-center justify-center">
                <img src={logoSrc} alt="Logo" />
              </div>

              <div className="leading-tight">
                <div className="text-lg font-semibold text-gray-900">{title}</div>
                {subtitle ? (
                  <div className="text-xs text-gray-500 mt-0.5 hidden sm:block">{subtitle}</div>
                ) : null}
              </div>
            </div>
          </div>

          {/* middle: breadcrumb / context (hidden on very small screens) */}
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center">
            <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
              <ol className="flex items-center gap-2">
                <li>Home</li>
                <li className="text-gray-300">/</li>
                <li>Courses</li>
                <li className="text-gray-300">/</li>
                <li className="font-medium text-gray-800">CS101</li>
              </ol>
            </nav>
          </div>

          {/* right: actions + avatar */}
          <div className="flex items-center gap-3">
            {/* notifications */}
            <button
              className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>

            {/* quick toggle (example: timer) */}
            <button
              className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              aria-label="Exam timer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2 2" />
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 20a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <span>00:45:00</span>
            </button>

            {/* user */}
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-800">{userName}</div>
                <div className="text-xs text-gray-500">Student</div>
              </div>
              <button
                className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center"
                aria-label="Open profile"
              >
                {/* placeholder avatar initial */}
                <span className="text-sm font-semibold text-gray-700">{(userName || "U").charAt(0)}</span>
              </button>
            </div>
            <div>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>

        {/* optional mobile menu panel */}
        {open && (
          <div className="sm:hidden mt-2 pb-3 border-t border-gray-100">
            <div className="flex flex-col gap-1 px-1">
              <a className="px-3 py-2 rounded hover:bg-gray-50">Dashboard</a>
              <a className="px-3 py-2 rounded hover:bg-gray-50">My Exams</a>
              <a className="px-3 py-2 rounded hover:bg-gray-50">Results</a>
              <a className="px-3 py-2 rounded hover:bg-gray-50">Settings</a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
