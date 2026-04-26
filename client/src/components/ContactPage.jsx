import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, FileBarChart, Users, DollarSign,
  Megaphone, CheckSquare, MessageCircle, HelpCircle,
  Settings, History as HistoryIcon, Loader2, Search, Bell,
  ChevronRight, ArrowUpRight, Mail, Phone, MapPin,
  Globe, Briefcase, AtSign, Terminal, Zap,
  Send, Clock
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

export default function ContactPage() {
  const navigate = useNavigate();
  const { currentUser, history, isHistoryLoading } = useData();
  const [formData, setFormData] = useState({ name: '', email: '', type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:5002/api/contact', formData);
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', type: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error('Failed to send message:', err);
      setIsSubmitting(false);
      alert('Failed to send message. Please try again.');
    }
  };

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
            <SidebarItem icon={MessageCircle}  label="Contacts" active />
            <SidebarItem icon={HelpCircle}       label="Help Center" badge="4" onClick={() => navigate('/help')} />
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
            <h2 className="text-xl font-black tracking-tight">Contact Us</h2>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5 uppercase tracking-wider">We'd love to hear from you — feedback, bugs or ideas</p>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Search..." className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-emerald-500/50 transition-all w-64" />
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
        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">

          {/* Top Banner */}
          <div className="bg-emerald-900/5 border border-emerald-500/20 rounded-[24px] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <MessageCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Get in touch</h3>
                <p className="text-sm text-gray-400 font-medium">Avg. response time: under 24 hours</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 text-gray-400">
                <Clock className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium">Mon–Fri · 9am–6pm</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium">Remote · Worldwide</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-[#11151b] border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-2xl font-bold">Send us a message</h3>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Fill out the form and we'll respond shortly</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">We're online</span>
                  </div>
                </div>

                <form className="space-y-8" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Name</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Email</label>
                      <input 
                        type="email" 
                        required
                        placeholder="you@email.com" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Issue Type</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] appearance-none transition-all"
                    >
                      <option value="">Select an issue type</option>
                      <option value="bug">Bug Report</option>
                      <option value="feature">Feature Request</option>
                      <option value="general">General Inquiry</option>
                      <option value="billing">Billing</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Message</label>
                      <span className="text-[10px] text-gray-600 font-bold">Min 10 characters</span>
                    </div>
                    <textarea 
                      rows="6" 
                      required
                      placeholder="Tell us what's on your mind..." 
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all resize-none"
                    ></textarea>
                    <div className="flex justify-end pr-1">
                      <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{formData.message.length} / 1000</span>
                    </div>
                  </div>

                  <button 
                    disabled={isSubmitting || submitted}
                    className={`flex items-center gap-3 font-black uppercase text-xs tracking-widest px-8 py-4 rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]
                      ${submitted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/10'}`}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : submitted ? <CheckSquare className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    {isSubmitting ? 'Sending...' : submitted ? 'Message Sent!' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column / Cards */}
            <div className="space-y-8">
              {/* Contact Info */}
              <div className="bg-[#11151b] border border-white/5 rounded-[32px] p-8 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Reach us directly</h3>
                
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Email</p>
                    <p className="text-sm font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">kj5369227@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Phone</p>
                    <p className="text-sm font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">6367279682</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Location</p>
                    <p className="text-sm font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">India · Remote</p>
                  </div>
                </div>
              </div>

              {/* Follow & Connect */}
              <div className="bg-[#11151b] border border-white/5 rounded-[32px] p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6">Follow & connect</h3>
                <div className="grid grid-cols-3 gap-3">
                  <a href="#" className="flex flex-col items-center justify-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all group">
                    <Globe className="w-5 h-5 text-gray-500 group-hover:text-emerald-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white">GitHub</span>
                  </a>
                  <a href="#" className="flex flex-col items-center justify-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all group">
                    <Briefcase className="w-5 h-5 text-gray-500 group-hover:text-emerald-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white">LinkedIn</span>
                  </a>
                  <a href="#" className="flex flex-col items-center justify-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all group">
                    <AtSign className="w-5 h-5 text-gray-500 group-hover:text-emerald-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white">Twitter</span>
                  </a>
                </div>
                <p className="text-[9px] text-gray-600 font-bold text-center mt-6 tracking-wide">
                  Built by <span className="text-emerald-500">Khushi Jain</span>
                </p>
              </div>

              {/* What can we help with? */}
              <div className="bg-[#11151b] border border-white/5 rounded-[32px] p-8 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">What can we help with?</h3>
                <div className="space-y-4">
                  {[
                    { icon: Terminal, label: 'Bug Report', color: 'text-rose-400' },
                    { icon: Zap, label: 'Feature Request', color: 'text-amber-400' },
                    { icon: Send, label: 'General Query', color: 'text-emerald-400' },
                    { icon: MessageCircle, label: 'Feedback', color: 'text-blue-400' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-pointer hover:translate-x-1 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-white/5">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <span className="text-[11px] font-bold text-gray-300 group-hover:text-white transition-colors">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FAQ / Bottom Section */}
          <div className="bg-[#11151b] border border-white/5 rounded-[32px] p-10 mt-4 overflow-hidden relative">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-bold">Quick answers</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Common questions before you reach out</p>
              </div>
              <HelpCircle className="w-6 h-6 text-emerald-500/40" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { q: 'How fast do you respond?', a: 'We reply within 24 hours on business days.' },
                { q: 'Can I request a custom feature?', a: 'Yes! Use the Feature Request option in the form.' },
                { q: 'Do you offer a free trial?', a: 'All core analytics features are free to explore.' }
              ].map((faq, i) => (
                <div key={i} className="space-y-3 bg-white/[0.01] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.03] transition-all">
                  <h4 className="text-xs font-black text-gray-200 uppercase tracking-wider">{faq.q}</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="h-10" />
        </div>
      </main>
    </div>
  );
}
