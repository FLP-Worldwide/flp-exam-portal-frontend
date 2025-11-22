'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../utils/axios';
import { useExamTimer } from "../components/ExamTimerContext";

export default function TestSubmitBtn() {
  const { testId } = useParams();
  const router = useRouter();
  const { remainingSeconds, activeTestId, stopTimer } = useExamTimer();

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
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

    // block if timer over or wrong test
    if (!activeTestId || activeTestId !== testId || remainingSeconds <= 0) {
      setError('Exam time has ended. You can no longer submit this test.');
      alert('Exam time has ended. You can no longer submit this test.');
      return;
    }

    if (!confirm('Are you sure you want to submit your final answers?')) return;

    setSubmitting(true);
    setError(null);

    try {
      // 1) reading answers
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

      // 2) writing answers
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

      // 3) audio answers
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
          // support boolean + "true"/"false" + "richtig"
          answer: val === true || val === "true" || val === "richtig",
        }));
      } catch (e) {
        console.warn("Failed to extract audio answers:", e);
      }

      const startedAt = localStorage.getItem(`writing_${testId}_startedAt`);
      const secondsLeft = Number(localStorage.getItem(`writing_${testId}_secondsLeft`) || 0);
      const assignmentId = localStorage.getItem(`exam_assignment_${testId}`) || null;

      let completedTabs = [];
      try {
        const rawCompleted = localStorage.getItem(`exam_completed_${testId}`);
        completedTabs = rawCompleted ? JSON.parse(rawCompleted) : [];
      } catch (e) {
        completedTabs = [];
      }

      const nowIso = new Date().toISOString();

      const payload = {
        testId,
        assignmentId,
        reading,
        writing: {
          answers: writingAnswers,
          startedAt: startedAt || null,
          secondsLeft: secondsLeft || 0,
          submittedAt: nowIso,
        },
        audio: audioAnswers,
        completedTabs,
        submittedAt: nowIso,
      };

      console.log('Final Submit Payload:', payload);

      const endpoint = `/course-test/course-submit/`;
      const res = await api.post(endpoint, payload);

      const success =
        res?.status === 200 ||
        (res?.data && (res.data.success === true || res.data.status === 'success'));
      const respData = res?.data ?? {};

      const resultInfo = {
        message: respData.message ?? 'Submission complete',
        data: respData.data ?? respData.result ?? respData,
        score:
          respData.data?.score ??
          respData.score ??
          respData.data?.marks ??
          respData.marks ??
          null,
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

  // ---------- Result Modal UI ----------
  if (result) {
    const { message, score, passed, data } = result;

    const totalQuestions = data?.totalQuestions ?? null;
    const totalMarks = data?.totalMarks ?? null;
    const earnedMarks = data?.earnedMarks ?? null;
    const status = data?.status ?? 'completed';

    const perModule = data?.perModuleSummary || {};
    const audioSummary = data?.audio || null;

    const percent =
      totalMarks && earnedMarks !== null && earnedMarks !== undefined
        ? Math.round((earnedMarks / totalMarks) * 100)
        : null;

    const moduleOrder = ['reading', 'audio', 'writing'];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Test submitted
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                status === 'completed'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {status === 'completed' ? 'Completed' : status}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-4">{message}</p>

          {/* Overall stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Total questions
              </div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {totalQuestions ?? '--'}
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Total marks
              </div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {totalMarks ?? '--'}
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Earned marks
              </div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {earnedMarks ?? '--'}
              </div>
              {percent !== null && (
                <div className="text-xs text-gray-500">
                  {percent}% overall
                </div>
              )}
            </div>
          </div>

          {/* Pass / fail if available */}
          {typeof passed === 'boolean' && (
            <div
              className={`mb-3 rounded-lg px-3 py-2 text-sm font-medium ${
                passed
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {passed ? 'You passed this test.' : 'You did not pass this test.'}
            </div>
          )}

          {/* Per-module breakdown */}
          <div className="mb-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Module breakdown
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {moduleOrder.map((key) => {
                const mod = perModule[key] || {};
                const points = mod.points ?? 0;
                const maxPoints = mod.maxPoints ?? 0;
                const p =
                  maxPoints > 0
                    ? Math.round((points / maxPoints) * 100)
                    : 0;

                const label =
                  key === 'reading'
                    ? 'Reading'
                    : key === 'audio'
                    ? 'Listening'
                    : 'Writing';

                return (
                  <div
                    key={key}
                    className="rounded-lg border border-gray-100 bg-white px-3 py-2"
                  >
                    <div className="text-xs font-medium text-gray-700">
                      {label}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {points} / {maxPoints}
                    </div>
                    <div className="text-[11px] text-gray-500">{p}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional extra audio details (questions/points) */}
          

          {/* Footer buttons */}
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setResult(null)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
            >
              Go to dashboard
            </button>
            <button
              onClick={() => router.push(`/dashboard/result/${testId}`)}
              className="px-4 py-2 rounded-lg bg-green-600 text-sm font-medium text-white hover:bg-blue-700"
            >
              View detaild score
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Floating submit button + error banners ----------
  const timeOver =
    !activeTestId || activeTestId !== testId || remainingSeconds <= 0;

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
            <div className="text-sm">
              Exam time has ended. Submission is disabled.
            </div>
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
