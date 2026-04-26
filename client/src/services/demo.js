// Simulates GPT-4 responses for demo/offline use.
// To use real backend, replace getDemoResponse() calls with:
//   const { data } = await axios.post('http://localhost:5000/api/chat/message', { message }, { withCredentials: true });
//   return data;

export function getDemoResponse(query) {
    const q = query.toLowerCase();
  
    if ((q.includes('revenue') || q.includes('product') || q.includes('highest')) && !q.includes('region') && !q.includes('month')) {
      return { type:'show_chart', data:{
        chartType:'bar', title:'Revenue by product',
        insight:'Enterprise Suite leads at $2.4M — 3× the next best performer.',
        labels:['Enterprise Suite','Pro Plan','Starter','Add-ons','Consulting'],
        values:[2400,820,410,290,180], xLabel:'Product', yLabel:'Revenue ($k)',
      }};
    }
    if (q.includes('month') || q.includes('trend') || q.includes('line') || q.includes('over time')) {
      return { type:'show_chart', data:{
        chartType:'line', title:'Monthly revenue — 2024',
        insight:'Steady growth with a 28% Q4 surge. December peaked at $590k.',
        labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        values:[280,310,295,340,390,420,380,410,450,480,560,590],
        xLabel:'Month', yLabel:'Revenue ($k)',
      }};
    }
    if (q.includes('region') || q.includes('pie') || q.includes('breakdown') || q.includes('share')) {
      return { type:'show_chart', data:{
        chartType:'pie', title:'Revenue by region',
        insight:'North America dominates at 58%. APAC fastest growing at 41% YoY.',
        labels:['North America','Europe','APAC','LATAM','MEA'],
        values:[58,22,13,5,2],
      }};
    }
    if ((q.includes('q1') && q.includes('q2')) || (q.includes('compare') && !q.includes('customer'))) {
      return { type:'show_chart', data:{
        chartType:'bar', title:'Q1 vs Q2 comparison',
        insight:'Q2 outperformed Q1 by 18% across all product lines.',
        labels:['Enterprise','Pro','Starter','Add-ons'],
        values:[1200,420,195,140], xLabel:'Product', yLabel:'Revenue ($k)',
      }};
    }
    if (q.includes('customer') || q.includes('top') || q.includes('table') || q.includes('list')) {
      return { type:'show_table', data:{
        title:'Top customers by total revenue',
        columns:['Customer','Region','Revenue ($)','Orders','Status'],
        rows:[
          { Customer:'Acme Corp',    Region:'North America', 'Revenue ($)':148200, Orders:24, Status:'Active'  },
          { Customer:'GlobalTech',   Region:'Europe',        'Revenue ($)':121500, Orders:19, Status:'Active'  },
          { Customer:'StrataCo',     Region:'APAC',          'Revenue ($)':98700,  Orders:15, Status:'Active'  },
          { Customer:'NovaSystems',  Region:'North America', 'Revenue ($)':87400,  Orders:22, Status:'At Risk' },
          { Customer:'Zenith Ltd',   Region:'Europe',        'Revenue ($)':76200,  Orders:11, Status:'Active'  },
          { Customer:'PrimeCo',      Region:'LATAM',         'Revenue ($)':54300,  Orders:8,  Status:'Active'  },
          { Customer:'FutureTech',   Region:'APAC',          'Revenue ($)':48900,  Orders:14, Status:'At Risk' },
          { Customer:'Apex Systems', Region:'MEA',           'Revenue ($)':43200,  Orders:6,  Status:'Active'  },
        ],
      }};
    }
    if (q.includes('report') || q.includes('generate') || q.includes('executive')) {
      return { type:'show_insight', data:{
        text:'**Executive Summary — Q1 2024**\n\nTotal revenue reached **$4.1M**, up **23% year-over-year**. Enterprise Suite remains dominant at 59% of total revenue.\n\n**Key risk:** 2 high-value accounts flagged At Risk — **$136k ARR** exposure. Immediate review recommended.',
        highlights:['Revenue: $4.1M (+23% YoY)','Enterprise Suite: $2.4M (59% of total)','APAC growth: +41% YoY — fastest region','2 at-risk accounts = $136k ARR exposure'],
      }};
    }
    return { type:'show_insight', data:{
      text:`Based on your **Q1 Sales** dataset, here's what I found for **"${query}"**:\n\nYour data covers 1,247 transactions across 5 product lines and 4 regions with **$4.1M total revenue**.`,
      highlights:['Try: "revenue by product as bar chart"','Try: "top 10 customers by value"','Try: "monthly trend line chart"','Try: "compare Q1 vs Q2"'],
    }};
  }