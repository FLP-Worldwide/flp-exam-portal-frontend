import React from 'react'
import Link from "next/link";
export default function MainHeader() {
  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
<div className="flex items-center gap-2">
  <img
    src="https://www.rjtravelagency.com/wp-content/uploads/2024/06/Germany-Flag.jpg"
    alt="Germany Flag"
    className="h-5 w-auto"
  />
  <span className="text-2xl font-bold text-black">
    Testyourgerman.com
  </span>
</div>


          {/* Menu */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <Link href="#pricing" className="text-gray-700 hover:text-blue-600">
              Pricing
            </Link>
            <Link href="/terms" className="hover:text-blue-600">Terms & Conditions</Link>
          <Link
            href="/free-test"
            className="inline-flex items-center px-4 py-2 rounded-full border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-600 hover:text-white transition-colors"
          >
            Test your german now!
          </Link>

          </nav>

          {/* Login Button */}
          <Link
            href="/login"
            className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm"
          >
            Login
          </Link>
        </div>
      </header>
  )
}
