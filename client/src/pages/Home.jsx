import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import Navbar from '../components/Navbar';

const QUICK_ACTIONS = [
  { icon:'📊', label:'Analyze a dataset'   },
  { icon:'📋', label:'Summarize insights'  },
  { icon:'🗄️', label:'Query your database' },
  { icon:'📈', label:'Visualize trends'    },
  { icon:'📄', label:'Generate a report'   },
];

// These are demo tiles — clicking them loads hardcoded metadata.
// Replace with real file references once you have a backend file registry.
const RECENT_FILES = [
  { name:'Q1_Sales_Report.csv',    time:'2h ago', icon:'📊', rowCount:1247, columns:8,
    hints:['Revenue data Jan–Mar 2024','5 product lines, 4 regions','312 unique customers'] },
  { name:'Customer_Segments.xlsx', time:'5h ago', icon:'📗', rowCount:3420, columns:12,
    hints:['Customer segmentation data','RFM scores + lifetime value','Churn probability included'] },
  { name:'Revenue_Analysis.json',  time:'1d ago', icon:'📄', rowCount:890,  columns:6,
    hints:['Monthly revenue breakdown','YoY comparison data','Product-line granularity'] },
];

const SOURCES = [
  { id:'csv',    label:'CSV',     icon:'📄', bg:'#10b98122', color:'#10b981' },
  { id:'sql',    label:'SQL',     icon:'🗄', bg:'#3b82f622', color:'#60a5fa' },
  { id:'excel',  label:'Excel',   icon:'📗', bg:'#16a34a22', color:'#4ade80' },
  { id:'json',   label:'JSON',    icon:'{}', bg:'#f9731622', color:'#fb923c' },
  { id:'api',    label:'API',     icon:'🔌', bg:'#a78bfa22', color:'#a78bfa' },
  { id:'sheets', label:'GSheets', icon:'📊', bg:'#06b6d422', color:'#06b6d4' },
];

const RECENT_CONVOS = [
  { q:'Show me top 10 customers by revenue', time:'3h ago', dot:'#06b6d4' },
  { q:'Compare Q1 vs Q2 performance',        time:'1d ago', dot:'#a78bfa' },
  { q:'Revenue breakdown by region',         time:'2d ago', dot:'#10b981' },
];

export default function Home() {
  const { loadDataset, addMessage, navigate, uploadFile, uploading, uploadError, setUploadError } = useApp();
  const [query, setQuery] = useState('');
  const fileInputRef = useRef(null);
  // Drag state for the search box drop zone
  const [dragging, setDragging] = useState(false);

  // Start a chat with demo data + an optional first message
  const startDemoChat = (text = query) => {
    if (!text.trim()) return;
    loadDataset({
      name:'Q1_Sales_Report.csv', rowCount:1247, columns:8,
      hints:['Revenue data Jan–Mar 2024','5 product lines, 4 regions','312 unique customers'],
    });
    setTimeout(() => addMessage({ role:'user', text }), 80);
  };

  // Handle a real file selected via the upload button or dropped on the box
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    await uploadFile(file);
    // uploadFile sets page to 'chat' on success via AppContext
  }, [uploadFile]);

  const onFileInputChange = (e) => {
    handleFile(e.target.files[0]);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const card = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:18 };
  const cardHead = { display:'flex', alignItems:'center', gap:8, marginBottom:14, fontSize:13, color:'var(--muted)', fontWeight:500 };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)', animation:'fadeIn .2s ease' }}>
      <Navbar />

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px 40px', gap:28, overflowY:'auto' }}>

        {/* Greeting */}
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:42, fontWeight:700, letterSpacing:'-.6px', lineHeight:1.1 }}>Good morning</div>
          <div style={{ fontSize:36, fontWeight:400, color:'var(--muted)', marginTop:4, letterSpacing:'-.3px' }}>What can I help you with today?</div>
        </div>

        {/* Search / upload box */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            width:'100%', maxWidth:680,
            background: dragging ? 'var(--surface2)' : 'var(--surface)',
            border:`1px solid ${dragging ? 'var(--accent)' : 'var(--border2)'}`,
            borderRadius:16, overflow:'hidden', transition:'border-color .15s, background .15s',
          }}
        >
          <input
            style={{ width:'100%', padding:'18px 20px 10px', background:'none', border:'none', color:'var(--text)', fontSize:15, outline:'none' }}
            placeholder="Ask anything, or drop a CSV / Excel file here…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && startDemoChat()}
          />

          {/* Error banner inside the box */}
          {uploadError && (
            <div style={{ fontSize:12, color:'var(--red)', padding:'0 20px 8px', display:'flex', gap:6, alignItems:'center' }}>
              ⚠️ {uploadError}
              <span onClick={() => setUploadError(null)} style={{ cursor:'pointer', opacity:.6 }}>✕</span>
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', padding:'6px 12px 12px', gap:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:20, padding:'5px 12px', fontSize:12, color:'var(--accent)', cursor:'pointer', fontWeight:500 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Smart <span style={{ color:'var(--hint)', fontSize:10, marginLeft:2 }}>▾</span>
            </div>

            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display:'none' }}
                onChange={onFileInputChange}
              />

              {/* + button → open file picker */}
              <button
                title="Upload a CSV or Excel file"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ width:32, height:32, borderRadius:8, background:'none', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', cursor: uploading ? 'not-allowed' : 'pointer', color: uploading ? 'var(--hint)' : 'var(--accent)', fontSize:18, fontWeight:300 }}
              >+</button>

              <button style={{ width:32, height:32, borderRadius:8, background:'none', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--muted)', fontSize:14 }}>🎙</button>
              <button style={{ width:32, height:32, borderRadius:8, background:'none', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--muted)', fontSize:14 }}>🔗</button>

              <button
                onClick={() => startDemoChat()}
                disabled={uploading}
                style={{ width:36, height:36, borderRadius:10, background:'var(--accent)', border:'none', color:'#0d0f14', fontSize:16, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? .5 : 1 }}
              >{uploading ? '…' : '→'}</button>
            </div>
          </div>

          {uploading && (
            <div style={{ fontSize:12, color:'var(--accent)', padding:'0 20px 10px', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--accent)', animation:'pulse 1s ease-in-out infinite' }}/>
              Uploading and parsing file…
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8, maxWidth:680 }}>
          {QUICK_ACTIONS.map(a => (
            <button key={a.label} onClick={() => startDemoChat(a.label)}
              style={{ display:'flex', alignItems:'center', gap:7, background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:10, padding:'8px 16px', fontSize:13, color:'var(--muted)', cursor:'pointer' }}>
              <span style={{ fontSize:14 }}>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>

        {/* 3 bottom cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, width:'100%', maxWidth:900 }}>

          {/* Recent files — clicking these loads demo metadata. Drag a real file onto the box above to load your own data. */}
          <div style={card}>
            <div style={cardHead}><span>⬆</span> Recent files <span style={{ fontSize:10, color:'var(--hint)', marginLeft:'auto' }}>demo</span></div>
            {RECENT_FILES.map(f => (
              <div key={f.name} onClick={() => loadDataset(f)}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', cursor:'pointer' }}>
                <div style={{ width:28, height:28, borderRadius:7, background: f.name.endsWith('.csv')?'#10b98118':f.name.endsWith('.xlsx')?'#3b82f618':'#f9731618', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>{f.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color:'var(--text)', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.name}</div>
                  <div style={{ fontSize:11, color:'var(--hint)', marginTop:1 }}>{f.time}</div>
                </div>
              </div>
            ))}
            {/* Real upload shortcut */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ marginTop:8, width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'7px', background:'var(--surface2)', border:'1px dashed var(--border2)', borderRadius:8, fontSize:12, color:'var(--accent)', cursor:'pointer' }}
            >+ Upload your own file</button>
          </div>

          {/* Connect data sources */}
          <div style={card}>
            <div style={cardHead}><span>⬡</span> Connect data sources</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {SOURCES.map(s => (
                <div key={s.id}
                  onClick={() => loadDataset({ name:`${s.label} connection`, rowCount:2500, columns:10, hints:[`Connected to ${s.label}`,'Ready to query'] })}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'10px 6px', background:'var(--surface2)', borderRadius:10, cursor:'pointer', border:'1px solid transparent' }}>
                  <div style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, background:s.bg, color:s.color }}>{s.icon}</div>
                  <span style={{ fontSize:11, color:'var(--muted)', fontWeight:500 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent conversations */}
          <div style={card}>
            <div style={cardHead}><span>🕐</span> Recent conversations</div>
            {RECENT_CONVOS.map(c => (
              <div key={c.q} onClick={() => startDemoChat(c.q)}
                style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', cursor:'pointer' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:c.dot, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, flexShrink:0, marginTop:1, color:'rgba(0,0,0,.5)' }}>⬡</div>
                <div>
                  <div style={{ fontSize:13, color:'var(--text)', fontWeight:500, lineHeight:1.4 }}>{c.q}</div>
                  <div style={{ fontSize:11, color:'var(--hint)', marginTop:2 }}>{c.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign:'center', padding:12, fontSize:11, color:'var(--hint)', flexShrink:0 }}>
        AI may produce inaccurate results. Verify important data.
      </div>
    </div>
  );
}
