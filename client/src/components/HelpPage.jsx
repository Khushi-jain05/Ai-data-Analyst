import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileBarChart, Users, DollarSign,
  Megaphone, CheckSquare, MessageCircle, HelpCircle,
  Settings, History as HistoryIcon, Loader2, Search, Bell,
  ChevronRight, ArrowUpRight, Play, FileText, Globe,
  MessageSquare, Users as Community, Shield, Zap, 
  Rocket, Database, Brain, PieChart, ChevronDown, Clock
} from 'lucide-react';
import logo from '../assets/logo.png';
import { useData } from '../context/DataContext';

/* ── Sidebar item component ── */
const SidebarItem = ({ icon: Icon, label, active, badge, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group
      ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
  >
    <div className="flex items-center gap-3 font-medium text-sm">
      <Icon className={`w-5 h-5 ${active ? 'text-black' : 'text-gray-500 group-hover:text-emerald-400'}`} />
      <span>{label}</span>
    </div>
    {badge && (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
        ${active ? 'bg-black text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
        {badge}
      </span>
    )}
  </div>
);

const CategoryCard = ({ icon: Icon, title, desc, articles }) => (
  <div className="bg-[#11151b] border border-white/5 rounded-[28px] p-6 hover:border-emerald-500/30 transition-all cursor-pointer group">
    <div className="flex justify-between items-start mb-6">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
        <Icon className="w-6 h-6" />
      </div>
      <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-emerald-500" />
    </div>
    <h4 className="text-sm font-bold text-white mb-2">{title}</h4>
    <p className="text-[11px] text-gray-500 font-medium mb-4 line-clamp-2">{desc}</p>
    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 font-bold">{articles} articles</span>
  </div>
);

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0 py-5">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <span className="text-[13px] font-bold text-gray-300 group-hover:text-white transition-colors">{question}</span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
      </button>
      {isOpen && (
        <div className="mt-4 text-[12px] text-gray-500 leading-relaxed font-medium transition-all">
          {answer}
        </div>
      )}
    </div>
  );
};

export default function HelpPage() {
  const navigate = useNavigate();
  const { currentUser, history, isHistoryLoading } = useData();

  const handleHistoryClick = (id) => {
    navigate('/history');
  };

  return (
    <div className="flex h-screen bg-[#0b0f15] text-white overflow-hidden font-sans">
      
      {/* ═══ SIDEBAR ═══ */}
      <aside className="w-64 border-r border-white/5 bg-[#0b0f15] flex flex-col hidden lg:flex shrink-0">
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="DataNova" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-white">DataNova</span>
          </div>

          <nav className="space-y-1.5 text-sm">
            <SidebarItem icon={LayoutDashboard} label="Overview" onClick={() => navigate('/dashboard')} />
            <SidebarItem icon={FileBarChart}   label="Report"   onClick={() => navigate('/report')} />
            <SidebarItem icon={HistoryIcon}    label="History"  onClick={() => navigate('/history')} />
            <SidebarItem icon={Users}          label="Lead"     onClick={() => navigate('/leads')} />
            <SidebarItem icon={DollarSign}     label="Revenue"  onClick={() => navigate('/revenue')} />
            <SidebarItem icon={Megaphone}      label="Marketing" onClick={() => navigate('/marketing')} />
            <SidebarItem icon={CheckSquare}    label="Task"      onClick={() => navigate('/tasks')} />
            <SidebarItem icon={MessageCircle}  label="Contacts"  onClick={() => navigate('/contacts')} />
            <SidebarItem icon={HelpCircle}     label="Help Center" active badge="4" />
            <SidebarItem icon={Settings}       label="Settings"   badge="1" onClick={() => navigate('/settings')} />

          </nav>

          <div className="mt-10 overflow-hidden flex-1">
            <div className="flex items-center gap-2 mb-4 px-3">
              <HistoryIcon className="w-4 h-4 text-gray-500" />
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Recent Activity</p>
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[200px] pr-1 custom-scrollbar">
              {isHistoryLoading ? (
                <div className="px-3 py-2 flex items-center gap-2 text-xs text-gray-600">
                  <Loader2 className="w-3 h-3 animate-spin" /><span>Syncing…</span>
                </div>
              ) : history.length > 0 ? (
                history.map(item => (
                  <div key={item.id} onClick={() => handleHistoryClick(item.id)} className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer hover:bg-white/5 group transition-all">
                    <Clock className="w-3.5 h-3.5 text-gray-600 group-hover:text-emerald-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs text-gray-400 group-hover:text-white font-medium truncate">{item.filename}</span>
                      <span className="text-[9px] text-gray-600 uppercase font-bold">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-gray-600 italic">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 flex flex-col bg-[#0c1015] overflow-hidden">
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center px-10 justify-between shrink-0 bg-[#0b0f15]/80 backdrop-blur-md z-10 w-full">
          <div>
            <h2 className="text-xl font-black tracking-tight">Help Center</h2>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5 uppercase tracking-wider">Guides, answers and tutorials for DataNova Analyst</p>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search articles..." className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-emerald-500/50 transition-all w-64" />
            </div>
            
            <div className="relative cursor-pointer group">
              <Bell className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-[#0b0f15] rounded-full" />
            </div>
            
            <div className="h-8 w-px bg-white/10 mx-2" />
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400 text-[10px] border border-emerald-500/20">
                {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0) || 'DN'}
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors capitalize">
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Guest User'}
                </p>
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">

          {/* Hero Section */}
          <div className="bg-gradient-to-br from-[#131a22] to-[#0c1015] border border-white/5 rounded-[40px] p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-full bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8">
                <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400/20" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">AI-powered help</span>
              </div>
              
              <h2 className="text-5xl font-black tracking-tight text-white mb-4">How can we help you today?</h2>
              <p className="text-sm text-gray-500 font-medium mb-10">Search 80+ articles, video tutorials and guided workflows</p>
              
              <div className="relative w-full max-w-2xl group">
                <div className="absolute inset-0 bg-emerald-500/20 blur-[20px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center bg-[#161b22] border border-white/10 rounded-[24px] p-2 pr-2 shadow-2xl">
                  <Search className="ml-5 w-5 h-5 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Try 'how to upload data' or 'export report'" 
                    className="flex-1 bg-transparent border-none focus:outline-none px-4 text-sm font-medium text-white placeholder:text-gray-600"
                  />
                  <button className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all">
                    Search
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-600">Popular:</span>
                {['upload CSV', 'AI query', 'PDF export', 'share report'].map((tag, i) => (
                  <button key={i} className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <section>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="text-xl font-bold">Browse by category</h3>
                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-black mt-2">Find answers by topic</p>
              </div>
              <button className="flex items-center gap-2 text-emerald-500 text-[11px] font-black uppercase tracking-widest hover:gap-3 transition-all">
                View all topics <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CategoryCard 
                icon={Rocket} 
                title="Getting started" 
                desc="Set up your workspace, invite team members, and configure your first data source in 5 minutes." 
                articles="12" 
              />
              <CategoryCard 
                icon={Database} 
                title="Data & uploads" 
                desc="Master CSV/Excel formatting, handle larger schemas, and manage your metadata repository." 
                articles="18" 
              />
              <CategoryCard 
                icon={Brain} 
                title="AI query engine" 
                desc="Learn how to phrase natural language questions to get the most accurate analysis from our AI." 
                articles="24" 
              />
              <CategoryCard 
                icon={PieChart} 
                title="Reports & charts" 
                desc="Customize visual themes, build recurring dashboards, and automate PDF report exports." 
                articles="16" 
              />
              <CategoryCard 
                icon={Shield} 
                title="Security & privacy" 
                desc="How we protect your data, manage permissions, and comply with SOC2 and GDPR standards." 
                articles="9" 
              />
              <CategoryCard 
                icon={Zap} 
                title="Integrations" 
                desc="Connect DataNova to Slack, Notion, Google Sheets, and your private Postgres/MySQL instances." 
                articles="7" 
              />
            </div>
          </section>

          {/* Articles & Videos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-[#11151b] border border-white/5 rounded-[32px] p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Popular articles</h3>
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">6 articles</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { q: 'How do I upload my first CSV file?', time: '2 min read' },
                    { q: 'What kind of questions can I ask the AI?', time: '4 min read' },
                    { q: 'How do I share a report with my team?', time: '3 min read' },
                    { q: 'Can I schedule recurring email reports?', time: '5 min read' },
                    { q: 'How accurate is the AI revenue forecast?', time: '6 min read' },
                    { q: 'How do I export a dashboard as PDF?', time: '2 min read' }
                  ].map((art, i) => (
                    <div key={i} className="flex items-center justify-between group cursor-pointer border-b border-white/[0.03] last:border-0 pb-6 last:pb-0">
                      <div className="flex items-center gap-4">
                        <HelpCircle className="w-4 h-4 text-gray-700" />
                        <span className="text-[13px] font-bold text-gray-400 group-hover:text-white transition-colors">{art.q}</span>
                      </div>
                      <span className="text-[10px] text-gray-600 font-bold">{art.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-[#11151b] border border-white/5 rounded-[32px] p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <Play className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold">Video tutorials</h3>
                </div>

                <div className="space-y-4">
                  {[
                    { title: 'Workspace tour', duration: '3:24', color: 'bg-emerald-900/20' },
                    { title: 'Your first AI query', duration: '5:10', color: 'bg-blue-900/20' },
                    { title: 'Building a revenue report', duration: '7:42', color: 'bg-purple-900/20' }
                  ].map((video, i) => (
                    <div key={i} className="group cursor-pointer">
                      <div className={`aspect-video ${video.color} rounded-2xl mb-3 relative overflow-hidden flex items-center justify-center border border-white/5 group-hover:border-emerald-500/30 transition-all`}>
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                        <span className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 rounded-md text-[9px] font-black text-white">{video.duration}</span>
                      </div>
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors ml-1">{video.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <section className="bg-[#11151b] border border-white/5 rounded-[32px] p-10">
            <div className="flex items-center gap-3 mb-10">
              <HelpCircle className="w-6 h-6 text-emerald-500" />
              <h3 className="text-xl font-black uppercase tracking-widest">Frequently asked questions</h3>
            </div>

            <div className="divide-y divide-white/5">
              <FaqItem 
                question="Is my data used to train AI models?" 
                answer="No. Your datasets stay private to your workspace and are never used to train external models. We prioritize data sovereignty and SOC2 compliance." 
              />
              <FaqItem 
                question="What file formats are supported?" 
                answer="We currently support CSV, XLSX, and XLS formats up to 200MB. We also offer direct connectors for PostgreSQL and MySQL databases." 
              />
              <FaqItem 
                question="How does pricing work?" 
                answer="All personal analytics are free. Enterprise plans with shared history and advanced connectors start at $49/member." 
              />
              <FaqItem 
                question="Can I self-host DataNova Analyst?" 
                answer="Yes! We offer a Docker-compatible image for on-premise deployments. Contact our sales team for an enterprise license." 
              />
              <FaqItem 
                question="How long are uploaded files retained?" 
                answer="Files are kept in your private storage indefinitely unless manually deleted by the administrator." 
              />
            </div>
          </section>

          {/* Support Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="bg-[#11151b] border border-white/5 rounded-[32px] p-8 text-center space-y-6 group hover:border-emerald-500/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] mx-auto flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all">
                <MessageCircle className="w-6 h-6 text-emerald-500 group-hover:text-black" />
              </div>
              <div>
                <h4 className="text-sm font-bold mb-2">Live chat</h4>
                <p className="text-[11px] text-gray-500 font-medium">Chat with our team Mon–Fri, 9am–6pm</p>
              </div>
              <button className="w-full py-3.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                Start chat
              </button>
            </div>

            <div className="bg-[#11151b] border border-emerald-500/20 rounded-[32px] p-8 text-center space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 mx-auto flex items-center justify-center">
                <Globe className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold mb-2">Contact support</h4>
                <p className="text-[11px] text-gray-500 font-medium">Send us a detailed message — reply within 24h</p>
              </div>
              <button 
                onClick={() => navigate('/contacts')}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Open form
              </button>
            </div>

            <div className="bg-[#11151b] border border-white/5 rounded-[32px] p-8 text-center space-y-6 group hover:border-emerald-500/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] mx-auto flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all">
                <Community className="w-6 h-6 text-emerald-500 group-hover:text-black" />
              </div>
              <div>
                <h4 className="text-sm font-bold mb-2">Community forum</h4>
                <p className="text-[11px] text-gray-500 font-medium">Ask questions and share tips with other users</p>
              </div>
              <button className="w-full py-3.5 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                Visit forum
              </button>
            </div>
          </div>

          <div className="h-10" />
        </div>
      </main>
    </div>
  );
}
