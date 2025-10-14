'use client'

import { useState } from 'react'
import Player from '../../../components/shared/Player'

export default function ListeningTest() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [answers, setAnswers] = useState({})
  const [audio, setAudio] = useState(null)

  // Dynamic or static data
  const questions = [
    {
      id: 1,
      text: 'Der Software-Service von Macrohard steht rund um die Uhr zur Verfügung.',
    },
    {
      id: 2,
      text: 'Für das Konzert mit Romano Castelli gibt es noch Karten ab 200 Euro.',
    },
    {
      id: 3,
      text: 'Über den neuen Tarif von T-Upline können Sie sich im Internet informieren.',
    },
    {
      id: 4,
      text: 'Weil das Schwerpunktthema „Japan“ lautet, treten im Park des Museums für Völkerkunde in diesem Jahr nur japanische Musiker auf.',
    },
    {
      id: 5,
      text: 'Beim Festival gibt es nicht nur folkloristische Unterhaltung, sondern auch kulinarische Spezialitäten aus dem In- und Ausland.',
    },
  ]

  const handlePlayPause = () => {
    if (!audio) {
      const newAudio = new Audio('/audio/sample.mp3')
      setAudio(newAudio)
      newAudio.play()
      setIsPlaying(true)
      newAudio.onended = () => setIsPlaying(false)
    } else {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        audio.play()
        setIsPlaying(true)
      }
    }
  }

  const handleAnswer = (id, value) => {
    setAnswers({ ...answers, [id]: value })
  }

  const handleSubmit = () => {
    console.log('User Answers:', answers)
    alert('Answers saved successfully!')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Hörverstehen – Teil 3
          </h2>
          <div className='w-80 shadow-sm'>
           <Player/>
          </div>
        </div>

        {/* Info Section */}
        <p className="text-sm text-gray-600 mb-6">
          Sie hören jetzt fünf kurze Texte. Entscheiden Sie beim Hören, ob die Aussagen
          richtig oder falsch sind. Sie hören diese Texte nur einmal.
        </p>

        {/* Questions */}
        <table className="w-full text-sm text-left border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-center">#</th>
              <th className="p-2 text-center">Richtig</th>
              <th className="p-2 text-center">Falsch</th>
              <th className="p-2">Aussage</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} className="border-t">
                <td className="p-2 text-center font-semibold">{q.id}</td>
                <td className="p-2 text-center">
                  <input
                    type="radio"
                    name={`q${q.id}`}
                    value="richtig"
                    checked={answers[q.id] === 'richtig'}
                    onChange={() => handleAnswer(q.id, 'richtig')}
                    className="accent-green-600 w-5 h-5"
                  />
                </td>
                <td className="p-2 text-center">
                  <input
                    type="radio"
                    name={`q${q.id}`}
                    value="falsch"
                    checked={answers[q.id] === 'falsch'}
                    onChange={() => handleAnswer(q.id, 'falsch')}
                    className="accent-red-600 w-5 h-5"
                  />
                </td>
                <td className="p-2">{q.text}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Speichern
          </button>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            Abgabe
          </button>
        </div>
      </div>
    </div>
  )
}
