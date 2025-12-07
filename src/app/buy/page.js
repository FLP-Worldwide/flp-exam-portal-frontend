import { Suspense } from "react";
import BuyClient from "./BuyClient";

export default function BuyPage({ searchParams }) {
  const packId = searchParams?.packId ?? null; // URL se directly mil raha

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <BuyClient packId={packId} />
    </Suspense>
  );
}
