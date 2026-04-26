import ChartRenderer from './ChartRenderer';
import TableRenderer  from './TableRenderer';
import InsightCard    from './InsightCard';

export default function MessageBubble({ msg }) {
  if (msg.role === 'user') {
    return (
      <div style={{ display:'flex', gap:10, flexDirection:'row-reverse', animation:'msgIn .25s ease' }}>
        <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, marginTop:2, color:'#fff' }}>U</div>
        <div style={{ background:'linear-gradient(135deg,#1e40af,#0e7490)', borderRadius:12, padding:'12px 14px', fontSize:13, lineHeight:1.65, maxWidth:480, color:'#fff' }}>
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', gap:10, animation:'msgIn .25s ease' }}>
      <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#06b6d433,#3b82f633)', border:'1px solid #06b6d433', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, marginTop:2, color:'var(--accent)' }}>⬡</div>
      <div style={{ flex:1, minWidth:0 }}>
        {msg.type === 'show_chart'   && <ChartRenderer data={msg.data}/>}
        {msg.type === 'show_table'   && <TableRenderer data={msg.data}/>}
        {msg.type === 'show_insight' && <InsightCard   data={msg.data}/>}
        {msg.type === 'request_clarification' && <InsightCard data={{ text: msg.data?.question || '', highlights: msg.data?.suggestions || [] }}/>}
        {!['show_chart','show_table','show_insight','request_clarification'].includes(msg.type) && (
          <InsightCard data={{ text: msg.data?.text || JSON.stringify(msg.data), highlights:[] }}/>
        )}
      </div>
    </div>
  );
}