export default function InsightCard({ data }) {
    const { text = '', highlights = [] } = data;
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text);font-weight:600">$1</strong>')
      .replace(/\n/g, '<br/>');
  
    return (
      <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, padding:16, maxWidth:500 }}>
        <div style={{ fontSize:13, lineHeight:1.75, color:'#9ca3af' }} dangerouslySetInnerHTML={{ __html: html }}/>
        {highlights.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:12 }}>
            {highlights.map((h, i) => (
              <div key={i} style={{ display:'flex', gap:8, fontSize:12, color:'var(--muted)', lineHeight:1.5 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--accent)', flexShrink:0, marginTop:6 }}/>
                {h}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }