import{useNavigate}from'react-router-dom'
const RULES=[
  {n:'I',title:'Identity',body:'Each citizen may hold one account. Duplicate accounts are grounds for permanent erasure. Your username represents your identity in the collective — choose wisely.'},
  {n:'II',title:'Social Credit',body:'All citizens begin with 100 Social Credit. Upvotes from comrades increase your score. Downvotes reduce it. Citizens with score ≤50 are automatically confined to the Gulag. Scores ≥100 may form Collectives. Scores ≥200 may form and join multiple Collectives.'},
  {n:'III',title:'The Gulag',body:'Citizens scoring 50 or below are automatically relocated to the Gulag. They may only post within Gulag walls. The Commissariat may also issue manual jail sentences for violations — suspending posting and commenting privileges for a set duration.'},
  {n:'IV',title:'The Smugglers\' Den',body:'The underground market is accessible to all brave enough to enter. Content within is unregulated by the Party, but citizens remain individually accountable. The Commissariat watches everything.'},
  {n:'V',title:'Conduct',body:'No threats, harassment, or targeted abuse. Posts and messages may be reported to the Commissariat. Repeated violations result in score deductions and Gulag confinement. The Party reserves the right to delete content without notice.'},
  {n:'VI',title:'Images & Media',body:'Images must be hosted at valid URLs (png, jpg, gif, webp). No malicious links. Uploaded files are scanned and compressed. The Party reserves the right to remove any media deemed a threat to collective harmony.'},
  {n:'VII',title:'Collectives',body:'Collectives (groups) are formed by citizens with ≥100 Social Credit. Founders may rename or dissolve their Collective at any time. All Collective activity is subject to the same rules as the general feed.'},
  {n:'VIII',title:'Privacy',body:'Direct messages are end-to-end in spirit, but the Commissariat may review flagged communications. Reports are taken seriously. Use DMs responsibly.'},
  {n:'IX',title:'The Commissariat',body:'Commissars have absolute authority. They may adjust credit scores, issue warnings, jail citizens, delete content, and broadcast Party directives. Their decisions are final. There is no appeal process.'},
  {n:'X',title:'Acknowledgement',body:'By registering, you acknowledge that this platform operates under the guidance of the Party. The Party provides structure, stability, and collective harmony. Individual freedoms exist within the bounds of collective good.'},
]
export default function Rules(){
  const navigate=useNavigate()
  return(
    <div className="rules-page">
      <div className="rules-wrap">
        <div className="rules-header">
          <div className="rules-emblem">☭</div>
          <h1>PARTY REGULATIONS</h1>
          <p>All citizens must comply. Ignorance is not an excuse before the Commissariat.</p>
        </div>
        <div className="rules-list">
          {RULES.map(r=>(
            <div key={r.n} className="rule-item">
              <div className="rule-num">Article {r.n}</div>
              <div className="rule-title">{r.title}</div>
              <div className="rule-body">{r.body}</div>
            </div>
          ))}
        </div>
        <div className="rules-footer">
          <p>These regulations are subject to change at the Party's discretion.</p>
          <p>Last revised by the Central Committee. ☭</p>
          <button className="primary" onClick={()=>navigate('/auth')}>I Understand — Register</button>
          <button className="ghost" onClick={()=>window.close()}>Close</button>
        </div>
      </div>
    </div>
  )
}
