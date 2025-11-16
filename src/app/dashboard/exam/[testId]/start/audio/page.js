'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '../../../../../../utils/axios'
import Player from '../../../../../../components/shared/Player'
import TestSubmitBtn from "../../../../../../components/TestSubmitBtn";
import { useRouter } from "next/navigation";
export default function ListeningTest() {
  const { testId } = useParams()
const router = useRouter();
  const [loading, setLoading] = useState(true)
  const [media, setMedia] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [testMeta, setTestMeta] = useState(null)

  // ---------- FETCH FROM API ----------
  useEffect(() => {
    if (!testId) return

    let cancelled = false

    const fetchServer = async () => {
      setLoading(true)
      try {
        const res = await api.get(
          `/course-test/details/${encodeURIComponent(testId)}?module=audio`
        )

        const raw = res?.data?.data || res?.data || null
        const payload =
          raw && typeof raw === 'object'
            ? raw
            : null

        if (!payload) {
          console.warn('Audio: no payload found in server response', res)
          if (!cancelled) {
            setMedia(null)
            setQuestions([])
            setTestMeta(null)
          }
          return
        }

        // meta (test name, language, duration, etc.)
        if (!cancelled) {
          setTestMeta({
            testName: payload.testName || 'Hörverstehen – Prüfung',
            language: payload.language || 'German',
            duration: payload.duration || null,
          })
        }

        const modules = payload.modules || {}
        let foundContent = null

        // Find the audio module (e.g. "level_level_1" with module: "audio")
        Object.values(modules).forEach((m) => {
          if (foundContent || !m) return
          const modName = (m.module || '').toString().toLowerCase()
          if (modName === 'audio') {
            foundContent = m.content ?? m
          }
        })

        // fallback if content might be directly on payload
        if (!foundContent && payload.content) {
          foundContent = payload.content
        }

        if (!foundContent) {
          console.warn('Audio: no module content found')
          if (!cancelled) {
            setMedia(null)
            setQuestions([])
          }
          return
        }

        const content = foundContent

        const mediaFromServer = content.media || null

        const questionsRaw = Array.isArray(content.questions)
          ? content.questions
          : []

        const normalizedQuestions = questionsRaw.map((q, idx) => ({
          id: q.questionId || q._id || q.id || idx + 1,
          index: idx + 1,
          text: q.text || q.question || '',
        }))

        if (!cancelled) {
          setMedia(mediaFromServer)
          setQuestions(normalizedQuestions)
        }
      } catch (err) {
        console.error('Failed to fetch audio module:', err)
        if (!cancelled) {
          setMedia(null)
          setQuestions([])
          setTestMeta(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchServer()

    return () => {
      cancelled = true
    }
  }, [testId])

  // ---------- ANSWERS ----------
  const handleAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

    const levelKey = "audio";
    const handleSubmit = () => {
      const payload = {};

      questions.forEach((q) => {
        if (answers[q.id] !== undefined && answers[q.id] !== null) {
          payload[q.id] = answers[q.id];
        }
      });

      if (testId) {
        try {
          const raw = localStorage.getItem(`exam_answers_${testId}`);
          const parsed = raw ? JSON.parse(raw) : {};

          const levels =
            parsed && parsed.levels && typeof parsed.levels === "object"
              ? { ...parsed.levels }
              : {};

          levels[levelKey] = { ...(levels[levelKey] || {}), ...payload };

          const merged = { ...(parsed || {}), levels };

          localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged));
          alert("Antworten gespeichert!");
        } catch (e) {
          console.warn("Failed to persist submission:", e);
          alert("Fehler beim Speichern!");
        }
      }
    };

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow px-6 py-4 flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-600">Lade Hörverstehen-Aufgabe…</p>
        </div>
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow px-6 py-5 text-center max-w-md">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Keine Hörverstehen-Aufgaben gefunden
          </h2>
          <p className="text-sm text-slate-500">
            Für dieses Prüfungsteil wurde kein Audio-Modul konfiguriert.
          </p>
        </div>
      </div>
    )
  }

  const title = 'Hörverstehen – Teil 3'
  const subTitle =
    'Sie hören jetzt mehrere kurze Texte. Entscheiden Sie beim Hören, ob die Aussagen richtig oder falsch sind. Sie hören die Texte nur einmal.'

  return (
    <div className="min-h-screen bg-slate-50 px-3 sm:px-4 py-4 sm:py-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-5">
        {/* HEADER CARD */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-md border border-slate-900/40">
          <div className="px-4 sm:px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                {title}
                {testMeta?.language && (
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-white/10">
                    {testMeta.language}
                  </span>
                )}
              </h2>
              {testMeta?.testName && (
                <p className="text-xs sm:text-sm text-slate-200">
                  {testMeta.testName}
                </p>
              )}
              {testMeta?.duration ? (
                <p className="text-[11px] text-slate-300">
                  Dauer für diesen Teil: {Math.round(testMeta.duration / 60)} Minuten
                </p>
              ) : null}
            </div>

            <div className="w-full md:w-64 lg:w-80">
              {/* Audio Player – pass URL if your Player supports `src` */}
              <div className="bg-slate-900/60 rounded-xl px-3 py-2 shadow-inner">
                <Player src={media?.url} />
                {media?.filename && (
                  <p className="mt-1 text-[11px] text-slate-300 truncate">
                    {media.filename}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* INFO CARD */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 sm:px-4 py-3">
          <p className="text-[11px] sm:text-sm text-amber-900">{subTitle}</p>
        </div>

        {/* QUESTIONS TABLE */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">
              Aussagen zum Audio
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Wählen Sie für jede Aussage aus, ob sie <strong>richtig</strong> oder{' '}
              <strong>falsch</strong> ist.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-2 sm:p-3 text-center w-10">Nr.</th>
                  <th className="p-2 sm:p-3 text-center w-20">Richtig</th>
                  <th className="p-2 sm:p-3 text-center w-20">Falsch</th>
                  <th className="p-2 sm:p-3">Aussage</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => (
                  <tr
                    key={q.id}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                  >
                    <td className="p-2 sm:p-3 text-center font-semibold text-slate-800">
                      {q.index}
                    </td>
                    <td className="p-2 sm:p-3 text-center">
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        value="richtig"
                        checked={answers[q.id] === 'richtig'}
                        onChange={() => handleAnswer(q.id, 'richtig')}
                        className="accent-emerald-600 w-4 h-4"
                      />
                    </td>
                    <td className="p-2 sm:p-3 text-center">
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        value="falsch"
                        checked={answers[q.id] === 'falsch'}
                        onChange={() => handleAnswer(q.id, 'falsch')}
                        className="accent-rose-600 w-4 h-4"
                      />
                    </td>
                    <td className="p-2 sm:p-3 text-slate-800 align-top">
                      {q.text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ACTION BUTTONS */}
          <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t border-slate-100">
            <button
              onClick={handleSubmit}
              className="inline-flex justify-center items-center bg-emerald-600 text-white px-4 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-emerald-700 transition"
            >
              Speichern
            </button>

          </div>
        </div>
           <TestSubmitBtn />
      </div>
    </div>
  )
}
