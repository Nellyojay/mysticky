import { useEffect, useState } from 'react'
import { generateCityToken, getPhoneToken, PHONE_TOKEN_KEY } from './services/getToken'
import { chatRoomExists, getLatestMessage, saveMessage, TABLE_NAME } from './services/messages'
import './styles/sticker-card.css'
import { supabase } from './lib/supabase'

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
  const [chatRoom, setChatRoom] = useState(() => getPhoneToken())
  const [chatRoomInput, setChatRoomInput] = useState(() => getPhoneToken())
  const [roomError, setRoomError] = useState('')
  console.log('okudi')

  useEffect(() => {
    if (!sentAt) {
      setCountdown('')
      return
    }

    const tick = () => {
      const remaining = LOCKOUT_MS - (Date.now() - sentAt)

      if (remaining <= 0) {
        setSentAt(null)
        setCountdown('')
        return
      }

      setCountdown(`Reply in: ${formatCountdown(remaining)}`)
    }

    tick()
    const intervalId = window.setInterval(tick, 1000)

    return () => window.clearInterval(intervalId)
  }, [sentAt])

  const handleSend = async () => {
    const trimmed = inputValue.trim()

    if (!trimmed) {
      window.alert('Please write a message before sending.')
      return
    }

    try {
      const saved = await saveMessage(trimmed)
      setSavedMessage(saved.message)
      setSentAt(new Date(saved.time_past ?? Date.now()).getTime())
      setInputValue('')
      setResponse(null)
      console.log('Phone token used:', getPhoneToken())
    } catch (error) {
      console.error('Failed to save message:', error)
      window.alert('Could not save the message. Check your Supabase configuration.')
    }
  }

  useEffect(() => {
    const hasReceiver = Boolean(chatRoom && chatRoom !== 'unknown-phone')
    setShowInput(hasReceiver)

    const loadLatest = async () => {
      try {
        const latest = await getLatestMessage(chatRoom)

        if (!latest?.time_past) return

        setSavedMessage(latest.message)
        setSentAt(new Date(latest.time_past).getTime())
        const timePassed = Date.now() - new Date(latest.time_past).getTime()

        if (timePassed < LOCKOUT_MS) {
          setShowInput(false)
        }
      } catch (error) {
        console.error('there is an error:', error)
      }
    }

    void loadLatest()
  }, [chatRoom])

  const openReceiverLink = async () => {
    const nextRoom = chatRoomInput.trim() || chatRoom
    if (!nextRoom) {
      setRoomError('Please enter a chat room first.')
      return false;
    }

    try {
      const exists = await chatRoomExists(nextRoom)

      if (!exists) {
        setRoomError('This chat room does not exist yet. Please create a new one or try another room.')
        return false;
      }
    } catch (error) {
      console.error('Failed to verify chat room:', error)
      setRoomError('Could not verify this chat room right now.')
      return false;
    }

    setRoomError('')
    setChatRoomInput(nextRoom)
    setChatRoom(nextRoom)
    localStorage.setItem(PHONE_TOKEN_KEY, nextRoom)
    setShowInput(true)
    window.location.href = `https://nellyojay.github.io/mysticky/?chatroom=${encodeURIComponent(nextRoom)}`
    return true;
  }

  const joinChatRoom = async () => {
    const nextRoom = chatRoomInput.trim()

    if (!nextRoom) {
      const openChat = await openReceiverLink()
      if (!openChat) {
        setRoomError('Please enter a chat room to join.')
      }
      return
    }

    try {
      const exists = await chatRoomExists(nextRoom)

      if (!exists) {
        setRoomError('This chat room does not exist, continue to create new chat room')
        const { error } = await supabase
          .from(TABLE_NAME)
          .insert({ chat_room: nextRoom, time_past: null });

        if (error) {
          console.log(error)
          setRoomError("Error creating new Chat room. Please try again.")
        }
        return
      }
    } catch (error) {
      console.error('Failed to verify chat room:', error)
      setRoomError('Could not verify this chat room right now.')
      return
    }

    setRoomError('')
    setChatRoom(nextRoom)
    localStorage.setItem(PHONE_TOKEN_KEY, nextRoom)
    setShowInput(true)
    window.location.href = `https://nellyojay.github.io/mysticky/?chatroom=${encodeURIComponent(nextRoom)}`
  }

  const createNewChatRoom = () => {
    const nextRoom = generateCityToken()
    setChatRoomInput(nextRoom)
    setChatRoom(nextRoom)
    localStorage.setItem(PHONE_TOKEN_KEY, nextRoom)
  }

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
        <div className="sticker-tag">{chatRoom || 'chat room'}</div>

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
          {savedMessage ? (
            <>
              <h1 className="message-title">{savedMessage}</h1>

              {showInput && (
                <div className="composer-box">
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

              {countdown && <div className="countdown">{countdown}</div>}
            </>
          ) : (
            <div className="note-box">
              <div className="room-badge">
                Chat room: <strong>{chatRoom || 'Not selected'}</strong>
              </div>

              <div className="join-panel">
                <label className="field-label">Chat room</label>
                <input
                  value={chatRoomInput}
                  onChange={(event) => {
                    setChatRoomInput(event.target.value)
                    if (roomError) setRoomError('')
                  }}
                  placeholder="Type a chat room code"
                  className="room-input"
                />

                {roomError && <p className="error-text">{roomError}</p>}

                <div className="button-grid">
                  <button type="button" className="primary-btn" onClick={joinChatRoom}>
                    Join chat room
                  </button>
                  <button type="button" className="secondary-btn" onClick={createNewChatRoom}>
                    Create New chat room
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
