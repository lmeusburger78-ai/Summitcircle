'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase'

type Tab = 'new_all' | 'new_friends' | 'trending_all' | 'trending_friends'

export default function FeedPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('new_all')
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [comments, setComments] = useState<{ [key: string]: any[] }>({})
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({})
  const [likes, setLikes] = useState<{ [key: string]: number }>({})
  const [likedByMe, setLikedByMe] = useState<{ [key: string]: boolean }>({})
  const [friendIds, setFriendIds] = useState<string[]>([])

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

      const { data: friendData } = await supabase
        .from('friendships')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${data.user.id},receiver_id.eq.${data.user.id}`)

      const ids = (friendData || []).map((f: any) =>
        f.sender_id === data.user.id ? f.receiver_id : f.sender_id
      )
      const allIds = [...ids, data.user.id]
      setFriendIds(allIds)
      loadPosts('new_all', allIds, data.user.id)
    })
  }, [])

  useEffect(() => {
    if (user && friendIds.length > 0) {
      loadPosts(activeTab, friendIds, user.id)
    }
  }, [activeTab])

  async function loadPosts(tab: Tab, fIds: string[], userId: string) {
    const supabase = createClient()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('posts')
      .select(`*, author:profiles!posts_author_id_fkey(id, username)`)

    if (tab === 'new_friends' || tab === 'trending_friends') {
      query = query.in('author_id', fIds)
    }

    query = query.order('created_at', { ascending: false }).limit(50)

    const { data } = await query
    if (!data) return

    const likeCounts: { [key: string]: number } = {}
    const likedMap: { [key: string]: boolean } = {}
    const trendingScores: { [key: string]: number } = {}

    for (const post of data) {
      // Alle Likes
      const { data: likeData } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', post.id)

      // Likes der letzten 7 Tage
      const { data: recentLikes } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .gte('created_at', sevenDaysAgo)

      // Kommentare der letzten 7 Tage
      const { data: recentComments } = await supabase
        .from('post_comments')
        .select('id')
        .eq('post_id', post.id)
        .gte('created_at', sevenDaysAgo)

      likeCounts[post.id] = likeData?.length || 0
      likedMap[post.id] = likeData?.some((l: any) => l.user_id === userId) || false
      trendingScores[post.id] = (recentLikes?.length || 0) + (recentComments?.length || 0)
    }

    setLikes(likeCounts)
    setLikedByMe(likedMap)

    // Trending: sortiere nach Score der letzten 7 Tage
    let sorted = [...data]
    if (tab === 'trending_all' || tab === 'trending_friends') {
      sorted = sorted.sort((a, b) => {
        return (trendingScores[b.id] || 0) - (trendingScores[a.id] || 0)
      })
    }

    setPosts(sorted)
  }

  async function handlePost() {
    if (!newPost.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('posts').insert({ author_id: user.id, content: newPost.trim() })
    setNewPost('')
    loadPosts(activeTab, friendIds, user.id)
    setLoading(false)
  }

  async function handleDelete(postId: string) {
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', postId)
    loadPosts(activeTab, friendIds, user.id)
  }

  async function handleLike(postId: string) {
    const supabase = createClient()
    if (likedByMe[postId]) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id)
      setLikes((prev) => ({ ...prev, [postId]: (prev[postId] || 1) - 1 }))
      setLikedByMe((prev) => ({ ...prev, [postId]: false }))
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
      setLikes((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }))
      setLikedByMe((prev) => ({ ...prev, [postId]: true }))
    }
  }

  async function loadComments(postId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('post_comments')
      .select(`*, author:profiles!post_comments_author_id_fkey(username)`)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    setComments((prev) => ({ ...prev, [postId]: data || [] }))
  }

  async function handleComment(postId: string) {
    if (!newComment[postId]?.trim()) return
    const supabase = createClient()
    await supabase.from('post_comments').insert({
      post_id: postId,
      author_id: user.id,
      content: newComment[postId].trim(),
    })
    setNewComment((prev) => ({ ...prev, [postId]: '' }))
    loadComments(postId)
  }

  function toggleComments(postId: string) {
    if (expandedPost === postId) {
      setExpandedPost(null)
    } else {
      setExpandedPost(postId)
      loadComments(postId)
    }
  }

  function formatDate(timestamp: string) {
    return new Date(timestamp).toLocaleDateString('de-AT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const tabs = [
    { id: 'new_all', label: '🆕 Neu' },
    { id: 'new_friends', label: '👥 Freunde' },
    { id: 'trending_all', label: '🔥 Trending' },
    { id: 'trending_friends', label: '🔥 Freunde Trending' },
  ]

  return (
    <div style={{ backgroundColor: '#0f1a0f', minHeight: '100vh', fontFamily: 'Arial, sans-serif', color: '#e8f5e8' }}>
      <nav style={{ backgroundColor: '#162016', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #2a3d2a' }}>
        <a href="/" style={{ color: '#4CAF50', fontSize: '20px', fontWeight: 'bold', textDecoration: 'none' }}>SummitCircle 🏔️</a>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/friends" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>👥 Freunde</a>
          <a href="/chat" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>💬 Chat</a>
          <a href="/feed" style={{ color: '#4CAF50', fontSize: '14px', textDecoration: 'none', fontWeight: 'bold' }}>📰 Feed</a>
          <a href="/tours" style={{ color: '#a0b8a0', fontSize: '14px', textDecoration: 'none' }}>🗺️ Touren</a>
        </div>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>

        {/* Post erstellen */}
        <div style={{ backgroundColor: '#162016', border: '1px solid #2a3d2a', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f1a0f', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>
              {profile?.username?.[0]?.toUpperCase()}
            </div>
            <textarea
              placeholder="Was hast du erlebt? 🏔️"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows={3}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #2a3d2a', backgroundColor: '#0f1a0f', color: 'white', fontSize: '14px', resize: 'none', fontFamily: 'Arial, sans-serif' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handlePost} disabled={loading || !newPost.trim()} style={{ backgroundColor: newPost.trim() ? '#4CAF50' : '#2a3d2a', color: newPost.trim() ? '#0f1a0f' : '#6a8a6a', border: 'none', padding: '10px 24px', borderRadius: '24px', fontWeight: 'bold', fontSize: '14px', cursor: newPost.trim() ? 'pointer' : 'not-allowed' }}>
              {loading ? 'Posten...' : 'Posten 🚀'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              style={{
                backgroundColor: activeTab === tab.id ? '#4CAF50' : '#162016',
                color: activeTab === tab.id ? '#0f1a0f' : '#a0b8a0',
                border: '1px solid #2a3d2a',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6a8a6a', padding: '40px', backgroundColor: '#162016', borderRadius: '12px', border: '1px solid #2a3d2a' }}>
            Noch keine Posts hier 🏔️
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} style={{ backgroundColor: '#162016', border: '1px solid #2a3d2a', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f1a0f', fontWeight: 'bold' }}>
                    {post.author?.username?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>@{post.author?.username}</div>
                    <div style={{ color: '#6a8a6a', fontSize: '11px' }}>{formatDate(post.created_at)}</div>
                  </div>
                </div>
                {post.author_id === user?.id && (
                  <button onClick={() => handleDelete(post.id)} style={{ backgroundColor: 'transparent', color: '#6a8a6a', border: 'none', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                )}
              </div>

              <p style={{ fontSize: '15px', lineHeight: '1.6', margin: '0 0 12px 0' }}>{post.content}</p>

              <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #2a3d2a', paddingTop: '12px' }}>
                <button onClick={() => handleLike(post.id)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: likedByMe[post.id] ? '#4CAF50' : '#6a8a6a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
                  {likedByMe[post.id] ? '❤️' : '🤍'} {likes[post.id] || 0}
                </button>
                <button onClick={() => toggleComments(post.id)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#6a8a6a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
                  💬 {comments[post.id]?.length || 0} Kommentare
                </button>
              </div>

              {expandedPost === post.id && (
                <div style={{ marginTop: '12px', borderTop: '1px solid #2a3d2a', paddingTop: '12px' }}>
                  {comments[post.id]?.length === 0 ? (
                    <p style={{ color: '#6a8a6a', fontSize: '13px', marginBottom: '12px' }}>Noch keine Kommentare</p>
                  ) : (
                    comments[post.id]?.map((c) => (
                      <div key={c.id} style={{ padding: '8px 12px', backgroundColor: '#0f1a0f', borderRadius: '8px', marginBottom: '6px' }}>
                        <span style={{ color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>@{c.author?.username}</span>
                        <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>{c.content}</p>
                      </div>
                    ))
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="Kommentar schreiben..."
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid #2a3d2a', backgroundColor: '#0f1a0f', color: 'white', fontSize: '13px' }}
                    />
                    <button onClick={() => handleComment(post.id)} style={{ backgroundColor: '#4CAF50', color: '#0f1a0f', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Senden
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}