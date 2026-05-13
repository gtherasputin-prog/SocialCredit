import { useRef, useState } from 'react'
import api from '../api'

export default function PostForm({ area = 'public', group = null, onPost, onToast }) {
  const [content,      setContent]      = useState('')
  const [imageFile,    setImageFile]    = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading,      setLoading]      = useState(false)
  const fileRef = useRef(null)

  function handleImage(e) {
    const file = e.target.files?.[0]; if (!file) return
    if (!file.type.startsWith('image/')) return onToast?.('Only images allowed')
    if (file.size > 8 * 1024 * 1024) return onToast?.('Image too large (max 8MB)')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null); setImagePreview('')
  }

  async function submit() {
    if (!content.trim() && !imageFile) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('content', content.trim())
      fd.append('area', area)
      if (group) fd.append('group', group)
      if (imageFile) fd.append('image', imageFile)
      const { data } = await api.post('/posts', fd)
      onPost?.(data); setContent(''); clearImage()
    } catch (e) { onToast?.(e.response?.data?.error || 'Error') }
    setLoading(false)
  }

  return (
    <div className="pf">
      <div className="pf-label">Broadcast to the Party</div>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Speak, citizen..."
        maxLength={500}
        onKeyDown={e => e.ctrlKey && e.key === 'Enter' && submit()}
      />
      {imagePreview && (
        <div style={{ position: 'relative', display: 'inline-block', marginTop: 6 }}>
          <img src={imagePreview} alt="" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 6, display: 'block' }} />
          <button onClick={clearImage} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12, lineHeight: '22px', textAlign: 'center', padding: 0 }}>✕</button>
        </div>
      )}
      <div className="pf-foot">
        <div className="row">
          <button type="button" className={`attach-btn${imageFile ? ' has-file' : ''}`} onClick={() => fileRef.current?.click()} title="Attach image">+</button>
          {imageFile && <span style={{ fontSize: 13, color: 'var(--accent)' }}>{imageFile.name}</span>}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
          <span className="char-count">{content.length}/500</span>
        </div>
        <button className="primary" onClick={submit} disabled={loading || (!content.trim() && !imageFile)}>
          {loading ? '...' : 'Submit ☭'}
        </button>
      </div>
    </div>
  )
}
