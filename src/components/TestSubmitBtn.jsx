'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../utils/axios'; // adjust path if needed

export default function TestSubmitBtn() {
  const { testId } = useParams();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // server response summary
  const [error, setError] = useState(null);

  const clearLocalStorageKeys = (tid) => {
    const keysToClear = [
      `exam_answers_${tid}`,
      `exam_completed_${tid}`,
      `writing_${tid}_A`,
      `writing_${tid}_B`,
      `writing_${tid}_startedAt`,
      `writing_${tid}_secondsLeft`,
      `writing_submitted_${tid}`,
      `writing_qid_${tid}_A`,
      `writing_qid_${tid}_B`,
      `exam_assignment_${tid}`,
    ];
    keysToClear.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  };

  const handleSubmit = async () => {
    if (!testId) {
      alert('Missing test id.');
      return;
    }

    if (!confirm('Are you sure you want to submit your final answers?')) return;

    setSubmitting(true);
    setError(null);

    try {
      // 1) Read reading answers (may contain grouped levels object etc)
      let readingAnswersRaw = {};
      try {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        readingAnswersRaw = raw ? JSON.parse(raw) : {};
      } catch (e) {
        console.warn('Reading answers parse error:', e);
        readingAnswersRaw = {};
      }

      // reading payload: send the full object (server can interpret)
      // If your backend expects a flat map, you can transform here.
      const reading = {
        answers: readingAnswersRaw, // full object — includes levels or flat keys
      };

      // 2) Build writing answers from grouped writing object if present, else fallbacks
      let writingAnswers = [];
      try {
        const examRaw = localStorage.getItem(`exam_answers_${testId}`);
        const examParsed = examRaw ? JSON.parse(examRaw) : {};
        // if we stored grouped writing under exam_answers.{writing}
        if (examParsed && examParsed.writing && typeof examParsed.writing === 'object') {
          const writingObj = examParsed.writing;
          const chosen = writingObj.submittedTask || localStorage.getItem(`writing_submitted_${testId}`);
          if (chosen && writingObj.tasks && writingObj.tasks[chosen]) {
            const task = writingObj.tasks[chosen];
            const qid = task.qid || localStorage.getItem(`writing_qid_${testId}_${chosen}`);
            if (qid && task.draft) writingAnswers.push({ questionId: qid, answer: task.draft });
          } else {
            // fallback: include any saved task in writingObj.tasks
            Object.keys(writingObj.tasks || {}).forEach((k) => {
              const t = writingObj.tasks[k];
              const qid = t.qid || localStorage.getItem(`writing_qid_${testId}_${k}`);
              if (qid && t.draft) writingAnswers.push({ questionId: qid, answer: t.draft });
            });
          }
        } else {
          // old fallback using individual keys
          const draftA = localStorage.getItem(`writing_${testId}_A`) || '';
          const draftB = localStorage.getItem(`writing_${testId}_B`) || '';
          const submittedTask = localStorage.getItem(`writing_submitted_${testId}`);
          const qidA = localStorage.getItem(`writing_qid_${testId}_A`) || 'task_a';
          const qidB = localStorage.getItem(`writing_qid_${testId}_B`) || 'task_b';

          if (submittedTask === 'A' && draftA) writingAnswers.push({ questionId: qidA, answer: draftA });
          else if (submittedTask === 'B' && draftB) writingAnswers.push({ questionId: qidB, answer: draftB });
          else {
            if (draftA) writingAnswers.push({ questionId: qidA, answer: draftA });
            if (draftB) writingAnswers.push({ questionId: qidB, answer: draftB });
          }
        }
      } catch (e) {
        console.warn('Building writing answers failed:', e);
      }

      const startedAt = localStorage.getItem(`writing_${testId}_startedAt`) || localStorage.getItem(`writing_${testId}_startedAt`);
      const secondsLeft = Number(localStorage.getItem(`writing_${testId}_secondsLeft`) || 0);
      const assignmentId = localStorage.getItem(`exam_assignment_${testId}`) || null;

      // 3) Completed tabs (if any)
      let completedTabs = [];
      try {
        const rawCompleted = localStorage.getItem(`exam_completed_${testId}`);
        completedTabs = rawCompleted ? JSON.parse(rawCompleted) : [];
      } catch (e) {
        completedTabs = [];
      }

      // 4) Build payload
      const payload = {
        testId,
        assignmentId,
        reading,
        writing: {
          answers: writingAnswers,
          startedAt: startedAt || null,
          secondsLeft: secondsLeft || 0,
          submittedAt: new Date().toISOString(),
        },
        completedTabs,
        submittedAt: new Date().toISOString(),
      };

      console.log('Final Submit Payload:', payload);

      // 5) POST to server
      const endpoint = `/course-test/course-submit/`;
      const res = await api.post(endpoint, payload);

      // 6) Handle response
      // Normalize response data for UI: try common fields
      const success = res?.status === 200 || (res?.data && (res.data.success === true || res.data.status === 'success'));
      const respData = res?.data ?? {};

      // try to extract result info (score / passed / message)
      const resultInfo = {
        message: respData.message ?? 'Submission complete',
        data: respData.data ?? respData.result ?? respData,
        score: respData.data?.score ?? respData.score ?? respData.data?.marks ?? respData.marks ?? null,
        passed: respData.data?.passed ?? respData.passed ?? null,
      };

      // On success — clear storage and show modal with result
      if (success) {
        // Clear keys
        clearLocalStorageKeys(testId);

        // Also remove exam_answers_{testId} specifically (already in clearLocalStorageKeys)
        try {
          localStorage.removeItem(`exam_answers_${testId}`);
        } catch {}

        setResult(resultInfo);
      } else {
        // server returned non-200 or non-success payload
        setError(resultInfo.message || 'Server rejected submission.');
        console.warn('Submission failed', res);
      }
    } catch (err) {
      console.error('❌ Final submission error:', err);
      setError(err?.response?.data?.message || err?.message || 'Something went wrong during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  // If result is present, show a small overlay/modal with the score + button to go to dashboard
  if (result) {
    const { message, score, passed, data } = result;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white max-w-md w-full rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Test submitted</h2>
          <p className="text-sm text-gray-700 mb-4">{message}</p>

          {score !== null && score !== undefined ? (
            <div className="mb-4">
              <div className="text-3xl font-bold">{score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
          ) : null}

          {typeof passed === 'boolean' ? (
            <div className={`mb-4 font-semibold ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {passed ? 'You passed the test' : 'You did not pass the test'}
            </div>
          ) : null}

          {/* show any extra server data if available */}
          {data ? (
            <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto mb-4" style={{ maxHeight: 160 }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                // go to dashboard (adjust route as needed)
                router.push('/dashboard');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If error present, show small inline message (keeps button available)
  return (
    <>
      {error && (
        <div className="fixed left-4 bottom-20 z-40">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded shadow">
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-[#2563eb] hover:bg-[#1e4fd6] text-white px-4 py-2 rounded-lg fixed bottom-5 right-5 shadow-md"
      >
        {submitting ? 'Submitting…' : 'Final Submit'}
      </button>
    </>
  );
}
