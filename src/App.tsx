import { useEffect, useState } from 'react'
import { generateCityToken, getStickyCode, STICKY_CODE_KEY } from './services/getToken'
import { createStickyCode, getLatestMessage, LOGGED_IN, resolveStickyNoteId, saveMessage, stickyCodeExists } from './services/messages'
import Loader from './pages/components/loader'
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
  const [showInput, setShowInput] = useState(false)
  const [stickyCode, setStickyCode] = useState('')
  const [stickyCodeInput, setStickyCodeInput] = useState(() => getStickyCode())
  const [stickyCodeError, setStickyCodeError] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const value = sentAt || showInput || setCountdown('') || formatCountdown(LOCKOUT_MS)
    console.log(value);
  }, [])

  useEffect(() => {
    const loggedInToken = localStorage.getItem(LOGGED_IN)
    if (loggedInToken) {
      const stickyNoteId = loggedInToken.split('_')[0]
      getLatestMessage(stickyNoteId).then((message) => {
        if (message) {
          setSavedMessage(message.message)
        }
      })
    }
  }, [stickyCode])

  const createStickyCodeName = () => {
    const newStickyCode = generateCityToken()
    setStickyCode(newStickyCode)
    setStickyCodeInput(newStickyCode)
  }

  const handleLogout = () => {
    localStorage.clear()
    setLoggedIn(false)
    setStickyCode('')
    setStickyCodeInput('')
    setSavedMessage(null)
    setInputValue('')
    setResponse(null)
  }

  const handleOpenStickyNote = async () => {
    const stickyCode = stickyCodeInput
    if (!stickyCode.trim()) {
      setStickyCodeError('Please enter a sticky code.')
      return
    }
    setLoading(true)
    const exists = await stickyCodeExists(stickyCode)

    if (exists) {
      setLoggedIn(exists)
      setStickyCode(stickyCode)

      const stickyNoteId = await resolveStickyNoteId(stickyCode)
      localStorage.setItem(LOGGED_IN, `${stickyNoteId}_${stickyCode}`)
      localStorage.setItem(STICKY_CODE_KEY, stickyCode)
      window.location.reload()
      setLoading(false)
      setStickyCodeError('')
      return;
    } else {
      try {
        await createStickyCode(stickyCode)
        setLoggedIn(true)
        setStickyCode(stickyCode)
        localStorage.setItem(STICKY_CODE_KEY, stickyCode)
        setStickyCodeError('')
        setLoading(false)
      } catch (error) {
        setStickyCodeError('Failed to create sticky note. Please try again.')
        setLoading(false)
      }
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) {
      return console.log('Cannot send an empty message.')
    }

    const loggedInToken = localStorage.getItem(LOGGED_IN)
    if (!loggedInToken) {
      setStickyCodeError('You must be logged in to send a message.')
      return
    }

    const stickyNoteId = loggedInToken.split('_')[0]
    try {
      await saveMessage(inputValue, stickyNoteId)
      setSavedMessage(inputValue)
      setInputValue('')
      setSentAt(Date.now())
      setShowInput(false)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  useEffect(() => {
    const token = getStickyCode()
    setStickyCode(token)
    setResponse(null)
    setStickyCodeInput(token)
    setLoggedIn(Boolean(localStorage.getItem(LOGGED_IN)))
    setLoading(false)
  }, [])

  return (
    <main
      className="flex min-h-screen items-center justify-center p-5"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(235, 86, 86, 0.74), transparent 30%), radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.2), transparent 25%), linear-gradient(135deg, #f7d77a, #f4a261, #c77dff, #9ec5fe)',
        fontFamily: 'Comic Sans MS, Trebuchet MS, cursive, sans-serif',
      }}
    >
      <div className={`sticker-card ${response ? 'sticker-card--celebrate' : ''}`}>
        <div className="paper-tape" />
        <div className="sticker-tag">{stickyCode || 'sticky note'}</div>

        {response === 'yes' ? (
          <div className="status-panel status-panel--yes">
            <div className="emoji">😊</div>
            <div className="status-title">Yaaayy 😊 0786911950</div>
            <p className="status-copy">
              Call me some time so we can make plans 😊
            </p>
          </div>
        ) : response === 'no' ? (
          <div className="status-panel status-panel--no">
            <div className="emoji">😭</div>
            <p className="status-copy">
              eh maama nawe Nakamate😭😭. Anyway kale, I respect your decision.
              <br />
              <br />
              I hope you have a great day😊 kasta u ate enough cake😊
            </p>
          </div>
        ) : null}

        <div className="message-layout">
          {loading ? (
            <Loader label="Opening your note" />
          ) : loggedIn ? (
            <>
              <h1 className="message-title">{savedMessage ? savedMessage : 'Welcome to myStickyNote'}</h1>

              <div className="composer-box">
                <textarea
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="Tell me something... anything..."
                  aria-label="Message"
                />
                <p className="small-note hidden">
                  You can only reply or get a reply after 3 hours. so take your time and
                  write your sweet thoughts
                </p>
                <button
                  type="button"
                  className="send-btn"
                  onClick={handleSendMessage}
                >
                  Send a little note
                </button>
              </div>

              <div className="countdown">{countdown}</div>

              <button
                type="button"
                className="logout-btn"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <div className="note-box">
              <div className="room-badge">
                Sticky code: <strong>{stickyCode || 'Not selected'}</strong>
              </div>

              <div className="join-panel">
                <label className="field-label">Sticky code</label>
                <input
                  value={stickyCodeInput}
                  onChange={(event) => setStickyCodeInput(event.target.value)}
                  placeholder="Type a sticky code"
                  className={`room-input ${stickyCodeError ? 'border-red-500' : ''}`}
                />

                {stickyCodeError && <p className="error-text">{stickyCodeError}</p>}

                <div className="button-grid">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={handleOpenStickyNote}
                  >
                    Open sticky note
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={createStickyCodeName}
                  >
                    Create New sticky note
                  </button>
                </div>
              </div>
            </div>
          )}



        </div>
      </div>
    </main>
  )
}

export default App
