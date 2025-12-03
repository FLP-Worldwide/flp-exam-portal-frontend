'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '../../../../../../utils/axios'
import Player from '../../../../../../components/shared/Player'
import TestSubmitBtn from '../../../../../../components/TestSubmitBtn'

export default function ListeningTest() {
  const { testId } = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [levels, setLevels] = useState([]) // [{ key, label, media, questions }]
  const [activeLevelIndex, setActiveLevelIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: "richtig" | "falsch" }
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
        const payload = raw && typeof raw === 'object' ? raw : null

        if (!payload) {
          console.warn('Audio: no payload found in server response', res)
          if (!cancelled) {
            setLevels([])
            setTestMeta(null)
          }
          return
        }

        if (!cancelled) {
          setTestMeta({
            testName: payload.testName || 'Hörverstehen – Prüfung',
            language: payload.language || 'German',
            duration: payload.duration || null,
          })
        }

        const modules = payload.modules || {}
        const audioEntries = Object.entries(modules).filter(
          ([, m]) => m && (m.module || '').toString().toLowerCase() === 'audio'
        )

        if (!audioEntries.length) {
          console.warn('Audio: no audio modules found')
          if (!cancelled) {
            setLevels([])
          }
          return
        }

        const builtLevels = audioEntries.map(([key, m], idx) => {
          const content = m.content || {}
          const mediaFromServer = content.media || null
          const questionsRaw = Array.isArray(content.questions)
            ? content.questions
            : []

          const normalizedQuestions = questionsRaw.map((q, qIdx) => ({
            id: q.questionId || q._id || q.id || `${key}_q${qIdx + 1}`,
            index: qIdx + 1,
            text: q.text || q.question || '',
          }))

          // label like "Level 1", "Level 2" …
          const label =
            key && key.startsWith('level_level_')
              ? `Level ${key.replace('level_level_', '')}`
              : `Level ${idx + 1}`

          return {
            key,
            label,
            media: mediaFromServer,
            questions: normalizedQuestions,
          }
        })

        if (!cancelled) {
          setLevels(builtLevels)
          setActiveLevelIndex(0)
        }
      } catch (err) {
        console.error('Failed to fetch audio module:', err)
        if (!cancelled) {
          setLevels([])
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

  // ---------- PREFILL ANSWERS FROM LOCALSTORAGE ----------
  useEffect(() => {
    if (!testId) return
    try {
      const raw = localStorage.getItem(`exam_answers_${testId}`)
      const parsed = raw ? JSON.parse(raw) : {}
      const saved =
        parsed &&
        parsed.levels &&
        parsed.levels.audio &&
        typeof parsed.levels.audio === 'object'
          ? parsed.levels.audio
          : {}
      setAnswers(saved)
    } catch (e) {
      console.warn('Failed to load saved audio answers:', e)
    }
  }, [testId])

  // ---------- ANSWERS ----------
  const handleAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const levelKey = 'audio'

  const handleSubmit = () => {
    const payload = {}

    // collect answers for ALL levels/questions
    levels.forEach((lvl) => {
      ;(lvl.questions || []).forEach((q) => {
        if (answers[q.id] !== undefined && answers[q.id] !== null) {
          payload[q.id] = answers[q.id]
        }
      })
    })

    if (testId) {
      try {
        const raw = localStorage.getItem(`exam_answers_${testId}`)
        const parsed = raw ? JSON.parse(raw) : {}

        const levelsObj =
          parsed && parsed.levels && typeof parsed.levels === 'object'
            ? { ...parsed.levels }
            : {}

        levelsObj[levelKey] = {
          ...(levelsObj[levelKey] || {}),
          ...payload,
        }

        const merged = { ...(parsed || {}), levels: levelsObj }

        localStorage.setItem(`exam_answers_${testId}`, JSON.stringify(merged))
        alert('Antworten gespeichert!')
      } catch (e) {
        console.warn('Failed to persist submission:', e)
        alert('Fehler beim Speichern!')
      }
    }
  }

  // ---------- DERIVED CURRENT LEVEL ----------
  const activeLevel =
    levels.length > 0 && activeLevelIndex >= 0 && activeLevelIndex < levels.length
      ? levels[activeLevelIndex]
      : null

  const currentQuestions = activeLevel?.questions || []
  const currentMedia = activeLevel?.media || null

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

  const noQuestions =
    !levels.length ||
    levels.every((lvl) => !lvl.questions || !lvl.questions.length)

  if (noQuestions) {
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
        {/* LEVEL PILLS */}
        {levels.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {levels.map((lvl, idx) => {
              const isActive = idx === activeLevelIndex
              return (
                <button
                  key={lvl.key || idx}
                  type="button"
                  onClick={() => setActiveLevelIndex(idx)}
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm border transition ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {lvl.label || `Level ${idx + 1}`}
                </button>
              )
            })}
          </div>
        )}

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
              <div className="bg-slate-900/60 rounded-xl px-3 py-2 shadow-inner">
                <Player src={currentMedia?.url} />
                {currentMedia?.filename && (
                  <p className="mt-1 text-[11px] text-slate-300 truncate">
                    {currentMedia.filename}
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

        {/* QUESTIONS TABLE FOR ACTIVE LEVEL */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Aussagen zum Audio – {activeLevel?.label}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Wählen Sie für jede Aussage aus, ob sie <strong>richtig</strong> oder{' '}
                <strong>falsch</strong> ist.
              </p>
            </div>
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
                {currentQuestions.map((q, idx) => (
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
