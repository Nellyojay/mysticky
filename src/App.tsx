import { useEffect, useState } from 'react'
import { generateCityToken, getStickyCode, STICKY_CODE_KEY } from './services/getToken'
import { createStickyNote, getLatestMessage, LOGGED_IN, resolveStickyNoteId, saveMessage, stickyCodeExists } from './services/messages'
import Loader from './pages/components/loader'
import './styles/sticker-card.css'

const LOCKOUT_MS = 3 * 60 * 60 * 1000
const LOADER_DURATION_MS = 3000

const waitForLoader = async (startedAt: number) => {
  const remainingTime = LOADER_DURATION_MS - (Date.now() - startedAt)
  if (remainingTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingTime))
  }
}

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

  const createStickyCode = () => {
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

  const openStickyNoteHandler = async () => {
    const code = stickyCodeInput.trim()
    if (!code) {
      setStickyCodeError('Please enter a sticky code.')
      return
    }
    const loadingStartedAt = Date.now()
    setLoading(true)
    const exists = await stickyCodeExists(code)

    if (exists) {
      setLoggedIn(exists)
      setStickyCode(code)

      const stickyNoteId = await resolveStickyNoteId(code)
      localStorage.setItem(LOGGED_IN, `${stickyNoteId}_${code}`)
      localStorage.setItem(STICKY_CODE_KEY, code)
      await waitForLoader(loadingStartedAt)
      setLoading(false)
      setStickyCodeError('')
    } else {
      await waitForLoader(loadingStartedAt)
      setLoading(false)
      setStickyCodeError(`Sticky code does not exist. Would you like to create sticky note - ${stickyCodeInput.trim()}?`)
    }
  }

  const createStickyNoteHandler = async () => {
    const code = stickyCodeInput.trim()
    if (!code) {
      setStickyCodeError('Please enter a sticky code.')
      return
    }
    const loadingStartedAt = Date.now()
    setLoading(true)

    try {
      await createStickyNote(code)
      setLoggedIn(true)
      setStickyCode(code)
      localStorage.setItem(STICKY_CODE_KEY, code)
      await waitForLoader(loadingStartedAt)
      setStickyCodeError('')
      setLoading(false)
    } catch (error) {
      await waitForLoader(loadingStartedAt)
      setStickyCodeError('Failed to create sticky note. Please try again.')
      setLoading(false)
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
    const loadingStartedAt = Date.now()
    const token = getStickyCode()
    console.log('Retrieved sticky code:', token)

    const initializeStickyNote = async () => {
      if (token) {
        console.log('Checking if sticky code exists in database:', token)
        const exists = await stickyCodeExists(token)
        console.log(`Sticky code ${token} exists:`, exists)

        if (!exists) {
          setLoggedIn(false)
          localStorage.clear();
          setStickyCodeError(`Sticky code does not exist. Would you like to create sticky note - ${token}?`);
        } else {
          setStickyCodeError('')
        }
      }

      setStickyCode(token)
      setResponse(null)
      setStickyCodeInput(token)
      setLoggedIn(Boolean(localStorage.getItem(LOGGED_IN)))
      await waitForLoader(loadingStartedAt)
      setLoading(false)
    }

    void initializeStickyNote()
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
        <div className="sticker-tag sticky top-2 z-10">{stickyCode || 'sticky note'}</div>

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
            <Loader label="Opening sticky note" />
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
                <div className="sticky-code-input-area">
                  <input
                    value={stickyCodeInput}
                    onChange={(event) => setStickyCodeInput(event.target.value)}
                    placeholder="Type a sticky code"
                    className={`room-input ${stickyCodeError ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    className="generate-code-btn"
                    onClick={createStickyCode}
                  >
                    Generate code
                  </button>
                </div>

                {stickyCodeError && <p className="error-text">{stickyCodeError}</p>}

                <div className="button-grid">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => {
                      if (stickyCodeError.includes('Would you like to create sticky note')) {
                        setStickyCodeError('')
                      } else {
                        openStickyNoteHandler()
                      }
                    }}
                  >
                    {stickyCodeError.includes('Would you like to create sticky note') ? 'No, cancel' : 'Open sticky note'}
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={createStickyNoteHandler}
                  >
                    {stickyCodeError.includes('Would you like to create sticky note') ? 'Yes, create it' : 'Create new sticky note'}
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
