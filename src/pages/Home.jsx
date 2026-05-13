import { useEffect, useRef, useState, useCallback } from 'react'
import api from '../api'
import Post from '../components/Post'
import PostForm from '../components/PostForm'
import PostSkeleton from '../components/PostSkeleton'

const PAGE_SIZE = 20
const SKELETONS = Array.from({ length: 5 }, (_, i) => i)

export default function Home() {
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [toast,   setToast]   = useState(null)
  const sentinelRef  = useRef(null)
  const loadingMore  = useRef(false)

  useEffect(() => {
    const ac = new AbortController()
    api.get('/posts?area=public', { signal: ac.signal })
      .then(({ data }) => { setPosts(data); setHasMore(data.length === PAGE_SIZE) })
      .catch(e => { if (e.code !== 'ERR_CANCELED') {} })
      .finally(() => setLoading(false))
    return () => ac.abort()
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore.current || !hasMore) return
    const oldest = posts[posts.length - 1]?.createdAt
    if (!oldest) return
    loadingMore.current = true
    try {
      const { data } = await api.get(`/posts?area=public&before=${encodeURIComponent(oldest)}`)
      setPosts(prev => { const ids = new Set(prev.map(p => p._id)); return [...prev, ...data.filter(p => !ids.has(p._id))] })
      setHasMore(data.length === PAGE_SIZE)
    } catch {}
    loadingMore.current = false
  }, [posts, hasMore])

  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver(entries => { if (entries[0].isIntersecting) loadMore() }, { threshold: 0.1 })
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [loadMore])

  return (
    <div className="page">
      <div className="ph"><div><h2>Public Feed</h2><p>All citizens are being evaluated.</p></div></div>
      <PostForm area="public" onPost={p => setPosts(prev => [p, ...prev])} onToast={setToast} />
      {toast && <div className="toast">{toast} <button className="ghost" onClick={() => setToast(null)}>✕</button></div>}
      {loading && SKELETONS.map(i => <PostSkeleton key={i} />)}
      {!loading && posts.length === 0 && <div className="empty">No posts yet.</div>}
      {posts.map(p => <Post key={p._id} post={p} onDelete={id => setPosts(prev => prev.filter(x => x._id !== id))} onToast={setToast} />)}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </div>
  )
}
