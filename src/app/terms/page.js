"use client";
import Link from "next/link";
import MainHeader from "../../components/MainHeader";
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
        
    <MainHeader />
      {/* Header */}
      <header className="w-full bg-gradient-to-r from-blue-600 to-blue-700 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-bold text-white">Terms & Conditions</h1>
          <p className="text-blue-100 mt-2">
            FLP Online telc® Preparation Portal – User Agreement
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12 leading-relaxed space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900">1. Introduction</h2>
          <p className="mt-2 text-gray-700">
            By accessing and using the FLP telc® Exam Preparation Portal (“the Portal”),
            users agree to the following Terms & Conditions. The Portal is owned and operated
            by <strong>FLP Global Service Private Limited</strong>.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">2. Nature of the Program</h2>
          <p className="mt-2 text-gray-700">
            The Portal provides digital practice materials—<strong>lesen, hören, schreiben,
            sprachbausteine</strong>—designed to help learners prepare for telc®-style exams.
            FLP is not affiliated with telc GmbH, and the modules contain original,
            FLP-created content inspired by telc exam format but not taken from copyrighted sources.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">3. Access & Usage</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-700 space-y-1">
            <li>Purchased modules grant individual access to the buyer only.</li>
            <li>Content may not be shared, copied, downloaded, recorded, or redistributed.</li>
            <li>Access duration is <strong>90 days from purchase</strong> unless stated otherwise.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">4. Payment & Refunds</h2>
          <ul className="list-disc ml-6 mt-2 text-gray-700 space-y-1">
            <li>Payments are non-refundable once access is granted.</li>
            <li>
              Refunds are only possible in case of technical failure that FLP cannot resolve
              within <strong>48 hours</strong>.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">5. User Responsibilities</h2>
          <p className="mt-2 text-gray-700">Users agree to:</p>
          <ul className="list-disc ml-6 mt-2 text-gray-700 space-y-1">
            <li>Use the Portal for personal exam preparation only.</li>
            <li>Keep their login credentials confidential.</li>
            <li>Respect FLP’s intellectual property and refrain from unauthorized distribution.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">6. Technical Requirements</h2>
          <p className="mt-2 text-gray-700">
            Users should ensure stable internet for <strong>hören audio tasks</strong>,
            and a modern browser for best performance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">7. Limitation of Liability</h2>
          <p className="mt-2 text-gray-700">
            FLP does not guarantee exam results. The modules are practice tools, and actual
            exam success depends on learners’ effort and ability.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">8. Updates & Modifications</h2>
          <p className="mt-2 text-gray-700">
            FLP may update content, features, or access policies anytime to improve user
            experience without prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900">9. Support</h2>
          <p className="mt-2 text-gray-700">
            For queries or issues, contact:
            <br />
            <strong>Email:</strong> info@flpworldwide.com
          </p>
        </section>

        {/* CTA */}
        <div className="pt-6 text-center">
          <Link
            href="/"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg shadow"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
