'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '../../../../../../utils/axios' // adjust path if needed
import TestSubmitBtn from "../../../../../../components/TestSubmitBtn";
// simple helpers
const pad = (n) => (n < 10 ? `0${n}` : `${n}`)

export default function WritingTest() {
  const { testId } = useParams()

  // UI state
  const [activeTaskId, setActiveTaskId] = useState(null) // 'A' or 'B'
  const [texts, setTexts] = useState({ A: '', B: '' })
  const [startedAt, setStartedAt] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(30 * 60) // default 30m, overridden by server if provided
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [serverTasks, setServerTasks] = useState({ A: null, B: null }) // hold title/subtitle/body and optional id
  const [totalPoints, setTotalPoints] = useState(null)
  const [levelLabel, setLevelLabel] = useState('')

  const timerRef = useRef(null)
  const initializedRef = useRef(false)

  // derived localStorage keys (per test)
  const LS = useMemo(() => {
    if (!testId) return {}
    return {
      draftA: `writing_${testId}_A`,
      draftB: `writing_${testId}_B`,
      startedAt: `writing_${testId}_startedAt`,
      secondsLeft: `writing_${testId}_secondsLeft`,
      examAnswers: `exam_answers_${testId}`,
      writingSubmittedKey: `writing_submitted_${testId}`,
    }
  }, [testId])

  // load drafts + server tasks + reading grouped writing object if present
  useEffect(() => {
    if (!testId) return
    let cancelled = false

    const loadLocalDrafts = () => {
      try {
        // prefer grouped exam_answers writing object if present
        const rawExam = localStorage.getItem(LS.examAnswers)
        if (rawExam) {
          try {
            const parsed = JSON.parse(rawExam)
            if (parsed && parsed.writing && typeof parsed.writing === 'object') {
              const w = parsed.writing
              // tasks drafts
              const draftA = (w.tasks && w.tasks.A && w.tasks.A.draft) || localStorage.getItem(LS.draftA) || ''
              const draftB = (w.tasks && w.tasks.B && w.tasks.B.draft) || localStorage.getItem(LS.draftB) || ''
              setTexts({ A: draftA, B: draftB })

              if (w.startedAt) setStartedAt(w.startedAt)
              if (w.secondsLeft !== undefined && w.secondsLeft !== null) setSecondsLeft(parseInt(w.secondsLeft, 10) || (30 * 60))
              if (w.submittedTask) localStorage.setItem(LS.writingSubmittedKey, String(w.submittedTask))
              return
            }
          } catch (e) {
            // fall through to the legacy single-key approach
            console.warn('Could not parse grouped exam_answers for writing:', e)
          }
        }

        // legacy / fallback: load individual keys
        const draftA = localStorage.getItem(LS.draftA) || ''
        const draftB = localStorage.getItem(LS.draftB) || ''
        const savedStart = localStorage.getItem(LS.startedAt) || null
        const savedLeft = localStorage.getItem(LS.secondsLeft) || null

        setTexts({ A: draftA, B: draftB })
        if (savedStart) setStartedAt(savedStart)
        if (savedLeft) setSecondsLeft(parseInt(savedLeft, 10) || 30 * 60)
      } catch (e) {
        console.warn('Could not read writing drafts from localStorage', e)
      }
    }

    const fetchServer = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/course-test/details/${encodeURIComponent(testId)}?module=writing`)
        const raw = res?.data?.data || res?.data || null
        const payload = typeof raw === 'object' && raw !== null ? raw : null
        if (!payload) {
          console.warn('Writing: no payload found in server response', res)
          setServerTasks({ A: null, B: null })
          setTotalPoints(null)
          setLevelLabel('')
          return
        }

        let foundContent = null
        let foundLevelKey = null
        if (payload.modules && typeof payload.modules === 'object') {
          for (const key of Object.keys(payload.modules)) {
            const m = payload.modules[key]
            if (!m) continue
            const moduleName = (m.module || '').toString().toLowerCase()
            if (moduleName === 'writing' || key.toLowerCase().includes('write') || key.toLowerCase().includes('writing')) {
              foundContent = m.content ?? m
              foundLevelKey = key
              break
            }
            const cont = m.content ?? m
            if (cont && (cont.task_a || cont.taskA || cont.task_b || cont.taskB)) {
              foundContent = cont
              foundLevelKey = key
              break
            }
          }
        }

        if (!foundContent && payload.content) {
          foundContent = payload.content
        }

        const c = foundContent ?? {}
        const tA = c.task_a ?? c.taskA ?? null
        const tB = c.task_b ?? c.taskB ?? null

        const mapTask = (rawTask, fallbackKey) => {
          if (!rawTask) return null
          // prefer explicit questionId from your payload (task_a.questionId)
          const id = rawTask.questionId ?? rawTask._id ?? rawTask.id ?? fallbackKey
          return {
            _qid: id,
            title: rawTask.title ?? '',
            subtitle: rawTask.subtitle ?? '',
            body: rawTask.body ?? rawTask.text ?? '',
            instruction: rawTask.instruction ?? rawTask.prompt ?? '',
            raw: rawTask,
          }
        }

        const serverA = mapTask(tA, 'task_a')
        const serverB = mapTask(tB, 'task_b')

        if (!cancelled) {
          setServerTasks({ A: serverA, B: serverB })
          setTotalPoints((c && (c.totalPoints ?? c.total_points)) ?? payload.totalPoints ?? null)
          setLevelLabel(foundLevelKey ? String(foundLevelKey).replace(/^level_/, '') : payload.level ?? '')
        }
      } catch (err) {
        console.error('Failed to fetch writing module:', err)
        setServerTasks({ A: null, B: null })
        setTotalPoints(null)
        setLevelLabel('')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadLocalDrafts()
    fetchServer()

    return () => {
      cancelled = true
    }
  }, [testId, LS.draftA, LS.draftB, LS.startedAt, LS.secondsLeft, LS.examAnswers, LS.writingSubmittedKey])

  // start timer once a task opens or first keystroke occurs
  const ensureTimer = () => {
    if (initializedRef.current) return
    initializedRef.current = true
    const nowIso = new Date().toISOString()
    setStartedAt(nowIso)
    try {
      localStorage.setItem(LS.startedAt, nowIso)
    } catch {}
  }

  // countdown effect (persist)
  useEffect(() => {
    if (!startedAt) return
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        const next = s > 0 ? s - 1 : 0
        try {
          localStorage.setItem(LS.secondsLeft, String(next))
        } catch {}
        return next
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [startedAt, LS.secondsLeft])

  // simple derived time string
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const timeStr = `${pad(mins)}:${pad(secs)}`

  // compute activeTask object from serverTasks
  const activeTask = useMemo(() => {
    if (!activeTaskId) return null
    return activeTaskId === 'A' ? serverTasks.A : serverTasks.B
  }, [activeTaskId, serverTasks])

  const handleSelectTask = (id) => {
    setActiveTaskId(id)
    ensureTimer()
  }

  const handleTextChange = (e) => {
    const val = e.target.value
    if (!activeTaskId) return
    setTexts((prev) => {
      const next = { ...prev, [activeTaskId]: val }
      try {
        // still save per-draft keys for fast autosave / backward compat
        localStorage.setItem(activeTaskId === 'A' ? LS.draftA : LS.draftB, val)
      } catch {}
      return next
    })
    ensureTimer()
  }

  const wordCount = useMemo(() => {
    const plain = (texts[activeTaskId || 'A'] || '').trim()
    if (!plain) return 0
    return plain.split(/\s+/).length
  }, [texts, activeTaskId])

  // ---- NEW: save grouped writing object into exam_answers_{testId} (uses questionId) ----
  const handleSave = async () => {
    if (!activeTaskId) {
      alert('Please select the task you want to submit (A or B).')
      return
    }

    setSaving(true)
    try {
      // ensure per-draft keys and timer metadata are saved (backward compat)
      if (activeTaskId === 'A') {
        localStorage.setItem(LS.draftA, texts.A || '')
      } else if (activeTaskId === 'B') {
        localStorage.setItem(LS.draftB, texts.B || '')
      }

      if (startedAt) localStorage.setItem(LS.startedAt, startedAt)
      localStorage.setItem(LS.secondsLeft, String(secondsLeft || 0))
      // also mark submitted single task locally
      localStorage.setItem(LS.writingSubmittedKey, activeTaskId)

      // Build grouped writing object. Use serverTasks.*._qid which now prefers questionId.
      const writingObj = {
        tasks: {
          A: {
            qid: serverTasks.A ? serverTasks.A._qid : null,
            title: serverTasks.A ? serverTasks.A.title : '',
            subtitle: serverTasks.A ? serverTasks.A.subtitle : '',
            body: serverTasks.A ? serverTasks.A.body : '',
            instruction: serverTasks.A ? serverTasks.A.instruction : '',
            draft: texts.A || '',
          },
          B: {
            qid: serverTasks.B ? serverTasks.B._qid : null,
            title: serverTasks.B ? serverTasks.B.title : '',
            subtitle: serverTasks.B ? serverTasks.B.subtitle : '',
            body: serverTasks.B ? serverTasks.B.body : '',
            instruction: serverTasks.B ? serverTasks.B.instruction : '',
            draft: texts.B || '',
          },
        },
        startedAt: startedAt || null,
        secondsLeft: secondsLeft || 0,
        submittedTask: activeTaskId || null,
      }

      // Merge into exam_answers_{testId}
      if (testId) {
        try {
          const raw = localStorage.getItem(LS.examAnswers)
          const parsed = raw ? JSON.parse(raw) : {}
          const merged = { ...(parsed || {}), writing: writingObj }
          localStorage.setItem(LS.examAnswers, JSON.stringify(merged))
        } catch (err) {
          console.warn('Could not merge writing into exam_answers:', err)
        }
      }

      alert('Selected task saved locally. Use Final Submit to send everything to the server.')
    } catch (err) {
      console.warn('Could not persist final writing data locally', err)
      alert('Failed to save locally — please try again.')
    } finally {
      setSaving(false)
    }
  }

  // loading UI or no-server-content
  if (loading) return <div className="p-6 text-center">Loading writing tasks…</div>

  // if server returned no writing tasks, show message
  if (!serverTasks.A && !serverTasks.B) {
    return <div className="p-6 text-center">No writing tasks found for this test.</div>
  }

  // UI constants
  const level = levelLabel || 'Deutsch - B2'
  const tp = totalPoints ?? 45

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Top bar */}
      <div className="mx-auto max-w-6xl bg-[#0d2b57] text-white rounded-2xl shadow-md">
        <div className="flex items-center justify-between px-4 py-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 px-3 py-1 rounded-lg text-sm">
              <span className="font-semibold">Schreiben</span> · Teil 1
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-lg text-sm">{tp} Punkte</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm opacity-90">{level}</div>
            <div className="text-sm">
              Remaining time:{' '}
              <span className={`font-semibold ${secondsLeft <= 60 ? 'text-yellow-300' : 'text-white'}`}>{timeStr}</span>
            </div>

            <button onClick={handleSave} disabled={saving} className="bg-[#0ea5e9] hover:bg-[#0891d1] disabled:bg-sky-400 text-white px-4 py-2 rounded-lg">
              {saving ? 'Saving…' : 'Save'}
            </button>

            <TestSubmitBtn />

          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="mx-auto max-w-6xl bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4">
        <p className="text-yellow-900 text-sm">
          Make a quick decision — available time is limited. <br />
          <strong>Task A</strong> and <strong>Task B</strong> are shown on the left; select one and write your answer on the right.
        </p>
      </div>

      {/* Main area */}
      <div className="mx-auto max-w-6xl mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: tasks */}
        <div className="bg-white rounded-2xl shadow-md p-4 space-y-4">
          {/* render A */}
          {serverTasks.A && (
            <div
              key="A"
              className={`border rounded-xl p-4 cursor-pointer transition ${activeTaskId === 'A' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => handleSelectTask('A')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{serverTasks.A.title}</h3>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{serverTasks.A.subtitle}</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed max-h-64 overflow-auto">{serverTasks.A.body}</pre>
            </div>
          )}

          {/* render B */}
          {serverTasks.B && (
            <div
              key="B"
              className={`border rounded-xl p-4 cursor-pointer transition ${activeTaskId === 'B' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => handleSelectTask('B')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{serverTasks.B.title}</h3>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{serverTasks.B.subtitle}</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed max-h-64 overflow-auto">{serverTasks.B.body}</pre>
            </div>
          )}
        </div>

        {/* RIGHT: editor */}
        <div className="bg-white rounded-2xl shadow-md p-4 min-h-[520px] flex flex-col">
          {!activeTask ? (
            <div className="flex-1 grid place-items-center text-gray-500">
              <div className="text-center">
                <p className="font-medium">Select a task (A or B) to start writing.</p>
                <p className="text-sm mt-1">Your editor will appear here.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{activeTask.title}</h3>
                <div className="text-sm text-gray-600">
                  Words: <span className="font-semibold">{wordCount}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">{activeTask.instruction}</p>
              <textarea
                value={texts[activeTaskId]}
                onChange={handleTextChange}
                onFocus={ensureTimer}
                className="flex-1 w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Write your text here…"
                spellCheck={true}
              />
              <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                <span>Started: {startedAt ? new Date(startedAt).toLocaleString() : '—'}</span>
                <span>Autosaves to your browser</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
