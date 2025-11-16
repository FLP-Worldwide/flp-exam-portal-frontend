'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../utils/axios'; // adjust path if needed
import { useExamTimer } from "../components/ExamTimerContext"; // ✅ import timer context

export default function TestSubmitBtn() {
  const { testId } = useParams();
  const router = useRouter();
  const { remainingSeconds, activeTestId, stopTimer } = useExamTimer(); // ⏱️ global timer

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
      `audio_${tid}`, 
      `exam_end_${tid}`,
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

    // ⛔ BLOCK if exam time is over or this test is not the active timed test
    if (!activeTestId || activeTestId !== testId || remainingSeconds <= 0) {
      setError('Exam time has ended. You can no longer submit this test.');
      alert('Exam time has ended. You can no longer submit this test.');
      return;
    }

    if (!confirm('Are you sure you want to submit your final answers?')) return;

    setSubmitting(true);
    setError(null);

    try {
      // 1) Read reading answers
      let readingAnswersRaw = {};
      try {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        readingAnswersRaw = raw ? JSON.parse(raw) : {};
      } catch (e) {
        console.warn('Reading answers parse error:', e);
        readingAnswersRaw = {};
      }

      const reading = {
        answers: readingAnswersRaw,
      };

      // 2) Build writing answers
      let writingAnswers = [];
      try {
        const examRaw = localStorage.getItem(`exam_answers_${testId}`);
        const examParsed = examRaw ? JSON.parse(examRaw) : {};
        if (examParsed && examParsed.writing && typeof examParsed.writing === 'object') {
          const writingObj = examParsed.writing;
          const chosen = writingObj.submittedTask || localStorage.getItem(`writing_submitted_${testId}`);
          if (chosen && writingObj.tasks && writingObj.tasks[chosen]) {
            const task = writingObj.tasks[chosen];
            const qid = task.qid || localStorage.getItem(`writing_qid_${testId}_${chosen}`);
            if (qid && task.draft) writingAnswers.push({ questionId: qid, answer: task.draft });
          } else {
            Object.keys(writingObj.tasks || {}).forEach((k) => {
              const t = writingObj.tasks[k];
              const qid = t.qid || localStorage.getItem(`writing_qid_${testId}_${k}`);
              if (qid && t.draft) writingAnswers.push({ questionId: qid, answer: t.draft });
            });
          }
        } else {
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

      let audioAnswers = [];

      try {
        const raw = localStorage.getItem(`exam_answers_${testId}`);
        const parsed = raw ? JSON.parse(raw) : {};
        const audioObj =
          parsed &&
          parsed.levels &&
          parsed.levels.audio &&
          typeof parsed.levels.audio === "object"
            ? parsed.levels.audio
            : {};

        audioAnswers = Object.entries(audioObj).map(([qid, val]) => ({
          questionId: qid,
          answer: val === "richtig" || val === true ? true : false,
        }));
      } catch (e) {
        console.warn("Failed to extract audio answers:", e);
      }

      const startedAt = localStorage.getItem(`writing_${testId}_startedAt`) || localStorage.getItem(`writing_${testId}_startedAt`);
      const secondsLeft = Number(localStorage.getItem(`writing_${testId}_secondsLeft`) || 0);
      const assignmentId = localStorage.getItem(`exam_assignment_${testId}`) || null;

      // 3) Completed tabs
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
        audio: audioAnswers, 
        completedTabs,
        submittedAt: new Date().toISOString(),
      };

      console.log('Final Submit Payload:', payload);

      // 5) POST to server
      const endpoint = `/course-test/course-submit/`;
      const res = await api.post(endpoint, payload);
      console.log(res,"=========");
      const success =
        res?.status === 200 ||
        (res?.data && (res.data.success === true || res.data.status === 'success'));
      const respData = res?.data ?? {};

      const resultInfo = {
        message: respData.message ?? 'Submission complete',
        data: respData.data ?? respData.result ?? respData,
        score: respData.data?.score ?? respData.score ?? respData.data?.marks ?? respData.marks ?? null,
        passed: respData.data?.passed ?? respData.passed ?? null,
      };

      if (success) {
        clearLocalStorageKeys(testId);
        try {
          localStorage.removeItem(`exam_answers_${testId}`);
          stopTimer();
          
        } catch {}
        setResult(resultInfo);
      } else {
        setError(resultInfo.message || 'Server rejected submission.');
        console.warn('Submission failed', res);
      }
    } catch (err) {
      console.error('❌ Final submission error:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Something went wrong during submission.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // If result modal
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

          {data ? (
            <pre
              className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto mb-4"
              style={{ maxHeight: 160 }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
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

  const timeOver = !activeTestId || activeTestId !== testId || remainingSeconds <= 0;

  return (
    <>
      {error && (
        <div className="fixed left-4 bottom-20 z-40">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded shadow">
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {timeOver && (
        <div className="fixed left-4 bottom-32 z-40">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-2 rounded shadow">
            <div className="text-sm">Exam time has ended. Submission is disabled.</div>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || timeOver}
        className={`bg-[#2563eb] text-white px-4 py-2 rounded-lg fixed bottom-5 right-5 shadow-md ${
          submitting || timeOver ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#1e4fd6]'
        }`}
      >
        {submitting ? 'Submitting…' : 'Final Submit'}
      </button>
    </>
  );
}
