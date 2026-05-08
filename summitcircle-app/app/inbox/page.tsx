'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'

export default function InboxPage() {
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = '/login'
        return
      }
      setUser(data.user)
      loadNotifications(data.user.id)
    })
  }, [])

  async function loadNotifications(userId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(id, username)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotifications(data || [])
    setUnreadCount(data?.filter((n: any) => !n.read).length || 0)
    setLoading(false)
  }

  async function markAllRead() {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  async function deleteNotification(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  function getIcon(type: string) {
    switch (type) {
      case 'like': return '❤️'
      case 'comment': return '💬'
      case 'tour_request': return '🗺️'
      case 'tour_confirmed': return '✅'
      case 'tour_rejected': return '❌'
      case 'friend_request': return '👥'
      case 'friend_accepted': return '🤝'
      case 'tour_comment': return '💬'
      default: return '🔔'
    }
  }

  function formatDate(timestamp: string) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (minutes < 1) return 'Gerade eben'
    if (minutes < 60) return `vor ${minutes} Min.`
    if (hours < 24) return `vor ${hours} Std.`
    if (days < 7) return `vor ${days} Tag${days > 1 ? 'en' : ''}`
    return date.toLocaleDateString('de-AT')
  }

  return (
    <div style={{ backgroundColor: '#0f1a0f', minHeight: '100vh', fontFamily: 'Arial, sans-serif', color: '#e8f5e8' }}>
      <nav style={{ backgroundColor: '#162016', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a3d2a' }}>
        <a href="/" style={{ color: '#4CAF50', fontSize: '20px', fontWeight: 'bold', textDecoration: 'none' }}>SummitCircle 🏔️</a>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/friends" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>👥 Freunde</a>
          <a href="/chat" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>💬 Chat</a>
          <a href="/feed" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>📰 Feed</a>
          <a href="/tours" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>🗺️ Touren</a>
          <a href="/inbox" style={{ color: '#4CAF50', fontSize: '14px', textDecoration: 'none', fontWeight: 'bold' }}>
            🔔 Inbox {unreadCount > 0 && <span style={{ backgroundColor: '#ff4444', color: 'white', borderRadius: '10px', padding: '1px 6px', fontSize: '11px', marginLeft: '4px' }}>{unreadCount}</span>}
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', color: '#4CAF50' }}>
            🔔 Inbox
            {unreadCount > 0 && (
              <span style={{ backgroundColor: '#ff4444', color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: '14px', marginLeft: '10px' }}>
                {unreadCount} neu
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ backgroundColor: 'transparent', color: '#4CAF50', border: '1px solid #4CAF50', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer' }}>
              Alle gelesen
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#6a8a6a', padding: '40px' }}>Laden...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6a8a6a', padding: '40px', backgroundColor: '#162016', borderRadius: '12px', border: '1px solid #2a3d2a' }}>
            Noch keine Benachrichtigungen 🔔
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => { if (!n.read) markRead(n.id); if (n.link) window.location.href = n.link }}
              style={{
                backgroundColor: n.read ? '#162016' : '#1a2e1a',
                border: n.read ? '1px solid #2a3d2a' : '1px solid #4CAF50',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '8px',
                cursor: n.link ? 'pointer' : 'default',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                <span style={{ fontSize: '24px', flexShrink: 0 }}>{getIcon(n.type)}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{n.title}</span>
                    {!n.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4CAF50', display: 'inline-block' }} />}
                  </div>
                  <p style={{ color: '#a0b8a0', fontSize: '13px', margin: '0 0 6px 0', lineHeight: '1.4' }}>{n.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {n.actor?.username && (
                      <a href={`/user/${n.actor.username}`} onClick={(e) => e.stopPropagation()} style={{ color: '#4CAF50', fontSize: '12px', textDecoration: 'none' }}>
                        @{n.actor.username}
                      </a>
                    )}
                    <span style={{ color: '#6a8a6a', fontSize: '11px' }}>{formatDate(n.created_at)}</span>
                  </div>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }} style={{ backgroundColor: 'transparent', border: 'none', color: '#6a8a6a', cursor: 'pointer', fontSize: '16px', flexShrink: 0 }}>
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}