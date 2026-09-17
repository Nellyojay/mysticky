import { useEffect, useState } from 'react'
import { generateCityToken, getPhoneToken, PHONE_TOKEN_KEY } from './services/getToken'
import { chatRoomExists, getLatestMessage, saveMessage } from './services/messages'
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
  const [chatRoomInput, setChatRoomInput] = useState(() => getPhoneToken())
  const [chatRoom, setChatRoom] = useState(() => getPhoneToken())
  const [roomError, setRoomError] = useState('')

  useEffect(() => {
    const hasReceiver = Boolean(chatRoom && chatRoom !== 'unknown-phone')
    setShowInput(hasReceiver)
  }, [chatRoom])

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

  const handleYes = async () => {
    setResponse('yes')
    try {
      await saveMessage('yes')
      console.log('Phone token used:', getPhoneToken())
    } catch (error) {
      console.error('Failed to save yes response:', error)
    }
  }

  const handleNo = async () => {
    setResponse('no')
    try {
      await saveMessage('no')
      console.log('Phone token used:', getPhoneToken())
    } catch (error) {
      console.error('Failed to save no response:', error)
    }
  }

  const openReceiverLink = async () => {
    const nextRoom = chatRoomInput.trim() || chatRoom
    if (!nextRoom) {
      setRoomError('Please enter a chat room first.')
      return
    }

    try {
      const exists = await chatRoomExists(nextRoom)

      if (!exists) {
        setRoomError('This chat room does not exist yet. Please create a new one or try another room.')
        return
      }
    } catch (error) {
      console.error('Failed to verify chat room:', error)
      setRoomError('Could not verify this chat room right now.')
      return
    }

    setRoomError('')
    setChatRoomInput(nextRoom)
    setChatRoom(nextRoom)
    localStorage.setItem(PHONE_TOKEN_KEY, nextRoom)
    setShowInput(true)
    window.location.href = `https://nellyojay.github.io/mysticky/?chatroom=${encodeURIComponent(nextRoom)}`
  }

  const joinChatRoom = async () => {
    const nextRoom = chatRoomInput.trim()

    if (!nextRoom) {
      setRoomError('Please enter a chat room to join.')
      return
    }

    try {
      const exists = await chatRoomExists(nextRoom)

      if (!exists) {
        setRoomError('This chat room does not exist. Please create a new one or try another room.')
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
    setShowInput(true)
    window.location.href = `https://nellyojay.github.io/mysticky/?chatroom=${encodeURIComponent(nextRoom)}`
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
            <h1 className="message-title">
              {savedMessage ?? ''}
            </h1>

            {!savedMessage && (
              <div className="note-box">
                <div className="mb-3 rounded-xl bg-white/50 p-3 text-sm text-[#5b2c83]">
                  Chat room: <strong>{chatRoom}</strong>
                </div>

                {!showInput && (
                  <>
                    <div className="mb-3 flex flex-col gap-2">
                      <label className="text-sm font-bold text-[#5b2c83]">Chat room</label>
                      <input
                        value={chatRoomInput}
                        onChange={(event) => {
                          setChatRoomInput(event.target.value)
                          if (roomError) setRoomError('')
                        }}
                        placeholder="Type a chat room code"
                        className="rounded-xl border border-[#5b2c83]/40 bg-white/80 px-3 py-2 text-[#5b2c83] outline-none"
                      />

                      {roomError && (
                        <p className="text-xs font-medium text-red-600">{roomError}</p>
                      )}
                    </div>

                    <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        className="rounded-xl bg-[#5b2c83] px-4 py-2 font-bold text-white"
                        onClick={joinChatRoom}
                      >
                        Join chat room
                      </button>

                      <button
                        type="button"
                        className="hidden rounded-xl bg-[#f4a261] px-4 py-2 font-bold text-[#5b2c83]"
                        onClick={createNewChatRoom}
                      >
                        New chat room
                      </button>
                    </div>

                    <button
                      type="button"
                      className="hidden w-full rounded-xl border border-[#5b2c83] bg-transparent px-4 py-2 font-bold text-[#5b2c83]"
                      onClick={openReceiverLink}
                    >
                      Open this chat room
                    </button>
                  </>
                )}

              </div>
            )}

            {showInput && (
              <>
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
              </>
            )}

            {false && (
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
