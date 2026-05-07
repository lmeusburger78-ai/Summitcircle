'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'

export default function FeedPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState('')
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

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      setProfile(profileData)

      loadPosts()
    })
  }, [])

  async function loadPosts() {
    const supabase = createClient()
    const { data } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, username, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    setPosts(data || [])
  }

  async function handlePost() {
    if (!newPost.trim()) return
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        content: newPost.trim(),
      })

    if (error) {
      setMessage('Fehler beim Posten!')
    } else {
      setNewPost('')
      loadPosts()
    }
    setLoading(false)
  }

  async function handleDelete(postId: string) {
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', postId)
    loadPosts()
  }

  function formatDate(timestamp: string) {
    return new Date(timestamp).toLocaleDateString('de-AT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/friends" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>👥 Freunde</a>
          <a href="/chat" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>💬 Chat</a>
          <a href="/feed" style={{ color: '#4CAF50', fontSize: '14px', textDecoration: 'none', fontWeight: 'bold' }}>📰 Feed</a>
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>

        {/* Post erstellen */}
        <div style={{
          backgroundColor: '#162016',
          border: '1px solid #2a3d2a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0f1a0f',
              fontWeight: 'bold',
              fontSize: '18px',
              flexShrink: 0,
            }}>
              {profile?.username?.[0]?.toUpperCase()}
            </div>
            <textarea
              placeholder="Was hast du erlebt? 🏔️"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows={3}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #2a3d2a',
                backgroundColor: '#0f1a0f',
                color: 'white',
                fontSize: '14px',
                resize: 'none',
                fontFamily: 'Arial, sans-serif',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handlePost}
              disabled={loading || !newPost.trim()}
              style={{
                backgroundColor: newPost.trim() ? '#4CAF50' : '#2a3d2a',
                color: newPost.trim() ? '#0f1a0f' : '#6a8a6a',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '24px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: newPost.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? 'Posten...' : 'Posten 🚀'}
            </button>
          </div>
          {message && <p style={{ color: '#ff6b6b', marginTop: '8px', fontSize: '13px' }}>{message}</p>}
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#6a8a6a',
            padding: '40px',
            backgroundColor: '#162016',
            borderRadius: '12px',
            border: '1px solid #2a3d2a',
          }}>
            Noch keine Posts — sei der Erste! 🏔️
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} style={{
              backgroundColor: '#162016',
              border: '1px solid #2a3d2a',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
            }}>
              {/* Post Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    {post.author?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>@{post.author?.username}</div>
                    <div style={{ color: '#6a8a6a', fontSize: '11px' }}>{formatDate(post.created_at)}</div>
                  </div>
                </div>
                {post.author_id === user?.id && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#6a8a6a',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>

              {/* Post Content */}
              <p style={{ fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                {post.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}