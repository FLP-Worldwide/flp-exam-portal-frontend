"use client";

import { useSearchParams, useParams } from "next/navigation";
import ReadingTest from "../../../../../components/tests/ReadingTest";
import WritingTest from "../../../../../components/tests/WritingTest";
import AudioTest from "../../../../../components/tests/AudioTest";

export default function ModulePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const name = params.name; // from the dynamic route [.../module/[name]]
  const testId = searchParams.get("testId"); // from ?testId=...


  return (
    <div>
      {name === "reading" && <ReadingTest testId={testId} />}
      {name === "writing" && <WritingTest testId={testId} />}
      {name === "audio" && <AudioTest testId={testId} />}
    </div>
  );
}
