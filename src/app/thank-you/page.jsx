import Link from "next/link";

export default function ThankYouPage({ searchParams }) {
  const packId = searchParams?.packId ?? null;

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-2xl p-6 text-center border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          🎉 Thank You for Your Request!
        </h1>

        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Your details have been submitted successfully.  
          Our support team will contact you shortly to complete the purchase.
          You can login your portal with your registered email and password{" "}
          <b>student123</b> to start your test.
        </p>

        {packId && (
          <p className="mt-3 text-sm text-blue-600 font-medium">
            Selected Package: <span className="font-semibold">{packId}</span>
          </p>
        )}

        <div className="mt-8">
          <Link
            href="/login"
            className="inline-flex w-full justify-center items-center px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm"
          >
            Login & Start Test
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Need help? Email us at testyourgermanskill@gmail.com
        </p>
      </div>
    </div>
  );
}
