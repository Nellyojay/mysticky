import { useEffect, useState } from 'react'
import './styles/sticker-card.css'

const LOCKOUT_MS = 3 * 60 * 60 * 1000

const formatCountdown = (msLeft: number) => {
  const totalSeconds = Math.max(0, Math.ceil(msLeft / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function App() {
  const [inputValue, setInputValue] = useState('')
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [sentAt, setSentAt] = useState<number | null>(null)
  const [countdown, setCountdown] = useState('')
  const [response, setResponse] = useState<'yes' | 'no' | null>(null)

  useEffect(() => {
    if (!sentAt) {
      setCountdown('')
      return
    }

    const tick = () => {
      const remaining = LOCKOUT_MS - (Date.now() - sentAt)

      if (remaining <= 0) {
        setSavedMessage(null)
        setSentAt(null)
        setCountdown('')
        return
      }

      setCountdown(`Next note in: ${formatCountdown(remaining)}`)
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)

    return () => window.clearInterval(intervalId)
  }, [sentAt])

  const handleSend = () => {
    const trimmed = inputValue.trim()

    if (!trimmed) {
      window.alert('Please write a message before sending.')
      return
    }

    setSavedMessage(trimmed)
    setSentAt(Date.now())
    setInputValue('')
    setResponse(null)
  }

  const handleYes = () => {
    setResponse('yes')
  }

  const handleNo = () => {
    setResponse('no')
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center p-5"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(235, 86, 86, 0.74), transparent 30%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.2), transparent 25%), linear-gradient(135deg, #f7d77a, #f4a261, #c77dff, #9ec5fe)',
        fontFamily: '"Comic Sans MS", "Trebuchet MS", cursive, sans-serif',
      }}
    >
      <div className={`sticker-card ${response ? 'sticker-card--celebrate' : ''}`}>
        <div className="paper-tape" />
        <div className="sticker-tag">little note</div>

        {response === 'yes' && (
          <div className="flex flex-col items-center gap-4 py-4 text-center text-[#5b2c83]">
            <div className="text-5xl">😊</div>
            <div className="text-2xl font-bold">Yaaayy 😊 0786911950</div>
            <p className="text-lg text-[#4d3b2d]">
              Call me some time so we can make plans 😊
            </p>
          </div>
        )}

        {response === 'no' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center text-[#5b2c83]">
            <div className="text-5xl">😭</div>
            <p className="text-lg leading-relaxed text-[#4d3b2d]">
              eh maama nawe Nakamate😭😭. Anyway kale, I respect your decision.
              <br />
              <br />
              I hope you have a great day😊 kasta u ate enough cake😊
            </p>
          </div>
        )}

        {!response && (
          <>
            <div className={`emoji ${savedMessage ? 'visible' : 'hidden'}`}>🙃</div>

            <h1 className="message-title">
              {savedMessage ?? ''}
            </h1>

            {!savedMessage && (
              <div className="note-box">
                <textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Tell me something... anything..."
                  aria-label="Message"
                />
                <p className="small-note">
                  You can only reply or get a reply after 3 hours. so take your time and
                  write your sweet thoughts
                </p>
                <button type="button" className="send-btn" onClick={handleSend}>
                  Send a little note
                </button>
              </div>
            )}

            {savedMessage && (
              <div className="mt-6 flex flex-col items-center gap-4">
                <div className="response-box">{savedMessage}</div>
                <div className="button-row">
                  <button type="button" className="yes-btn" onClick={handleYes}>
                    Yeah alright 💃🏽
                  </button>
                  <button type="button" className="no-btn" onClick={handleNo}>
                    No thank you 😅
                  </button>
                </div>
              </div>
            )}

            {countdown && <div className="countdown">{countdown}</div>}
          </>
        )}
      </div>
    </main>
  )
}

export default App
