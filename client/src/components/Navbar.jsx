import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { navigate } = useApp();
  return (
    <nav style={{ display:'flex', alignItems:'center', padding:'14px 24px', borderBottom:'1px solid var(--border)', flexShrink:0, zIndex:10 }}>
      <div onClick={() => navigate('home')} style={{ display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:16, letterSpacing:'-.3px', cursor:'pointer' }}>
        <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#06b6d4,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⬡</div>
        DataAI
      </div>
      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:16 }}>
        <button onClick={() => navigate('history')} style={{ fontSize:13, color:'var(--muted)', background:'none', border:'none', cursor:'pointer' }}>History</button>
        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, cursor:'pointer' }}>U</div>
      </div>
    </nav>
  );
}
