import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import Navbar from '../components/Navbar';
import MessageBubble from '../components/MessageBubble';

const API = 'http://localhost:5000/api';

const SUGGESTIONS = [
  'Which product had the highest revenue?',
  'Show monthly sales as a line chart',
  'Top 10 customers by total value',
  'Revenue breakdown by region',
  'Compare Q1 vs Q2 performance',
  'Summarise overall data trends',
  'Generate an executive report',
];

const SOURCES = [
  { id:'csv',      label:'CSV / Excel',   icon:'📄' },
  { id:'postgres', label:'PostgreSQL',    icon:'🗄' },
  { id:'mysql',    label:'MySQL',         icon:'🐬' },
  { id:'sheets',   label:'Google Sheets', icon:'📊' },
  { id:'api',      label:'REST API',      icon:'🔌' },
];

export default function Chat() {
  const {
    dataset, messages, addMessage, clearChat, addHistory,
    loadDataset, navigate, uploadFile, uploading, uploadError, setUploadError,
  } = useApp();

  const [input,    setInput]   = useState('');
  const [loading,  setLoading] = useState(false);
  const bottomRef    = useRef(null);
  const textareaRef  = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // ── Send a chat message to the real backend ──────────────────────────────
  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    addMessage({ role: 'user', text });
    addHistory(text, dataset?.name || 'unknown');
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${API}/chat/message`,
        { message: text },
        { withCredentials: true }
      );
      // data = { type: 'show_chart' | 'show_table' | 'show_insight' | ..., data: {...} }
      addMessage({ role: 'ai', type: data.type, data: data.data });
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Something went wrong.';
      addMessage({
        role: 'ai', type: 'show_insight',
        data: { text: `⚠️ Error: ${errMsg}`, highlights: [] },
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Handle file picked via the + button ──────────────────────────────────
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset so the same file can be re-selected if needed
    e.target.value = '';
    await uploadFile(file);
  }, [uploadFile]);

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const grow  = (el) => { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 100) + 'px'; };

  const sbBtn = {
    width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px',
    borderRadius:8, background:'none', border:'none', color:'var(--muted)',
    fontSize:13, cursor:'pointer', textAlign:'left', fontFamily:'inherit',
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>
      <Navbar />

      <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', flex:1, overflow:'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{ borderRight:'1px solid var(--border)', background:'var(--surface)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

          <div style={{ padding:'14px 16px 12px', borderBottom:'1px solid var(--border)', fontSize:12, color:'var(--muted)', letterSpacing:'.6px', textTransform:'uppercase', fontWeight:600 }}>
            Data sources
          </div>

          {dataset && (
            <div style={{ padding:'10px 10px 0' }}>
              <div style={{ fontSize:10, color:'var(--hint)', letterSpacing:'.8px', textTransform:'uppercase', padding:'0 8px 6px', fontWeight:600 }}>Active</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'linear-gradient(90deg,#06b6d418,transparent)', borderLeft:'2px solid var(--accent)', borderRadius:'0 8px 8px 0', fontSize:13, color:'var(--accent)', fontWeight:500 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)', animation:'pulse 2s ease-in-out infinite', flexShrink:0 }}/>
                <span style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{dataset.name}</span>
                <span style={{ fontSize:10, background:'#10b98120', color:'var(--green)', padding:'2px 7px', borderRadius:10, flexShrink:0 }}>loaded</span>
              </div>
            </div>
          )}

          {/* Upload a new file from sidebar */}
          <div style={{ padding:'10px 10px 0' }}>
            <div style={{ fontSize:10, color:'var(--hint)', letterSpacing:'.8px', textTransform:'uppercase', padding:'0 8px 6px', fontWeight:600 }}>Upload file</div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display:'none' }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ ...sbBtn, color: uploading ? 'var(--hint)' : 'var(--muted)', cursor: uploading ? 'not-allowed' : 'pointer' }}
            >
              <span>📁</span>{uploading ? 'Uploading…' : 'Upload CSV / Excel'}
            </button>
            {uploadError && (
              <div style={{ fontSize:11, color:'var(--red)', padding:'4px 10px 6px', lineHeight:1.4 }}>
                {uploadError}
                <span onClick={() => setUploadError(null)} style={{ marginLeft:6, cursor:'pointer', opacity:.6 }}>✕</span>
              </div>
            )}
          </div>

          <div style={{ padding:'10px 10px 0' }}>
            <div style={{ fontSize:10, color:'var(--hint)', letterSpacing:'.8px', textTransform:'uppercase', padding:'0 8px 6px', fontWeight:600 }}>Connect new</div>
            {SOURCES.map(s => (
              <button key={s.id} style={sbBtn}
                onClick={() => loadDataset({ name:`${s.label} connection`, rowCount:0, columns:0, hints:[`${s.label} connected`] })}>
                <span>{s.icon}</span>{s.label}
              </button>
            ))}
          </div>

          <div style={{ height:1, background:'var(--border)', margin:'12px 10px' }}/>

          <div style={{ padding:'0 10px 10px', flex:1, overflowY:'auto' }}>
            <div style={{ fontSize:10, color:'var(--hint)', letterSpacing:'.8px', textTransform:'uppercase', padding:'0 4px 8px', fontWeight:600 }}>Suggestions</div>
            {SUGGESTIONS.map(q => (
              <button key={q} onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                style={{ width:'100%', textAlign:'left', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 10px', fontSize:12, color:'var(--muted)', cursor:'pointer', marginBottom:6, lineHeight:1.5, fontFamily:'inherit' }}>
                {q}
              </button>
            ))}
          </div>
        </aside>

        {/* ── Main chat area ── */}
        <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Topbar */}
          <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            {dataset ? (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:500 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', animation:'pulse 2s ease-in-out infinite' }}/>
                  {dataset.name}
                </div>
                {dataset.rowCount > 0 && (
                  <span style={{ fontSize:12, color:'var(--hint)' }}>
                    {dataset.rowCount.toLocaleString()} rows · {dataset.columns} columns
                  </span>
                )}
              </>
            ) : (
              <span style={{ fontSize:12, color:'var(--hint)' }}>No dataset loaded — upload a file to begin</span>
            )}
            <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
              <button onClick={clearChat} style={{ background:'none', border:'1px solid var(--border2)', borderRadius:8, padding:'5px 12px', fontSize:12, color:'var(--muted)', cursor:'pointer' }}>Clear chat</button>
              <button onClick={() => navigate('home')} style={{ background:'none', border:'1px solid var(--border2)', borderRadius:8, padding:'5px 12px', fontSize:12, color:'var(--muted)', cursor:'pointer' }}>← Home</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:16 }}>
            {messages.length === 0 && !loading && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'var(--hint)', textAlign:'center' }}>
                <div style={{ fontSize:32 }}>⬡</div>
                <p style={{ fontSize:14 }}>
                  {dataset ? 'Ask me anything about your data' : 'Upload a file or connect a data source to get started'}
                </p>
              </div>
            )}
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {(loading || uploading) && (
              <div style={{ display:'flex', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#06b6d433,#3b82f633)', border:'1px solid #06b6d433', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--accent)', flexShrink:0 }}>⬡</div>
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:14, display:'flex', gap:5, alignItems:'center' }}>
                  {[0, .2, .4].map((d, i) => (
                    <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', animation:`tdot 1.2s ease-in-out ${d}s infinite` }}/>
                  ))}
                  {uploading && <span style={{ fontSize:12, color:'var(--muted)', marginLeft:8 }}>Uploading file…</span>}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input bar */}
          <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
            {/* Hidden file input triggered by the + button */}
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display:'none' }}
              id="chat-file-input"
              onChange={handleFileChange}
            />

            <div style={{ display:'flex', alignItems:'flex-end', gap:10, background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:12, padding:'4px 6px 4px 16px' }}>
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                placeholder={dataset ? 'Ask anything about your data…' : 'Upload a file first, then ask questions…'}
                onChange={e => { setInput(e.target.value); grow(e.target); }}
                onKeyDown={onKey}
                style={{ flex:1, background:'none', border:'none', color:'var(--text)', fontSize:13, resize:'none', outline:'none', padding:'9px 0', maxHeight:100, fontFamily:'inherit' }}
              />
              <div style={{ display:'flex', alignItems:'center', gap:6, paddingBottom:4 }}>
                {/* + button → triggers file upload */}
                <button
                  title="Upload CSV or Excel file"
                  onClick={() => document.getElementById('chat-file-input')?.click()}
                  disabled={uploading}
                  style={{ width:30, height:30, borderRadius:7, background:'none', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor: uploading ? 'not-allowed' : 'pointer', color:'var(--muted)', fontSize:16, fontWeight:400 }}
                >+</button>
                <button style={{ width:30, height:30, borderRadius:7, background:'none', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--muted)', fontSize:13 }}>🎙</button>
                <button
                  onClick={send}
                  disabled={loading || uploading || !input.trim()}
                  style={{
                    width:34, height:34, borderRadius:9,
                    background: (loading || uploading || !input.trim()) ? 'var(--surface3)' : 'var(--accent)',
                    border:'none',
                    cursor: (loading || uploading || !input.trim()) ? 'not-allowed' : 'pointer',
                    color:  (loading || uploading || !input.trim()) ? 'var(--hint)' : '#0d0f14',
                    fontSize:15, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
                  }}
                >→</button>
              </div>
            </div>

            {/* Show upload error in the input area too */}
            {uploadError && (
              <div style={{ fontSize:11, color:'var(--red)', marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                ⚠️ {uploadError}
                <span onClick={() => setUploadError(null)} style={{ cursor:'pointer', opacity:.7 }}>✕</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
