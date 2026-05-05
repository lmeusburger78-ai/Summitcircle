'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'

export default function FriendsPage() {
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [pendingReceived, setPendingReceived] = useState<any[]>([])
  const [pendingSent, setPendingSent] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = '/login'
        return
      }
      setUser(data.user)
      loadFriends(data.user.id)
    })
  }, [])

  async function loadFriends(userId: string) {
    const supabase = createClient()

    // Akzeptierte Freundschaften
    const { data: friendData } = await supabase
      .from('friendships')
      .select(`
        *,
        sender:profiles!friendships_sender_id_fkey(id, username, full_name),
        receiver:profiles!friendships_receiver_id_fkey(id, username, full_name)
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    setFriends(friendData || [])

    // Erhaltene Anfragen
    const { data: receivedData } = await supabase
      .from('friendships')
      .select(`
        *,
        sender:profiles!friendships_sender_id_fkey(id, username, full_name)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending')

    setPendingReceived(receivedData || [])

    // Gesendete Anfragen
    const { data: sentData } = await supabase
      .from('friendships')
      .select(`
        *,
        receiver:profiles!friendships_receiver_id_fkey(id, username, full_name)
      `)
      .eq('sender_id', userId)
      .eq('status', 'pending')

    setPendingSent(sentData || [])
  }

  async function searchUsers() {
    if (!searchQuery.trim()) return
    setLoading(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${searchQuery}%`)
      .neq('id', user.id)
      .limit(10)

    setSearchResults(data || [])
    setLoading(false)
  }

  async function sendFriendRequest(receiverId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('friendships')
      .insert({ sender_id: user.id, receiver_id: receiverId })

    if (error) {
      setMessage('Fehler beim Senden der Anfrage')
    } else {
      setMessage('Freundschaftsanfrage gesendet! 🎉')
      loadFriends(user.id)
      setSearchResults([])
      setSearchQuery('')
    }
  }

  async function acceptRequest(friendshipId: string) {
    const supabase = createClient()
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)

    loadFriends(user.id)
    setMessage('Freundschaft akzeptiert! 🎉')
  }

  async function rejectRequest(friendshipId: string) {
    const supabase = createClient()
    await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', friendshipId)

    loadFriends(user.id)
  }

  return (
    <div style={{
      backgroundColor: '#0f1a0f',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      color: '#e8f5e8',
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
        <span style={{ color: '#a0b8a0', fontSize: '14px' }}>Freunde</span>
      </nav>

      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>

        {/* User suchen */}
        <div style={{
          backgroundColor: '#162016',
          border: '1px solid #2a3d2a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <h2 style={{ color: '#4CAF50', marginBottom: '16px', fontSize: '16px' }}>
            🔍 User suchen
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Username eingeben..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #2a3d2a',
                backgroundColor: '#0f1a0f',
                color: 'white',
                fontSize: '14px',
              }}
            />
            <button
              onClick={searchUsers}
              disabled={loading}
              style={{
                backgroundColor: '#4CAF50',
                color: '#0f1a0f',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Suchen
            </button>
          </div>

          {/* Suchergebnisse */}
          {searchResults.map((result) => (
            <div key={result.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              marginTop: '8px',
              backgroundColor: '#0f1a0f',
              borderRadius: '8px',
              border: '1px solid #2a3d2a',
            }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>@{result.username}</div>
                {result.full_name && (
                  <div style={{ color: '#6a8a6a', fontSize: '12px' }}>{result.full_name}</div>
                )}
              </div>
              <button
                onClick={() => sendFriendRequest(result.id)}
                style={{
                  backgroundColor: '#4CAF50',
                  color: '#0f1a0f',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                + Anfrage senden
              </button>
            </div>
          ))}
        </div>

        {/* Erhaltene Anfragen */}
        {pendingReceived.length > 0 && (
          <div style={{
            backgroundColor: '#162016',
            border: '1px solid #2a3d2a',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <h2 style={{ color: '#4CAF50', marginBottom: '16px', fontSize: '16px' }}>
              📬 Anfragen ({pendingReceived.length})
            </h2>
            {pendingReceived.map((req) => (
              <div key={req.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: '#0f1a0f',
                borderRadius: '8px',
                border: '1px solid #2a3d2a',
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  @{req.sender?.username}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => acceptRequest(req.id)}
                    style={{
                      backgroundColor: '#4CAF50',
                      color: '#0f1a0f',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Annehmen
                  </button>
                  <button
                    onClick={() => rejectRequest(req.id)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#ff6b6b',
                      border: '1px solid #ff6b6b',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Ablehnen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gesendete Anfragen */}
        {pendingSent.length > 0 && (
          <div style={{
            backgroundColor: '#162016',
            border: '1px solid #2a3d2a',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}>
            <h2 style={{ color: '#4CAF50', marginBottom: '16px', fontSize: '16px' }}>
              📤 Gesendete Anfragen
            </h2>
            {pendingSent.map((req) => (
              <div key={req.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: '#0f1a0f',
                borderRadius: '8px',
                border: '1px solid #2a3d2a',
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  @{req.receiver?.username}
                </div>
                <span style={{ color: '#6a8a6a', fontSize: '12px' }}>Ausstehend...</span>
              </div>
            ))}
          </div>
        )}

        {/* Freundesliste */}
        <div style={{
          backgroundColor: '#162016',
          border: '1px solid #2a3d2a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ color: '#4CAF50', marginBottom: '16px', fontSize: '16px' }}>
            👥 Freunde ({friends.length})
          </h2>
          {friends.length === 0 ? (
            <p style={{ color: '#6a8a6a', fontSize: '14px' }}>
              Noch keine Freunde — suche nach Usernamen oben!
            </p>
          ) : (
            friends.map((friendship) => {
              const friend = friendship.sender_id === user?.id
                ? friendship.receiver
                : friendship.sender
              return (
                <div key={friendship.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: '#0f1a0f',
                  borderRadius: '8px',
                  border: '1px solid #2a3d2a',
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
                    marginRight: '12px',
                  }}>
                    {friend?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>@{friend?.username}</div>
                    {friend?.full_name && (
                      <div style={{ color: '#6a8a6a', fontSize: '12px' }}>{friend?.full_name}</div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {message && (
          <p style={{ color: '#4CAF50', textAlign: 'center', marginTop: '16px' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}