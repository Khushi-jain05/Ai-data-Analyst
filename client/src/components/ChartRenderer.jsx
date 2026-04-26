import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const PALETTE = ['#06b6d4','#10b981','#a78bfa','#f97316','#f43f5e','#3b82f6','#fbbf24'];

export default function ChartRenderer({ data }) {
  const ref  = useRef(null);
  const inst = useRef(null);
  const { chartType='bar', title, insight, labels=[], values=[], xLabel, yLabel } = data;
  const isPie = chartType === 'pie' || chartType === 'doughnut';

  useEffect(() => {
    if (!ref.current) return;
    inst.current?.destroy();
    inst.current = new Chart(ref.current, {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label: title,
          data: values,
          backgroundColor: isPie ? PALETTE : chartType === 'line' ? '#06b6d422' : '#06b6d455',
          borderColor:     isPie ? PALETTE : '#06b6d4',
          borderWidth:  isPie ? 0 : 1.5,
          borderRadius: chartType === 'bar' ? 5 : 0,
          tension: 0.4,
          fill: chartType === 'line',
          pointBackgroundColor: '#06b6d4',
          pointRadius:      chartType === 'line' ? 3 : 0,
          pointHoverRadius: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: {
            display: isPie,
            position: 'right',
            labels: { color:'#9ca3af', font:{ size:11 }, boxWidth:10, padding:12 },
          },
          tooltip: {
            backgroundColor:'#1c2030', borderColor:'rgba(255,255,255,.1)', borderWidth:1,
            titleColor:'#f0f2f8', bodyColor:'#9ca3af', padding:10,
            callbacks: { label: ctx => { const v = ctx.parsed?.y ?? ctx.parsed; return typeof v==='number' && v>=1000 ? ` ${(v/1000).toFixed(1)}k` : ` ${v}`; }},
          },
        },
        scales: isPie ? {} : {
          x: { title:{ display:!!xLabel, text:xLabel, color:'#6b7280', font:{size:11} }, grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#6b7280', font:{size:11} } },
          y: { title:{ display:!!yLabel, text:yLabel, color:'#6b7280', font:{size:11} }, grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#6b7280', font:{size:11}, callback: v => v>=1000 ? `${(v/1000).toFixed(0)}k` : v } },
        },
      },
    });
    return () => inst.current?.destroy();
  }, [chartType, title, labels, values, isPie, xLabel, yLabel]);

  const exportPNG = () => {
    const a = document.createElement('a');
    a.href = ref.current.toDataURL(); a.download = `${title}.png`; a.click();
  };
  const exportCSV = () => {
    const csv = [['Label','Value'], ...labels.map((l,i) => [l, values[i]])].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
    a.download = `${title}.csv`; a.click();
  };

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:14, overflow:'hidden', maxWidth:520, width:'100%' }}>
      <div style={{ padding:'14px 16px 0' }}>
        <div style={{ fontSize:14, fontWeight:600 }}>{title}</div>
      </div>
      {insight && <div style={{ fontSize:12, color:'var(--muted)', padding:'6px 16px 10px', lineHeight:1.5 }}>{insight}</div>}
      <div style={{ padding:'0 16px 16px' }}>
        <div style={{ height:200, position:'relative' }}><canvas ref={ref}/></div>
      </div>
      <div style={{ display:'flex', gap:6, padding:'10px 16px', borderTop:'1px solid var(--border)' }}>
        {[['⬇ PNG', exportPNG], ['⬇ CSV', exportCSV], ['📋 Copy', () => navigator.clipboard?.writeText(JSON.stringify({ labels, values }))]].map(([label, fn]) => (
          <button key={label} onClick={fn} style={{ fontSize:11, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 10px', color:'var(--muted)', cursor:'pointer' }}>{label}</button>
        ))}
      </div>
    </div>
  );
}