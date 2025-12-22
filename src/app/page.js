"use client";

import Link from "next/link";
import MainHeader from "../components/MainHeader";

export default function HomePage() {
  const plans = [
    {
      id: "pack-1",
      title: "1 Model Test",
      subtitle: "Perfect for a quick level check",
      price: "₹500",
      tests: "1 full-length practice test",
      badge: "Starter",
      highlight: false,
    },
    {
      id: "pack-3",
      title: "Pack of 3 Model Tests",
      subtitle: "Build confidence with more practice",
      price: "₹1200",
      tests: "3 full-length practice tests",
      badge: "Most Popular",
      highlight: true,
    },
    {
      id: "pack-5",
      title: "Pack of 5 Model Tests",
      subtitle: "For serious exam preparation",
      price: "₹1750",
      tests: "5 full-length practice tests",
      badge: "Best Value",
      highlight: false,
    },
    {
      id: "pack-10",
      title: "Pack of 10 Model Tests",
      subtitle: "Maximum practice for top scores",
      price: "₹3000",
      tests: "10 full-length practice tests",
      badge: "Intensive",
      highlight: false,
    },
  ];

  return (
    <div id="top" className="min-h-screen w-full bg-gray-50 text-gray-800">


    <MainHeader />

      {/* MAIN CONTENT */}
      <main className="pb-16">
        {/* HERO - TEST YOUR GERMAN */}
        <section className="w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-[3fr,2fr] gap-10 items-center">
              {/* Left text card */}
              <div className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-blue-100 p-6 sm:p-8">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Test Your{" "}
                  <span className="text-blue-600">German Language Skills</span>
                </h1>
                <p className="text-sm sm:text-base mt-4 text-gray-600">
                  Take German practice tests online and track your level.
                  Designed for{" "}
                  <span className="font-medium">
                    exam preparation, university entry
                  </span>{" "}
                  and real-life communication.
                </p>

                <ul className="mt-5 space-y-2 text-xs sm:text-sm text-gray-700">
                  <li>• Practice Lesen, Hören & Schreiben in one platform</li>
                  <li>• Instant scoring with detailed result breakdown</li>
                  <li>• Model tests inspired by real exam format</li>
                </ul>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    href="/login"
                    className="inline-flex px-7 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base shadow-md"
                  >
                    Login to Start Test
                  </Link>
                  <Link
                    href="#pricing"
                    className="text-sm text-blue-700 hover:text-blue-800 underline underline-offset-4"
                  >
                    View Pricing
                  </Link>
                </div>
              </div>

              {/* Right visual card */}
              <div className="hidden md:flex">
                <div className="relative w-full h-64 lg:h-72">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 shadow-lg flex flex-col justify-between p-6 text-white">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-100">
                        Online Mock Tests
                      </div>
                      <div className="mt-2 text-2xl font-bold">
                        ÖSD / telc style German practice
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-[11px] uppercase tracking-wide text-blue-100">
                          Skills
                        </div>
                        <div className="font-semibold">
                          Lesen &amp; Hören
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-[11px] uppercase tracking-wide text-blue-100">
                          Levels
                        </div>
                        <div className="font-semibold">B1 / B2</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-[11px] uppercase tracking-wide text-blue-100">
                          Mode
                        </div>
                        <div className="font-semibold">Self-paced</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-blue-100">
                      Powered by Testyourgerman.com – practice from anywhere, any
                      time.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-12 sm:py-14 px-4 sm:px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Why Practice with Testyourgerman.com German Tests?
              </h2>
              <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                Our portal is designed to give you the same feeling as a real
                exam, with clean interface, strict timing and clear evaluation.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Real exam-style format",
                  desc: "Question types inspired by ÖSD / telc style modules to build real exam confidence.",
                },
                {
                  title: "Instant scoring & analysis",
                  desc: "Get your scores at the end of the test with per-section breakdown.",
                },
                {
                  title: "Practice at your own pace",
                  desc: "Attempt tests anytime, from anywhere, within your access period.",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-200 shadow-sm bg-gray-50/60 p-6 flex flex-col"
                >
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                    {idx + 1}
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 flex-1">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section className="py-14 sm:py-16 bg-gray-50 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-stretch">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 flex flex-col justify-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Testyourgerman.com – Your German Exam & Learning Partner
              </h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                Testyourgerman.com Global Service Pvt. Ltd. supports learners who aim
                for German language certification and smoother life in Germany.
                Our online portal helps you practice{" "}
                <span className="font-medium">
                  Lesen, Hören, Schreiben & Grammatik
                </span>{" "}
                with structured question sets, realistic timing and clear score
                reports.
              </p>
              <p className="mt-3 text-gray-600 text-sm sm:text-base">
                Use these tests to check your readiness before booking your
                official exam or before traveling for study and work.
              </p>
            </div>

            <div className="flex items-center">
              <div className="w-full rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-100 via-white to-blue-50 p-6 sm:p-8 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-blue-700 font-semibold">
                  Learning with Testyourgerman.com
                </div>
                <div className="mt-3 text-lg font-bold text-gray-900">
                  Structured online tests with instant feedback
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="rounded-xl bg-white/80 border border-blue-50 p-3">
                    <div className="font-semibold text-gray-900">
                      Self-paced access
                    </div>
                    <div className="mt-1 text-gray-600">
                      Attempt from laptop, tablet or mobile.
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-blue-50 p-3">
                    <div className="font-semibold text-gray-900">
                      Exam-style timing
                    </div>
                    <div className="mt-1 text-gray-600">
                      Built-in timer to simulate real test pressure.
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-blue-50 p-3">
                    <div className="font-semibold text-gray-900">
                      Reading & Listening
                    </div>
                    <div className="mt-1 text-gray-600">
                      Auto-checked answers for objective sections.
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/80 border border-blue-50 p-3">
                    <div className="font-semibold text-gray-900">
                      Writing tasks
                    </div>
                    <div className="mt-1 text-gray-600">
                      Realistic prompts to practice mails & texts.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

{/* PRICING SECTION */}
        <section id="pricing" className="py-16 px-4 sm:px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Pricing – Model Test Packs
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Choose a model test pack that fits your preparation plan. Each
              test includes Lesen, Hören &amp; Schreiben with automated answer
              checking.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-white shadow-sm transition hover:shadow-md ${
                  plan.highlight
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-gray-200"
                }`}
              >
                {plan.badge && (
                  <span
                    className={`absolute -top-3 left-4 inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${
                      plan.highlight
                        ? "bg-blue-600 text-white"
                        : "bg-gray-900 text-gray-100"
                    }`}
                  >
                    {plan.badge}
                  </span>
                )}

                {/* image style area */}
                <div className="h-24 w-full rounded-t-2xl bg-gradient-to-r from-blue-50 via-white to-blue-100 flex items-center justify-center">
                  <div className="flex items-baseline gap-1 text-blue-700">
                    <span className="text-3xl font-bold">
                      {plan.tests.split(" ")[0]}
                    </span>
                    <span className="text-[11px] uppercase tracking-wide">
                      tests
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {plan.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">{plan.subtitle}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-xs text-gray-500">one-time</span>
                  </div>

                  <p className="mt-2 text-sm text-gray-700">{plan.tests}</p>

                  <ul className="mt-3 space-y-1 text-xs text-gray-600">
                    <li>• Auto-checked Reading & Listening answers</li>
                    <li>• Writing tasks with clear prompts</li>
                    <li>• Detailed score report for each attempt</li>
                  </ul>

                  <div className="mt-5 pt-3 border-t border-gray-100">
                   <Link
                      href={`/buy?packId=${plan.id}`}
                      className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition ${
                        plan.highlight
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                    >
                      Purchase
                    </Link>

                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-gray-500 max-w-xl mx-auto">
            All prices are in INR and include online access to the Testyourgerman.com German
            test portal. Speaking (Sprechen) sessions can be added separately in
            future.
          </p>
        </section>

        {/* WHAT WE OFFER */}
        <section className="py-14 px-4 sm:px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                What You Can Practice
              </h2>
              <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                Each model test includes the main language skills you will face
                in real exams.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  title: "Reading (Lesen)",
                  desc: "Texts with questions checking understanding & detail.",
                },
                {
                  title: "Listening (Hören)",
                  desc: "Audio clips with questions like real exam tasks.",
                },
                {
                  title: "Writing (Schreiben)",
                  desc: "Email / text prompts to practice structured writing.",
                },
                {
                  title: "Grammar",
                  desc: "Focused tasks to strengthen sentence patterns.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col"
                >
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-gray-600 flex-1">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        

        {/* BOTTOM CTA */}
        <section className="py-14 sm:py-16 px-4 sm:px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-6 py-8 sm:px-10 sm:py-10 text-center shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Ready to challenge yourself?
              </h3>
              <p className="text-gray-700 mb-6 text-sm sm:text-base max-w-xl mx-auto">
                Create your account, log in and attempt your first German model
                test. See your current level and plan your next steps with more
                practice.
              </p>

              <Link
                href="/login"
                className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-md text-sm sm:text-base"
              >
                Login & Begin the Test
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
