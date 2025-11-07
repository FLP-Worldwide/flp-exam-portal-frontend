"use client"

import React, { useEffect, useState } from "react"

export default function ListeningAdmin() {
  const [token, setToken] = useState("")
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [bulkText, setBulkText] = useState("")
  const [media, setMedia] = useState({})
  const [file, setFile] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // Helpers
  const emptyQuestion = () => ({ text: "", correctAnswer: "true" })

  // Load existing questions and media (if any)
  const loadQuestions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tests/listening/questions', { headers: { 'x-admin-token': token } })
      const data = await res.json()
      if (data.ok && Array.isArray(data.items)) setQuestions(data.items.map(q => ({ ...emptyQuestion(), ...q, correctAnswer: q.correctAnswer ?? (q.answer === true ? 'true' : 'false') })))
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const loadMedia = async () => {
    try {
      const res = await fetch('/api/tests/listening/media', { cache: 'no-store' })
      const data = await res.json()
      if (data.ok) setMedia(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadMedia()
    loadQuestions()
    // If you store token somewhere (localStorage), you can load it here
    const t = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : ''
    setToken(t)
  }, [])

  // File selection
  const onFileChange = e => setFile(e.target.files?.[0] || null)

  // Question operations
  const addQuestion = () => setQuestions(prev => [...prev, emptyQuestion()])
  const removeQuestion = idx => setQuestions(prev => prev.filter((_, i) => i !== idx))
  const handleQuestionChange = (idx, field, value) => {
    setQuestions(prev => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)))
  }

  // Upload audio to server. Returns media object from server or null
  const uploadAudioFile = async () => {
    if (!file) return null
    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch('/api/tests/listening/media', {
      method: 'POST',
      headers: { 'x-admin-token': token },
      body: fd,
    })
    const data = await res.json()
    if (data.ok) return data
    throw new Error(data.error || 'Failed to upload media')
  }

  // Save questions and associate media path in DB
  const saveAll = async () => {
    setIsSaving(true)
    try {
      // 1) upload audio if new file selected
      let uploadedMedia = null
      if (file) {
        uploadedMedia = await uploadAudioFile()
        await loadMedia()
      }

      // if no file uploaded in this action, but existing media is present, use it
      const mediaPath = uploadedMedia?.path || media?.path || media?.url || null

      // 2) prepare questions payload
      // ensure correctAnswer is boolean when sending to backend
      const payloadItems = questions.map((q, i) => ({
        text: q.text,
        correctAnswer: q.correctAnswer === 'true',
      }))

      // 3) send questions to server with mediaPath
      const res = await fetch('/api/tests/listening/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ items: payloadItems, mediaPath }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error || 'Failed to save questions')

      // refresh local data
      await loadQuestions()
      await loadMedia()
      setFile(null)
      alert('Saved successfully')
    } catch (err) {
      console.error(err)
      alert('Save failed: ' + (err.message || err))
    }
    setIsSaving(false)
  }

  // Remove current audio on server
  const deleteAudio = async () => {
    if (!confirm('Remove current audio?')) return
    await fetch('/api/tests/listening/media', { method: 'DELETE', headers: { 'x-admin-token': token } })
    await loadMedia()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Listening Test (Dynamic)</h2>

        {/* AUDIO SECTION */}
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Test Audio</h3>

          {media?.url ? (
            <div className="mb-3">
              <p className="text-sm text-gray-700">
                Current: <strong>{media.filename || media.name}</strong>{' '}
                {media.updatedAt ? `(${new Date(media.updatedAt).toLocaleString()})` : ''}
              </p>
              <audio controls src={media.url} className="w-full mb-2" />
              <div className="flex gap-3">
                <button onClick={deleteAudio} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Remove Audio</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-3">No audio uploaded yet.</p>
          )}

          <div className="flex items-center gap-3">
            <input type="file" accept="audio/*" onChange={onFileChange} className="border p-2 rounded-md" />
            <button
              onClick={async () => {
                // Quick upload without saving questions
                if (!file) return alert('Select a file first.')
                setIsSaving(true)
                try {
                  await uploadAudioFile()
                  await loadMedia()
                  setFile(null)
                  alert('Audio uploaded')
                } catch (err) {
                  console.error(err)
                  alert('Upload failed')
                }
                setIsSaving(false)
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Upload Audio
            </button>
          </div>
        </div>

        {/* QUESTIONS EDITOR */}
        <div className="border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Questions</h3>
            <div className="flex gap-2">
              <button onClick={addQuestion} className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700">Add Question</button>
            </div>
          </div>

          {loading ? (
            <p>Loading questions...</p>
          ) : (
            <div className="space-y-4">
              {questions.length === 0 && <p className="text-sm text-gray-500">No questions yet. Click "Add Question" to start.</p>}

              {questions.map((q, idx) => (
                <div key={idx} className="border rounded p-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                  

                      <textarea
                        value={q.text}
                        onChange={e => handleQuestionChange(idx, 'text', e.target.value)}
                        placeholder="Question text"
                        rows={2}
                        className="border p-2 rounded w-full mb-2"
                      />

                 

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input type="radio" id={`q-${idx}-true`} name={`answer-${idx}`} checked={q.correctAnswer === 'true'} onChange={() => handleQuestionChange(idx, 'correctAnswer', 'true')} />
                          <label htmlFor={`q-${idx}-true`}>True</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="radio" id={`q-${idx}-false`} name={`answer-${idx}`} checked={q.correctAnswer === 'false'} onChange={() => handleQuestionChange(idx, 'correctAnswer', 'false')} />
                          <label htmlFor={`q-${idx}-false`}>False</label>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button onClick={() => setQuestions(prev => prev.map((p, i) => (i === idx ? { ...p, text: p.text } : p)))} className="text-sm text-gray-600">Preview</button>
                      <button onClick={() => removeQuestion(idx)} className="text-red-600">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={saveAll} disabled={isSaving} className="bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
            {isSaving ? 'Saving…' : 'Save All (audio + questions)'}
          </button>
        </div>
      </div>
    </div>
  )
}
