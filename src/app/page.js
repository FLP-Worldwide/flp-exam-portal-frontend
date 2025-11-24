"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="w-full bg-white text-gray-800">

      {/* HERO - TEST YOUR GERMAN */}
      <section className="w-full bg-gradient-to-br from-blue-50 to-white py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 leading-tight">
            Test Your <span className="text-blue-600">German Language Skills</span>
          </h1>
          <p className="text-lg mt-4 text-gray-600 max-w-2xl mx-auto">
            Take authentic German practice tests online and track your proficiency.
            Designed for ÖSD exam preparation, language improvement & real-world usage.
          </p>

          <Link
            href="/login"
            className="inline-block mt-10 px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-md"
          >
            Login to Start Test
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            "Real Exam Format",
            "Instant Result & Feedback",
            "Multiple Attempts Allowed",
          ].map((title, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-gray-200 shadow-sm bg-white p-6 text-center hover:shadow-md transition"
            >
              <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="py-16 bg-gray-50 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              FLP Worldwide – Your German Exam & Learning Partner
            </h2>
            <p className="text-gray-600 leading-relaxed">
              FLP Worldwide Global Service Pvt. Ltd. helps students prepare for
              German language certification and real-life German communication.
              Improve grammar, vocabulary, reading, writing, and listening skills
              with structured test formats & performance analysis.
            </p>
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </section>

      {/* WHAT WE OFFER */}
      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">What You Can Practice</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {["Reading", "Listening", "Writing", "Grammar"].map((item, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md text-center font-semibold"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-16 text-center px-6 bg-white">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to challenge yourself?</h3>
        <p className="text-gray-600 mb-6">Start your German skill test today.</p>

        <Link
          href="/login"
          className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md"
        >
          Login & Begin the Test
        </Link>
      </section>

    </div>
  );
}
