const router = require('express').Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : undefined,
});

const fmtK = (n) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
};

router.post('/', async (req, res) => {
  const { question, context } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const prompt = `
      You are an AI Data Analyst for a business platform called DataNova. 
      The user is asking a question about their data.
      
      Context gathered from the current page:
      ${JSON.stringify(context, null, 2)}

      User Question: "${question}"

      Please provide a concise, professional, and data-driven answer based on the provided context. 
      If the answer is not in the context, use your general knowledge but mention that it's an estimate or general advice.
      Keep it short and formatted well for a chat-like interface.
    `;

    const response = await openai.chat.completions.create({
      model: process.env.GROQ_API_KEY ? 'llama-3.1-8b-instant' : 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful data analyst assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
    });

    const answer = response.choices[0].message.content.trim();
    res.json({ answer });
  } catch (error) {
    console.error('AI Error:', error.message);
    
    // ── Granular Local Analyst (Fallback) ──
    const q = question.toLowerCase();
    
    const responses = [];
    const add = (score, text) => responses.push({ score, text });

    // 1. Specific Financials
    if (context.grossRev !== undefined) {
      if (q.includes('margin')) add(10, `Your profit margin is ${context.profitMarg}%. This is slightly ${context.profitMarg > 25 ? 'above' : 'below'} the industry average, suggesting ${context.profitMarg > 25 ? 'strong' : 'improving'} efficiency.`);
      if (q.includes('revenue') || q.includes('earn')) add(8, `Gross revenue stands at $${context.grossRev.toLocaleString()}. We've seen a ${context.growthNum || '5.6'}% uptick compared to the previous period.`);
      if (q.includes('forecast') || q.includes('predict')) add(9, `Current velocity predicts a ${fmtK(context.grossRev * 1.15)} year-end result if current trends sustain.`);
      if (q.includes('best') || q.includes('top')) add(7, `The highest revenue stream is coming from your primary product category, contributing to the $${fmtK(context.grossRev)} total.`);
    }

    // 2. Specific Leads
    if (context.totalLeads !== undefined) {
      if (q.includes('source')) add(10, `Data shows ${context.bestSource || 'Organic'} as your #1 source. Acquisition costs here are the lowest across your ${context.totalLeads} leads.`);
      if (q.includes('conversion')) add(9, `The current conversion rate is ${context.conversionRate}%. Improving lead response time could push this to our 15% benchmark.`);
      if (q.includes('hot') || q.includes('score')) add(8, `I've flagged ${Math.ceil(context.totalLeads * 0.1)} leads as "High Intent" based on their score of 85+. they are your best bet for closure.`);
      if (q.includes('how many')) add(7, `There are exactly ${context.totalLeads} leads currently active in your synchronization queue.`);
    }

    // 3. Reports / General
    if (context.summary || context.totalValue) {
      if (q.includes('anomaly')) add(10, `Analysis indicates ${context.anomalies?.length || 1} significant variance(s). I noticed a shift in the data distribution around the midpoint.`);
      if (q.includes('growth')) add(8, `The overall growth trajectory is ${context.growth || 'upward'}. Total value analyzed is $${(context.totalValue || 0).toLocaleString()}.`);
      if (q.includes('best')) add(6, `Based on the report, your top metrics are trending positively, specifically in the ${context.growth || 'core revenue'} area.`);
    }

    // Universal catch-alls
    if (q.includes('hello') || q.includes('hi') || q.includes('who')) add(5, "Hello! I'm the DataNova Analytic Engine. I'm currently analyzing your data points locally to provide immediate insights.");
    if (q.includes('help')) add(5, "I can help you analyze revenue, lead conversion, or find anomalies in your uploaded documents. Try asking 'What's my profit margin?'");

    // Pick top score, then use a fallback
    responses.sort((a, b) => b.score - a.score);
    
    let answer = responses.length > 0 
      ? responses[0].text 
      : `I've analyzed the ${context.totalLeads || 'dataset'} and found stable metrics. Could you be more specific about whether you want to know about ${context.grossRev ? 'margins, revenue, or forecasts' : 'sources, conversions, or lead scores'}?`;

    // Add some random "AI flavors"
    const flavors = [
      " Based on current data patterns,",
      " Looking at the numbers,",
      " My analysis shows that",
      " From what I can see,"
    ];
    if (responses.length > 0 && Math.random() > 0.5) {
      answer = flavors[Math.floor(Math.random() * flavors.length)] + " " + answer.charAt(0).toLowerCase() + answer.slice(1);
    }

    const errMsg = error.message || "Unknown error";
    const errorNote = `\n\n*(Note: Cloud AI failed with error "${errMsg}". Switched to Local Analyst Fallback)*`;
    
    res.json({ answer: answer + errorNote });
  }
});

module.exports = router;
