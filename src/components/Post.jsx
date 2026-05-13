import { memo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../api'

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`
}

const Post = memo(function Post({ post: init, onDelete, onToast }) {
  const [post,         setPost]         = useState(init)
  const [popping,      setPopping]      = useState(null)
  const [reporting,    setReporting]    = useState(false)
  const [comments,     setComments]     = useState([])
  const [showComments, setShowComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [loadingCmts,  setLoadingCmts]  = useState(false)
  const [imgLb,        setImgLb]        = useState(null)
  /* commentCount from server — already accurate, no need to fetch comments first */
  const [commentCount, setCommentCount] = useState(init.commentCount || 0)
  const me   = useSelector(s => s.auth.user)
  const navigate = useNavigate()
  const myId = me?._id

  const upOn   = post.upvotes?.some(id => id === myId || id?._id === myId)
  const downOn = post.downvotes?.some(id => id === myId || id?._id === myId)

  const vote = useCallback(async type => {
    setPopping(type); setTimeout(() => setPopping(null), 350)
    const next = { ...post, upvotes: [...(post.upvotes || [])], downvotes: [...(post.downvotes || [])] }
    const inUp = next.upvotes.some(id => (id._id || id).toString() === myId), inDown = next.downvotes.some(id => (id._id || id).toString() === myId)
    if (type === 'up') { next.downvotes = next.downvotes.filter(id => (id._id || id).toString() !== myId); next.upvotes = inUp ? next.upvotes.filter(id => (id._id || id).toString() !== myId) : [...next.upvotes, myId] }
    else { next.upvotes = next.upvotes.filter(id => (id._id || id).toString() !== myId); next.downvotes = inDown ? next.downvotes.filter(id => (id._id || id).toString() !== myId) : [...next.downvotes, myId] }
    setPost(next)
    try { await api.post(`/posts/${post._id}/vote`, { type }) } catch { setPost(init) }
  }, [post, myId, init])

  const report = useCallback(async () => {
    setReporting(true)
    try { const { data } = await api.post(`/posts/${post._id}/report`, { reason: 'Suspicious activity' }); onToast?.(data.message) }
    catch (e) { onToast?.(e.response?.data?.error || 'Error') }
    setReporting(false)
  }, [post._id, onToast])

  const del = useCallback(async () => {
    if (!window.confirm('Delete this post?')) return
    await api.delete(`/posts/${post._id}`); onDelete?.(post._id)
  }, [post._id, onDelete])

  const toggleComments = useCallback(async () => {
    const next = !showComments; setShowComments(next)
    if (next && comments.length === 0) {
      setLoadingCmts(true)
      try { const { data } = await api.get(`/posts/${post._id}/comments`); setComments(data); setCommentCount(data.length) }
      catch {}
      setLoadingCmts(false)
    }
  }, [showComments, post._id, comments.length])

  const addComment = useCallback(async () => {
    const text = commentInput.trim(); if (!text) return
    try {
      const { data } = await api.post(`/posts/${post._id}/comments`, { content: text })
      setComments(prev => [...prev, data]); setCommentCount(prev => prev + 1); setCommentInput('')
    } catch (e) { onToast?.(e.response?.data?.error || 'Error') }
  }, [commentInput, post._id, onToast])

  const deleteComment = useCallback(async id => {
    try { await api.delete(`/posts/${post._id}/comments/${id}`); setComments(prev => prev.filter(c => c._id !== id)); setCommentCount(prev => Math.max(0, prev - 1)) }
    catch {}
  }, [post._id])

  const author = post.author, sc = author?.creditScore
  const scoreClass = sc >= 150 ? 's-great' : sc >= 80 ? 's-ok' : sc >= 30 ? 's-warn' : 's-bad'

  return (
    <div className="post">
      {imgLb && <div className="lb-overlay" onClick={() => setImgLb(null)}><img src={imgLb} alt="" onClick={e => e.stopPropagation()} loading="lazy" /></div>}
      <div className="post-head">
        <div className="av" style={{ cursor:'pointer' }} onClick={() => navigate(`/profile/${author?.username}`)}>
          {author?.avatar ? <img src={author.avatar} alt="" loading="lazy" /> : '👤'}
        </div>
        <div>
          <span className="post-author" style={{ cursor:'pointer' }} onClick={() => navigate(`/profile/${author?.username}`)}>{author?.username}</span>
          {author?.jailed && <span className="jailed-chip">JAILED</span>}
          <span className={`score-chip ${scoreClass}`} style={{ marginLeft:5 }}>★ {sc}</span>
          <div className="post-meta">{timeAgo(post.createdAt)}{post.group && ` · ${post.group.name}`}</div>
        </div>
      </div>
      <div className="post-body">{post.content}</div>
      {post.image && <div style={{ marginBottom:10 }}><img src={post.image} alt="attachment" loading="lazy" style={{ width:'100%', maxHeight:300, objectFit:'contain', border:'1px solid var(--border)', cursor:'pointer' }} onClick={() => setImgLb(post.image)} /></div>}
      <div className="post-foot">
        <button className={`vote-btn${upOn ? ' up-on' : ''} ${popping === 'up' ? 'popping' : ''}`} onClick={() => vote('up')}>⬆ <span className="vote-count">+{post.upvotes?.length || 0}</span></button>
        <button className={`vote-btn${downOn ? ' down-on' : ''} ${popping === 'down' ? 'popping' : ''}`} onClick={() => vote('down')}>⬇ <span className="vote-count">-{post.downvotes?.length || 0}</span></button>
        <button className="report-btn" onClick={report} disabled={reporting}>☭ Report</button>
        <button className="report-btn" onClick={toggleComments}>💬 {commentCount}</button>
        {author?._id === myId && <button className="ghost" style={{ fontSize:12, marginLeft:'auto', color:'var(--red)' }} onClick={del}>✕</button>}
      </div>
      {showComments && (
        <div className="comments-wrap">
          {loadingCmts && <div className="post-meta">Loading...</div>}
          {!loadingCmts && comments.map(c => (
            <div className="comment-row" key={c._id}>
              <span><strong>{c.author?.username || 'Citizen'}:</strong> {c.content}</span>
              {(c.author?._id === myId || c.author === myId) && <button className="ghost" style={{ fontSize:11, color:'var(--red)' }} onClick={() => deleteComment(c._id)}>✕</button>}
            </div>
          ))}
          {!loadingCmts && comments.length === 0 && <div className="post-meta">No comments yet.</div>}
          <div className="comment-form">
            <input value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="Write a comment..." onKeyDown={e => e.key === 'Enter' && addComment()} />
            <button onClick={addComment}>Post</button>
          </div>
        </div>
      )}
    </div>
  )
})

export default Post
