import React, { useState, useEffect, useMemo } from 'react';
import { History as HistoryIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileBarChart, Users, DollarSign, Megaphone,
  CheckSquare, MessageCircle, HelpCircle, Settings,
  Clock, Loader2, Search, Bell, Sparkles, Plus, Play, Pause, Edit2, Trash2,
  AlertCircle, Activity, BellRing
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import logo from '../assets/logo.png';
import { useData } from '../context/DataContext';

/* ── helpers ── */
const fmtK = (n) => {
  if (n >= 1_000_000) return `₹${(n / 1_000_000).toFixed(1)}L`; 
  if (n >= 1_000)     return `₹${(n / 1_000).toFixed(0)}k`;
  return `₹${Math.round(n)}`;
};

/* ── Sidebar item component ── */
const SidebarItem = ({ icon: Icon, label, active, badge, onClick }) => (
  <div onClick={onClick} className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${active ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
    <div className="flex items-center gap-3 font-medium text-sm">
      <Icon className={`w-5 h-5 ${active ? 'text-black' : 'text-gray-500 group-hover:text-emerald-400'}`} />
      <span>{label}</span>
    </div>
    {badge && (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${active ? 'bg-black text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
        {badge}
      </span>
    )}
  </div>
);

/* ── KPI Card Component ── */
const TaskKPICard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-[#161b22] border border-white/5 rounded-2xl p-5 hover:border-emerald-500/20 transition-all flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h2 className="text-2xl font-bold text-white">{value}</h2>
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{title}</p>
    </div>
  </div>
);

/* ── Tiny Sparkline for Task Row ── */
const TinySparkline = ({ data, color }) => (
  <div className="w-20 h-8">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default function TaskPage() {
  const navigate = useNavigate();
  const { data, currentUser, history, isHistoryLoading, fetchHistory } = useData();
  const [activeFilter, setActiveFilter] = useState('All');
  
  // State for CRUD
  const [tasks, setTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isRelevant, setIsRelevant] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingTask, setEditingTask] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', category: 'Revenue', freq: 'Daily' });

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Generate initial tasks whenever dataset changes
  useEffect(() => {
    const hasData = data && data.length > 0;
    const cols = hasData ? Object.keys(data[0]) : [];
    
    const salesCol  = cols.find(c => ['sales','revenue','amount','total','price','income','value','turnover','profit'].some(h => c.toLowerCase().includes(h)));
    const catCol    = cols.find(c => ['category','segment','type','region','product','department','plan','source'].some(h => c.toLowerCase().includes(h)));
    const custCol   = cols.find(c => ['customer','client','buyer','name','user','person','email','account'].some(h => c.toLowerCase().includes(h)));
    const statusCol = cols.find(c => ['status','state','stage','churn','active'].some(h => c.toLowerCase().includes(h)));
    const leadCol   = cols.find(c => ['lead','conversion','score','contact'].some(h => c.toLowerCase().includes(h)));

    setIsRelevant(!!(salesCol || catCol || custCol || statusCol || leadCol));

    const recordCount = hasData ? data.length : 12450;
    
    const generateTrend = (base, volatility) => {
      let v = base;
      return Array(10).fill(0).map(() => {
        v += (Math.random() * volatility * 2) - volatility;
        return { v: Math.max(0, v) };
      });
    };

    const newTasks = [];
    let idCounter = Date.now();

    if (salesCol) {
      const totalRev = hasData ? data.reduce((s, r) => s + (Number(r[salesCol]) || 0), 0) : 485000;
      newTasks.push({ id: idCounter++, name: `Weekly ${salesCol} Tracker`, category: 'Revenue', freq: 'Weekly', status: 'active', value: fmtK(totalRev), change: hasData ? '+14.2%' : '+12.5%', lastRun: hasData ? 'Today' : '10 Apr', color: '#10b981', trend: generateTrend(50, 10) });
      newTasks.push({ id: idCounter++, name: `${salesCol} Drop Alert`, category: 'Revenue', freq: 'Daily', status: 'active', value: fmtK(totalRev * 0.03), change: '+2.1%', lastRun: hasData ? 'Today' : '11 Apr', color: '#ef4444', trend: generateTrend(80, 5).sort((a,b)=>a.v-b.v) });
    }

    if (catCol) {
      const uniqueCats = hasData ? new Set(data.map(r => r[catCol])).size : 5;
      newTasks.push({ id: idCounter++, name: `Top ${catCol} Monitor`, category: 'Product', freq: 'Daily', status: 'active', value: `${uniqueCats} segments`, change: '+0%', lastRun: hasData ? 'Today' : '11 Apr', color: '#3b82f6', trend: generateTrend(30, 8) });
    }

    if (custCol) {
      newTasks.push({ id: idCounter++, name: `Active ${custCol} Pulse`, category: 'Custom', freq: 'Daily', status: 'completed', value: recordCount.toLocaleString(), change: '+5.3%', lastRun: hasData ? 'Today' : '11 Apr', color: '#10b981', trend: generateTrend(90, 2) });
    }

    if (statusCol || leadCol) {
      const metricName = statusCol || leadCol;
      newTasks.push({ id: idCounter++, name: `${metricName} Analysis`, category: 'Marketing', freq: 'Monthly', status: 'paused', value: hasData ? '1.8%' : '3.2%', change: '-0.5%', lastRun: '1 Mar', color: '#f87171', trend: generateTrend(15, 3) });
    }

    if (newTasks.length === 0) {
      newTasks.push({ id: idCounter++, name: 'Data Pipeline Sync Tracker', category: 'Custom', freq: 'Daily', status: 'active', value: `${recordCount} rows`, change: '+100%', lastRun: 'Today', color: '#8b5cf6', trend: generateTrend(100, 0) });
      newTasks.push({ id: idCounter++, name: 'Missing Values Report', category: 'Product', freq: 'Weekly', status: 'paused', value: `0% avg`, change: '-1.2%', lastRun: '12 Apr', color: '#f59e0b', trend: generateTrend(5, 1) });
    }

    const newAlerts = [];
    let alertId = Date.now() + 1000;
    if (salesCol) {
      const totalRev = hasData ? data.reduce((s, r) => s + (Number(r[salesCol]) || 0), 0) : 485000;
      newAlerts.push({ id: alertId++, name: `Daily ${salesCol}`, rule: `Alert when below ${fmtK(totalRev * 0.05)}`, status: 'active' });
      newAlerts.push({ id: alertId++, name: `Weekly ${salesCol}`, rule: `Alert when below ${fmtK(totalRev * 0.4)}`, status: 'active' });
    }
    if (custCol || statusCol) newAlerts.push({ id: alertId++, name: `Critical ${custCol || statusCol} Drop`, rule: `Alert when volume drops by 20%`, status: 'active' });
    if (newAlerts.length === 0) newAlerts.push({ id: alertId++, name: 'Daily Row Count', rule: `Alert when missing daily data`, status: 'active' });

    setTasks(newTasks);
    setAlerts(newAlerts);
  }, [data]);

  const stats = useMemo(() => ({
    total: tasks.length,
    active: tasks.filter(t => t.status === 'active').length,
    paused: tasks.filter(t => t.status === 'paused').length,
    alerts: alerts.filter(a => a.status === 'active').length
  }), [tasks, alerts]);

  // Handlers
  const handleDeleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));
  const handleToggleTaskStatus = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'active' ? 'paused' : 'active' } : t));
  const handleToggleAlert = (id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a));

  const openModal = (mode, task = null) => {
    setModalMode(mode);
    setEditingTask(task);
    if (mode === 'edit' && task) setFormData({ name: task.name, category: task.category, freq: task.freq });
    else setFormData({ name: '', category: 'Revenue', freq: 'Daily' });
    setIsModalOpen(true);
  };

  const handleSaveTask = () => {
    if (!formData.name.trim()) return;
    if (modalMode === 'create') {
      const newTask = {
        id: Date.now(),
        name: formData.name,
        category: formData.category,
        freq: formData.freq,
        status: 'active',
        value: 'New',
        change: '+0%',
        lastRun: 'Pending',
        color: '#10b981',
        trend: [{v:20},{v:22},{v:21},{v:24},{v:25}]
      };
      setTasks([newTask, ...tasks]);
    } else {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, name: formData.name, category: formData.category, freq: formData.freq } : t));
    }
    setIsModalOpen(false);
  };

  const handleAddSuggestedTask = (st) => {
    const newTask = {
      id: Date.now(),
      name: st.title,
      category: st.tags[0],
      freq: st.tags[1] ? (st.tags[1].charAt(0).toUpperCase() + st.tags[1].slice(1)) : 'Daily',
      status: 'active',
      value: 'Pending',
      change: '+0%',
      lastRun: 'Never',
      color: '#10b981',
      trend: [{v:10},{v:15},{v:12},{v:18},{v:20}]
    };
    setTasks([newTask, ...tasks]);
  };

  const suggestedTasks = [
    { title: 'Track Weekly Revenue Trend', desc: 'Compare weekly revenue with previous week percentage change', tags: ['Revenue', 'weekly'] },
    { title: 'Monitor Top Products', desc: 'Track top 10 products by units sold with week-over-week comparison', tags: ['Product', 'weekly'] },
    { title: 'Marketing Spend Efficiency', desc: 'Calculate cost per acquisition for each marketing channel', tags: ['Marketing', 'monthly'] },
  ];

  const filteredTasks = activeFilter === 'All' ? tasks : tasks.filter(t => t.category === activeFilter);

  return (
    <div className="flex h-screen bg-[#0b0f15] text-white overflow-hidden font-sans">
      
      {/* ── Sidebar ── */}
      <aside className="w-64 border-r border-white/5 bg-[#0b0f15] flex flex-col hidden lg:flex shrink-0">
        <div className="p-8 flex flex-col h-full overflow-hidden">
          
          <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="DataNova" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-white">DataNova</span>
          </div>

          <nav className="space-y-1.5 text-sm">
            <SidebarItem icon={LayoutDashboard} label="Overview"     onClick={() => navigate('/dashboard')} />
            <SidebarItem icon={FileBarChart}    label="Report"       onClick={() => navigate('/report')} />
            <SidebarItem icon={HistoryIcon}     label="History" onClick={() => navigate('/history')} />
            <SidebarItem icon={Users}           label="Lead"         onClick={() => navigate('/leads')} />
            <SidebarItem icon={DollarSign}      label="Revenue"      onClick={() => navigate('/revenue')} />
            <SidebarItem icon={Megaphone}       label="Marketing"    onClick={() => navigate('/marketing')} />
            <SidebarItem icon={CheckSquare}     label="Task" active />
            <SidebarItem icon={MessageCircle}   label="Contacts" onClick={() => navigate('/contacts')} />
            <SidebarItem icon={HelpCircle}      label="Help Center" badge="4" onClick={() => navigate('/help')} />
            <SidebarItem icon={Settings}        label="Settings"     badge="1" onClick={() => navigate('/settings')} />

          </nav>

          {/* Recent Activity */}
          <div className="mt-10 flex-col flex-1 overflow-hidden min-h-0">
            <div className="flex items-center gap-2 mb-4 px-3">
              <HistoryIcon className="w-4 h-4 text-gray-500" />
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Recent Activity</p>
            </div>
            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 pr-1">
              {isHistoryLoading ? (
                <div className="px-3 py-2 flex items-center gap-2 text-xs text-gray-600">
                  <Loader2 className="w-3 h-3 animate-spin" /><span>Syncing…</span>
                </div>
              ) : history.length > 0 ? (
                history.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-default hover:bg-white/5 group transition-all">
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

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col bg-[#0c1015] overflow-hidden relative">
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center px-10 justify-between shrink-0 bg-[#0b0f15]/80 backdrop-blur-md z-10 w-full">
          <div>
            <h2 className="text-xl font-black tracking-tight">Tasks & Automation</h2>
            <p className="text-[10px] text-gray-500 font-medium mt-0.5 uppercase tracking-wider">Saved analyses, scheduled jobs & smart alerts</p>
          </div>

          <div className="flex items-center gap-5">
            <Search className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            <Bell   className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            
            <div className="h-6 w-px bg-white/10 mx-2" />
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400 text-[10px] uppercase border border-emerald-500/20">
                {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0) || 'DN'}
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-bold text-white group-hover:text-emerald-400 transition-colors capitalize">
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Selen Swift'}
                </p>
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">

          {/* KPI Row */}
          <div className="grid grid-cols-4 gap-6">
            <TaskKPICard title="Total Tasks"   value={stats.total}  icon={CheckSquare} colorClass="bg-blue-500/10 text-blue-400" />
            <TaskKPICard title="Active"        value={stats.active} icon={Play}        colorClass="bg-emerald-500/10 text-emerald-400" />
            <TaskKPICard title="Paused"        value={stats.paused} icon={Pause}       colorClass="bg-amber-500/10 text-amber-400" />
            <TaskKPICard title="Active Alerts" value={stats.alerts} icon={AlertCircle} colorClass="bg-rose-500/10 text-rose-400" />
          </div>

          {/* Relevance Warning */}
          {(!isRelevant && data?.length > 0) && (
            <div className="px-5 py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 mt-8">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-200 font-medium">
                <strong>Data Relevance Warning:</strong> The underlying dataset does not contain expected operational pillars (like sales, leads, or segments). Smart tasks generated may be generic. Re-upload relevant data for detailed analyses.
              </p>
            </div>
          )}

          {/* AI Suggested Tasks */}
          <section className="bg-[#11151b] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">AI Suggested Tasks</h3>
            </div>
            <div className="grid grid-cols-3 gap-5">
              {suggestedTasks.map((task, i) => (
                <div key={i} className="bg-[#161b22] border border-white/5 rounded-xl p-5 hover:border-emerald-500/30 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xs font-bold text-gray-200 group-hover:text-emerald-400 transition-colors">{task.title}</h4>
                    <button onClick={() => handleAddSuggestedTask(task)} className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed mb-4">{task.desc}</p>
                  <div className="flex gap-2">
                    {task.tags.map(tag => (
                      <span key={tag} className="text-[8px] uppercase font-black px-2 py-0.5 bg-white/5 text-gray-600 rounded-md border border-white/5">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* All Tasks Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2">
                {['All', 'Revenue', 'Marketing', 'Product', 'Custom'].map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFilter === f ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button onClick={() => openModal('create')} className="flex items-center gap-2 bg-emerald-500 text-black px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10">
                <Plus className="w-4 h-4" /> New Task
              </button>
            </div>

            <div className="bg-[#11151b] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">All Tasks</h3>
              </div>
              <div className="divide-y divide-white/5">
                {filteredTasks.map(task => (
                  <div key={task.id} className="p-6 hover:bg-white/[0.02] transition-all flex items-center justify-between group">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{task.name}</h4>
                      <p className="text-[10px] text-gray-500 mb-3 max-w-md truncate">Total revenue grouped by week for the last 12 weeks etc.</p>
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-md border ${
                          task.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          task.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {task.status}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-gray-600">
                          <RefreshCw className="w-3 h-3" /> {task.freq}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-gray-600 uppercase">
                          <Activity className="w-3 h-3" /> {task.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-12 shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <TinySparkline data={task.trend} color={task.color} />
                          <div className="text-right">
                            <p className="text-xs font-black text-white">{task.value}</p>
                            <p className={`text-[9px] font-bold ${task.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{task.change}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right w-24">
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest flex items-center justify-end gap-1 mb-1">
                          <Clock className="w-3 h-3" /> Last run
                        </p>
                        <p className="text-[11px] font-black text-gray-300">{task.lastRun}</p>
                      </div>

                      <div className="flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleToggleTaskStatus(task.id)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                          {task.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => openModal('edit', task)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alert-Based Tasks */}
          <section className="bg-[#11151b] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
             <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-200">Alert-Based Tasks</h3>
             </div>
             <div className="divide-y divide-white/5">
                {alerts.map((alert) => (
                  <div key={alert.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.01] transition-all">
                    <div>
                      <p className="text-[11px] font-bold text-gray-200">{alert.name}</p>
                      <p className="text-[10px] text-gray-500">{alert.rule}</p>
                    </div>
                    <button onClick={() => handleToggleAlert(alert.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      alert.status === 'active' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black' : 'bg-white/5 text-gray-600 hover:text-white'
                    }`}>
                      {alert.status === 'active' ? <Bell className="w-3.5 h-3.5" /> : <BellRing className="w-3.5 h-3.5 opacity-50" />}
                    </button>
                  </div>
                ))}
             </div>
          </section>

          <div className="h-10" />
        </div>
      </main>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#161b22] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">{modalMode === 'create' ? 'Create New Task' : 'Edit Task'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">Task Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#0b0f15] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 text-white"
                  placeholder="e.g. Sales Monitor"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">Category</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-[#0b0f15] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 text-white"
                  >
                    <option>Revenue</option>
                    <option>Product</option>
                    <option>Marketing</option>
                    <option>Custom</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">Frequency</label>
                  <select 
                    value={formData.freq}
                    onChange={e => setFormData({...formData, freq: e.target.value})}
                    className="w-full bg-[#0b0f15] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 text-white"
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition">Cancel</button>
              <button onClick={handleSaveTask} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl transition">Save Data Analytics</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const RefreshCw = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);
