export default function PostSkeleton() {
  return (
    <div className="skel-post">
      <div className="post-head">
        <div className="skel skel-av" />
        <div style={{ flex: 1 }}>
          <div className="skel skel-line" style={{ width: '38%' }} />
          <div className="skel skel-line" style={{ width: '22%', height: 10, marginTop: 5 }} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div className="skel skel-line" style={{ width: '100%' }} />
        <div className="skel skel-line" style={{ width: '87%' }} />
        <div className="skel skel-line" style={{ width: '62%' }} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="skel skel-line" style={{ width: 64, height: 28, marginBottom: 0 }} />
        <div className="skel skel-line" style={{ width: 64, height: 28, marginBottom: 0 }} />
        <div className="skel skel-line" style={{ width: 72, height: 28, marginBottom: 0 }} />
      </div>
    </div>
  )
}
