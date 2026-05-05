'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../lib/supabase'

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [friends, setFriends] = useState<any[]>([])
  const [selectedFriend, setSelectedFriend] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = '/login'
        return
      }
      setUser(data.user)

      // Profil laden
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      setProfile(profileData)

      // Freunde laden
      const { data: friendData } = await supabase
        .from('friendships')
        .select(`
          *,
          sender:profiles!friendships_sender_id_fkey(id, username, full_name),
          receiver:profiles!friendships_receiver_id_fkey(id, username, full_name)
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${data.user.id},receiver_id.eq.${data.user.id}`)

      setFriends(friendData || [])
    })
  }, [])

  useEffect(() => {
    if (!selectedFriend || !user) return

    loadMessages()

    // Realtime subscription
    const supabase = createClient()
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new
        if (
          (msg.sender_id === user.id && msg.receiver_id === selectedFriend.id) ||
          (msg.sender_id === selectedFriend.id && msg.receiver_id === user.id)
        ) {
          setMessages((prev) => [...prev, msg])
          scrollToBottom()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [selectedFriend, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadMessages() {
    if (!selectedFriend || !user) return
    const supabase = createClient()

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true })

    setMessages(data || [])
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedFriend) return
    setLoading(true)
    const supabase = createClient()

    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedFriend.id,
      content: newMessage.trim(),
    })

    setNewMessage('')
    setLoading(false)
  }

  function getFriend(friendship: any) {
    return friendship.sender_id === user?.id
      ? friendship.receiver
      : friendship.sender
  }

  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString('de-AT', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div style={{
      backgroundColor: '#0f1a0f',
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
      color: '#e8f5e8',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Navigation */}
      <nav style={{
        backgroundColor: '#162016',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #2a3d2a',
      }}>
        <a href="/" style={{ color: '#4CAF50', fontSize: '20px', fontWeight: 'bold', textDecoration: 'none' }}>
          SummitCircle 🏔️
        </a>
        <span style={{ color: '#a0b8a0', fontSize: '14px' }}>💬 Chat</span>
      </nav>

      {/* Chat Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Freundesliste links */}
        <div style={{
          width: '260px',
          backgroundColor: '#162016',
          borderRight: '1px solid #2a3d2a',
          overflowY: 'auto',
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #2a3d2a' }}>
            <h2 style={{ fontSize: '13px', color: '#6a8a6a', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Nachrichten
            </h2>
          </div>
          {friends.length === 0 ? (
            <div style={{ padding: '16px', color: '#6a8a6a', fontSize: '13px' }}>
              Noch keine Freunde.{' '}
              <a href="/friends" style={{ color: '#4CAF50' }}>Freunde hinzufügen</a>
            </div>
          ) : (
            friends.map((friendship) => {
              const friend = getFriend(friendship)
              const isSelected = selectedFriend?.id === friend?.id
              return (
                <div
                  key={friendship.id}
                  onClick={() => setSelectedFriend(friend)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#1e3a1e' : 'transparent',
                    borderBottom: '1px solid #2a3d2a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0f1a0f',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}>
                    {friend?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>@{friend?.username}</div>
                    {friend?.full_name && (
                      <div style={{ fontSize: '11px', color: '#6a8a6a' }}>{friend?.full_name}</div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Chat Bereich rechts */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!selectedFriend ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6a8a6a',
              fontSize: '16px',
            }}>
              👈 Wähle einen Freund um zu chatten
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={{
                padding: '16px 24px',
                backgroundColor: '#162016',
                borderBottom: '1px solid #2a3d2a',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#4CAF50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f1a0f',
                  fontWeight: 'bold',
                }}>
                  {selectedFriend?.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ fontWeight: 'bold' }}>@{selectedFriend?.username}</div>
              </div>

              {/* Nachrichten */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#6a8a6a', marginTop: '32px' }}>
                    Noch keine Nachrichten — schreib etwas! 👋
                  </div>
                )}
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backgroundColor: isMine ? '#4CAF50' : '#162016',
                        color: isMine ? '#0f1a0f' : '#e8f5e8',
                        border: isMine ? 'none' : '1px solid #2a3d2a',
                      }}>
                        <div style={{ fontSize: '14px' }}>{msg.content}</div>
                        <div style={{
                          fontSize: '10px',
                          marginTop: '4px',
                          opacity: 0.7,
                          textAlign: 'right',
                        }}>
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Nachricht eingeben */}
              <div style={{
                padding: '16px',
                backgroundColor: '#162016',
                borderTop: '1px solid #2a3d2a',
                display: 'flex',
                gap: '8px',
              }}>
                <input
                  type="text"
                  placeholder="Nachricht schreiben..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '24px',
                    border: '1px solid #2a3d2a',
                    backgroundColor: '#0f1a0f',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  style={{
                    backgroundColor: '#4CAF50',
                    color: '#0f1a0f',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '24px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Senden
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}