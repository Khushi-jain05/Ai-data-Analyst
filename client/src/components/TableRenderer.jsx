const STATUS = {
    'Active':   { bg:'#10b98120', color:'#10b981' },
    'At Risk':  { bg:'#f9731620', color:'#f97316' },
    'Inactive': { bg:'#f43f5e20', color:'#f43f5e' },
    'Premium':  { bg:'#a78bfa20', color:'#a78bfa' },
  };
  
  function Cell({ col, value }) {
    const s = STATUS[value];
    if ((col === 'Status' || col === 'status') && s) {
      return <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:500, background:s.bg, color:s.color }}>{value}</span>;
    }
    if (typeof value === 'number' && value > 100) {
      return <span style={{ color:'var(--accent)', fontWeight:500, fontVariantNumeric:'tabular-nums' }}>{value.toLocaleString()}</span>;
    }
    return value ?? '—';
  }
  
  export default function TableRenderer({ data }) {
    const { title, columns=[], rows=[] } = data;
  
    const exportCSV = () => {
      const csv = [columns, ...rows.map(r => columns.map(c => r[c] ?? ''))].map(r => r.join(',')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
      a.download = `${title}.csv`; a.click();
    };
  
    return (
      <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, overflow:'hidden', maxWidth:520, width:'100%' }}>
        <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontSize:14, fontWeight:600 }}>{title}</span>
          <span style={{ fontSize:11, color:'var(--hint)' }}>{rows.length} rows</span>
        </div>
        <div style={{ overflowX:'auto', maxHeight:220, overflowY:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr>{columns.map(c => (
                <th key={c} style={{ background:'var(--surface2)', padding:'7px 14px', textAlign:'left', fontWeight:600, color:'var(--muted)', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap', position:'sticky', top:0, zIndex:1 }}>{c}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map(c => (
                    <td key={c} style={{ padding:'7px 14px', color:'var(--text)', whiteSpace:'nowrap', borderBottom:'1px solid var(--border)' }}>
                      <Cell col={c} value={row[c]}/>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display:'flex', gap:6, padding:'10px 16px', borderTop:'1px solid var(--border)' }}>
          <button onClick={exportCSV} style={{ fontSize:11, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 10px', color:'var(--muted)', cursor:'pointer' }}>⬇ CSV</button>
          <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(rows))} style={{ fontSize:11, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 10px', color:'var(--muted)', cursor:'pointer' }}>📋 Copy</button>
        </div>
      </div>
    );
  }