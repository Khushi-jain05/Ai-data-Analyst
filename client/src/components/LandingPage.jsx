import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="bg-[#0b0f15] text-white min-h-screen font-sans selection:bg-emerald-500/30">
      
      {/* Navbar */}
      <header className="w-full max-w-[1280px] mx-auto flex items-center justify-between py-6 px-8">
        <nav className="flex gap-8 text-sm text-gray-400 font-medium">
          <a href="#home" className="hover:text-white transition">Home</a>
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
        </nav>

        <div className="flex items-center gap-3 cursor-pointer absolute left-1/2 -translate-x-1/2" onClick={() => navigate('/')}>
           <img src={logo} alt="DataNova" className="w-8 h-8 object-contain" />
           <span className="text-xl font-bold tracking-tight text-white">DataNova</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition">Log in</Link>
          <button onClick={() => navigate('/signup')} className="bg-[#1c212b] border border-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-full text-xs font-semibold transition">
            Free Trial
          </button>
        </div>
      </header>

      <main className="w-full overflow-hidden">
        {/* --- HERO SECTION --- */}
        <section className="relative w-full max-w-[1280px] mx-auto pt-24 px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 blur-[150px] rounded-full pointer-events-none"></div>

          {/* Left Hero Content */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-300 font-medium mb-8">
              Simplify your analysis <span className="text-emerald-400 font-bold ml-1">● — ●</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Chat with your<br/>
              data, get instant<br/>
              <span className="text-emerald-400">insights with AI</span>
            </h1>

            <p className="text-gray-400 text-[15px] max-w-sm mb-10 leading-relaxed">
              Upload CSV or Excel files, ask questions in plain English, and get answers, visualizations, and explanations — no coding required.
            </p>

            <button onClick={() => navigate('/signup')} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-3.5 rounded-full text-xs font-bold transition">
              Get started
            </button>
          </div>

          {/* Right Hero Visual Dashboard */}
          <div className="relative z-10 bg-[#12161b] rounded-2xl border border-white/5 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.8)] p-6 w-full lg:w-[110%] -mr-10">
            <h3 className="text-sm font-medium text-white mb-6">Welcome back, User!</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-[#1c212b] rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-400">Total Queries</span>
                  <span className="text-[10px] text-gray-500">→</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">12,400</div>
                <div className="text-[10px] text-emerald-400 font-semibold">+8.2% this week</div>
              </div>
              <div className="bg-[#1c212b] rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-400">Datasets</span>
                  <span className="text-[10px] text-gray-500">→</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">156</div>
                <div className="text-[10px] text-emerald-400 font-semibold">+12 new</div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="bg-[#1c212b] rounded-xl p-4 border border-white/5 flex justify-between items-center">
                <span className="text-xs text-gray-300">Sales Dataset</span>
                <span className="text-[10px] text-gray-500">2,400 rows</span>
              </div>
              <div className="bg-[#1c212b] rounded-xl p-4 border border-white/5 flex justify-between items-center">
                <span className="text-xs text-gray-300">Marketing Data</span>
                <span className="text-[10px] text-gray-500">1,850 rows</span>
              </div>
            </div>

            <div className="bg-[#1c212b] rounded-xl p-4 border border-white/5">
               <div className="flex items-center justify-between mb-8">
                  <span className="text-[10px] text-gray-400">Query Activity</span>
                  <span className="text-[10px] text-gray-500">→</span>
               </div>
               <div className="flex justify-between items-end h-12 gap-1.5 pb-2">
                 {[40, 50, 45, 60, 45, 55, 70, 45, 55, 50, 60, 50].map((h, i) => (
                   <div key={i} className="w-full bg-[#247c5d] rounded-t-sm" style={{ height: `${h}%` }}></div>
                 ))}
               </div>
            </div>
          </div>
        </section>

        {/* --- TRUSTED SECTION --- */}
        <section className="w-full max-w-[1000px] mx-auto mt-32 px-8">
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="h-px w-10 bg-white/10 flex items-center justify-start"><div className="w-1 h-1 bg-emerald-500 rounded-full shrink-0 -ml-1"></div></div>
            <span className="text-xs text-gray-500 font-medium">Trusted by 2k+ data teams</span>
            <div className="h-px w-10 bg-white/10 flex items-center justify-end"><div className="w-1 h-1 bg-emerald-500 rounded-full shrink-0 -mr-1"></div></div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {['TechCorp', 'DataFlow', 'Analytix', 'InsightAI', 'CloudBase', 'MetricHub', 'DeepQuery'].map((brand) => (
              <div key={brand} className="bg-[#161b22] border border-white/5 rounded-full px-5 py-2 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                </div>
                <span className="text-[11px] text-gray-400 font-bold">{brand}</span>
              </div>
            ))}
          </div>
        </section>

        {/* --- WORKFLOW SECTION --- */}
        <section className="w-full max-w-[1100px] mx-auto pt-32 px-8 pb-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
               <div className="h-px w-6 bg-white/10 flex items-center justify-start"><div className="w-1 h-1 bg-emerald-500 rounded-full shrink-0 -ml-1"></div></div>
               <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Our workflow</span>
               <div className="h-px w-6 bg-white/10 flex items-center justify-end"><div className="w-1 h-1 bg-emerald-500 rounded-full shrink-0 -mr-1"></div></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight max-w-2xl mx-auto">
              How our platform<br/>makes your workflow easier
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Upload Your Data', desc: 'Drop your CSV or Excel files and instantly preview your data with auto-detected columns and types.', icon: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></> },
              { title: 'Ask Questions', desc: 'Type questions in plain English — our AI converts your words into powerful data analysis.', icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></> },
              { title: 'Get Visualizations', desc: 'Smart chart suggestions based on your query — bar, line, pie charts generated automatically.', icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
              { title: 'Export Reports', desc: 'Generate comprehensive reports with insights, charts, and summaries ready to share.', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></> }
            ].map((f, i) => (
              <div key={i} className="bg-[#12161b] rounded-2xl p-6 border border-white/5 hover:border-white/10 hover:shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)] transition-all duration-300 group">
                <div className="bg-[#1c212b] rounded-xl p-4 mb-6 border border-white/5 shadow-inner">
                   <div className="flex items-center gap-1.5 mb-4">
                     <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                     <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                     <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                       <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                         {f.icon}
                       </svg>
                     </div>
                     <div className="flex-1 space-y-2">
                       <div className="h-1.5 rounded bg-white/10 w-3/4"></div>
                       <div className="h-1.5 rounded bg-white/5 w-1/2"></div>
                     </div>
                   </div>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- FEATURES GRID SECTION --- */}
        <section id="features" className="w-full max-w-[1200px] mx-auto py-24 px-8 mt-12 bg-gradient-to-b from-[#0b0f15] to-[#0d1218]">
          <div className="text-center mb-20">
            <h3 className="text-emerald-400 font-bold text-[10px] tracking-widest uppercase mb-4">Features</h3>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Everything you need to analyze data</h2>
            <p className="text-gray-500 text-sm max-w-2xl mx-auto">
              Powerful AI tools that turn raw data into actionable insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { t: 'AI-Powered Analysis', d: 'Natural language to Pandas — ask anything about your data and get instant answers.', i: <><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></> },
              { t: 'Lightning Fast', d: 'Redis caching and optimized queries deliver results in under 2 seconds.', i: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></> },
              { t: 'Safe Execution', d: 'AI-generated code is validated and sandboxed — no malicious operations allowed.', i: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></> },
              { t: 'Query History', d: 'All previous queries saved for instant re-run with full version tracking.', i: <><path d="M12 2v4M12 18v4"/><path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4"/></> },
              { t: 'Multi-Dataset', d: 'Switch between datasets seamlessly. Each user gets their own private workspace.', i: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></> },
              { t: 'Enterprise Security', d: 'End-to-end encryption, role-based access, and SOC 2 compliant infrastructure.', i: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></> }
            ].map((f, i) => (
              <div key={i} className="bg-[#12161b] p-8 rounded-2xl border border-white/5 hover:shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)] transition-all duration-300">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{f.i}</svg>
                </div>
                <h4 className="text-[15px] font-bold mb-3">{f.t}</h4>
                <p className="text-gray-500 text-xs leading-relaxed font-medium">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- STATS SECTION --- */}
        <section className="w-full max-w-[1200px] mx-auto py-24 px-8 mt-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center relative">
            <div>
               <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-3 tracking-tight">50K+</div>
               <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Datasets Analyzed</div>
            </div>
            <div>
               <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-3 tracking-tight">2.5M</div>
               <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Queries Answered</div>
            </div>
            <div>
               <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-3 tracking-tight">&lt; 2s</div>
               <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Avg Response Time</div>
            </div>
            <div>
               <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-3 tracking-tight">4.9/5</div>
               <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">User Satisfaction</div>
            </div>
          </div>
        </section>

        {/* --- CTA SECTION --- */}
        <section className="w-full max-w-[1000px] mx-auto py-16 px-8 mb-20">
          <div className="bg-gradient-to-b from-[#13171f] to-[#0c1015] border border-white/5 rounded-[32px] p-16 text-center relative overflow-hidden shadow-[0_30px_100px_-15px_rgba(0,0,0,0.9)]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
            
            <h2 className="text-4xl font-bold text-white mb-6 relative z-10">Ready to chat with your data?</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-10 relative z-10 leading-relaxed font-medium">
              Upload your dataset, ask questions in plain English, and get instant insights with AI-powered analysis.
            </p>
            <button onClick={() => navigate('/signup')} className="relative z-10 bg-[#10b981] hover:bg-emerald-400 text-black px-7 py-3 rounded-full text-sm font-bold transition flex items-center gap-2 mx-auto">
              Start Analyzing Free
              <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
          </div>
        </section>
      </main>

    </div>
  );
}
