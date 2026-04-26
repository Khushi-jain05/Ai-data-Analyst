import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import {
  LayoutDashboard, FileBarChart, Users, DollarSign,
  Megaphone, Target, CheckSquare, MessageCircle, HelpCircle,
  History as HistoryIcon, Settings, Loader2, Search, Bell,
  ChevronRight, Clock, User, Lock, Database, CreditCard,
  Camera, Save
} from 'lucide-react';
import logo from '../assets/logo.png';
import { useData } from '../context/DataContext';

const SidebarItem = ({ icon: Icon, label, active, badge, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group
      ${active ? 'bg-emerald-500 text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
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

const SettingCategory = ({ icon: Icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
      ${active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-sm font-semibold">{label}</span>
  </div>
);

export default function SettingsPage() {
  const navigate = useNavigate();
  const { 
    history, isHistoryLoading, currentUser, setCurrentUser, 
    fileName, data, updateUserProfile, theme, setTheme 
  } = useData();

  const [activeCategory, setActiveCategory] = useState('Profile');
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formDataFile = new FormData();
    formDataFile.append('image', file);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5002/api/auth/upload-profile-image', formDataFile, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      setCurrentUser(prev => ({ ...prev, profileImage: res.data.imageUrl }));
      setStatus({ type: 'success', message: 'Profile picture updated!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Upload failed' });
    }
  };


  const [formData, setFormData] = useState({
    fullName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : '',
    userName: currentUser?.userName || '',
    email: currentUser?.email || '',
    role: currentUser?.role || '',
    bio: currentUser?.bio || ''
  });

  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordData.newPassword) return setStatus({ type: 'error', message: 'New password required' });
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5002/api/auth/change-password', passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus({ type: 'success', message: 'Password updated!' });
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Update failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAccountDelete = async () => {
    if (!window.confirm('Are you absolutely sure? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5002/api/auth/delete-account', {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to delete account' });
    }
  };


  // Sync if currentUser loads later
  React.useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        userName: currentUser.userName || '',
        email: currentUser.email || '',
        role: currentUser.role || '',
        bio: currentUser.bio || ''
      });
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (status.message) setStatus({ type: '', message: '' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatus({ type: '', message: '' });

    const [firstName, ...rest] = formData.fullName.split(' ');
    const lastName = rest.join(' ');

    const result = await updateUserProfile({
      firstName,
      lastName,
      email: formData.email,
      userName: formData.userName,
      role: formData.role,
      bio: formData.bio
    });

    setIsSaving(false);
    setStatus({ 
      type: result.success ? 'success' : 'error', 
      message: result.message 
    });

    if (result.success) {
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    }
  };


  if (!currentUser) {
    return (
      <div className="bg-[#0b0f15] h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0b0f15] text-white overflow-hidden font-sans">
      
      {/* ═══ SIDEBAR ═══ */}
      <aside className="w-64 border-r border-white/5 bg-[#0b0f15] flex flex-col hidden lg:flex shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="DataNova" className="w-8 h-8 object-contain" />
            <span className="text-xl font-bold tracking-tight text-white">DataNova</span>
          </div>

          <nav className="space-y-1.5 text-sm">
            <SidebarItem icon={LayoutDashboard} label="Overview" onClick={() => navigate('/dashboard')} />
            <SidebarItem icon={FileBarChart}   label="Report"   onClick={() => navigate('/report')} />
            <SidebarItem icon={HistoryIcon}    label="History"  onClick={() => navigate('/history')} />
            <SidebarItem icon={Users}          label="Lead" onClick={() => navigate('/leads')} />
            <SidebarItem icon={DollarSign}     label="Revenue"  onClick={() => navigate('/revenue')} />
            <SidebarItem icon={Megaphone}      label="Marketing" onClick={() => navigate('/marketing')} />
            <SidebarItem icon={CheckSquare}    label="Task" onClick={() => navigate('/tasks')} />
            <SidebarItem icon={MessageCircle}  label="Contacts" onClick={() => navigate('/contacts')} />
            <SidebarItem icon={HelpCircle}     label="Help Center" badge="4" onClick={() => navigate('/help')} />
            <SidebarItem icon={Settings}       label="Settings" active badge="1" onClick={() => navigate('/settings')} />
          </nav>

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3 px-3">
              <HistoryIcon className="w-4 h-4 text-gray-500" />
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Recent Activity</p>
            </div>
            <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
              {isHistoryLoading ? (
                 <div className="px-3 py-2 flex items-center gap-2 text-xs text-gray-600">
                   <Loader2 className="w-3 h-3 animate-spin" />
                   <span>Syncing…</span>
                 </div>
              ) : history.length > 0 ? (
                history.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-not-allowed group transition-all">
                    <Clock className="w-3.5 h-3.5 text-gray-600 group-hover:text-emerald-400 flex-shrink-0" />
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-xs text-gray-400 font-medium truncate">{item.filename}</span>
                      <span className="text-[9px] text-gray-600 uppercase font-bold">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-gray-600 italic">No recent uploads</p>
              )}
            </div>
          </div>

          <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white/10 group cursor-pointer transition-all" onClick={() => navigate('/report')}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[11px] font-bold text-white flex items-center justify-between">
                Report status
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-1 transition" />
              </span>
              <span className="text-[9px] text-gray-500 truncate">
                {data?.length ? `${data.length.toLocaleString()} records loaded` : 'No data loaded'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto p-4">
          <div className="bg-[#161b22] p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-3">Customer metric</p>
            <div className="flex justify-between items-end text-left">
              <div>
                <p className="text-xs text-gray-400">Lifetime value</p>
                <p className="text-sm font-bold text-white">$92,500</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Net promoter</p>
                <p className="text-sm font-bold text-emerald-400">Score 70</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center px-10 justify-between shrink-0 bg-[#0b0f15]/80 backdrop-blur-md z-10">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold">Settings</h2>
            <p className="text-xs text-gray-500 font-medium">Manage your account, preferences and AI workspace</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search settings..." 
                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs w-64 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-gray-600"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-500 cursor-pointer hover:text-white" />
                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-sm uppercase border border-emerald-500/20 overflow-hidden">
                {currentUser?.profileImage ? (
                  <img src={currentUser.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <>{currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}</>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="flex gap-10 max-w-6xl">
            
            {/* Left Nav (Categories) */}
            <div className="w-64 flex flex-col gap-2 shrink-0">
              <SettingCategory 
                icon={User} 
                label="Profile" 
                active={activeCategory === 'Profile'} 
                onClick={() => setActiveCategory('Profile')} 
              />
              <SettingCategory 
                icon={Lock} 
                label="Account" 
                active={activeCategory === 'Account'} 
                onClick={() => setActiveCategory('Account')} 
              />
              <SettingCategory 
                icon={Bell} 
                label="Notifications" 
                active={activeCategory === 'Notifications'} 
                onClick={() => setActiveCategory('Notifications')} 
              />
            </div>

            {/* Main Panel Content */}
            <div className="flex-1 bg-[#161b22] border border-white/5 rounded-[32px] p-8 shadow-2xl relative min-h-[600px]">

              
              {activeCategory === 'Profile' && (
                <>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Profile information</h3>
                      <p className="text-sm text-gray-500">How others see you on the platform</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {status.message && (
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                          status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {status.message}
                        </span>
                      )}
                      <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {isSaving ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </div>

                  {/* Avatar Section */}
                  <div className="flex items-center gap-6 mb-10">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center overflow-hidden">
                        {currentUser?.profileImage ? (
                          <img src={currentUser.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-emerald-500 text-3xl font-black uppercase">
                            {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div 
                        onClick={() => document.getElementById('profile-upload').click()}
                        className="absolute inset-0 bg-black/40 rounded-[24px] opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                      >
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <input 
                        type="file" 
                        id="profile-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                      />

                      <button 
                        onClick={() => document.getElementById('profile-upload').click()}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all mb-2"
                      >
                        Upload new picture
                      </button>
                      <p className="text-[10px] text-gray-600 font-medium">PNG, JPG up to 2MB</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Full name</label>
                      <input 
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="bg-[#0b0f15] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Username</label>
                      <input 
                        name="userName"
                        value={formData.userName}
                        onChange={handleInputChange}
                        className="bg-[#0b0f15] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</label>
                      <input 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="bg-[#0b0f15] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</label>
                      <input 
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="bg-[#0b0f15] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-2 col-span-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bio</label>
                      <textarea 
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows="4"
                        className="bg-[#0b0f15] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all text-white resize-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeCategory === 'Account' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Account settings</h3>
                      <p className="text-sm text-gray-500">Manage your password and security</p>
                    </div>
                    {status.message && (
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                        status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {status.message}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-6 max-w-md">
                    <form onSubmit={handlePasswordChange} className="bg-[#0b0f15] p-6 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Current Password</label>
                        <input 
                          type="password" 
                          placeholder="••••••••" 
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="bg-[#161b22] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 text-white" 
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">New Password</label>
                        <input 
                          type="password" 
                          placeholder="••••••••" 
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="bg-[#161b22] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500/50 text-white" 
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isSaving}
                        className="bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-2.5 rounded-xl transition-all w-full border border-white/10 disabled:opacity-50"
                      >
                        {isSaving ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>

                    <div className="pt-6 border-t border-white/5">
                      <h4 className="text-rose-500 font-bold text-sm mb-2">Danger Zone</h4>
                      <p className="text-xs text-gray-500 mb-4">Permanently delete your account and all associated data.</p>
                      <button 
                        onClick={handleAccountDelete}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs px-6 py-2.5 rounded-xl border border-rose-500/20 transition-all font-sans"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}



              {activeCategory === 'Notifications' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Notifications</h3>
                    <p className="text-sm text-gray-500">Control when and how you receive alerts</p>
                  </div>

                  <div className="space-y-4 max-w-2xl">
                    {[
                      { title: 'Email Notifications', desc: 'Receive daily report summaries via email' },
                      { title: 'Push Alerts', desc: 'Get instant browser alerts for anomalies' },
                      { title: 'Weekly Digest', desc: 'A weekly overview of your team performance' },
                      { title: 'Security Alerts', desc: 'Critical alerts about your account login' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-[#0b0f15] rounded-2xl border border-white/5">
                        <div>
                          <p className="text-sm font-bold text-white">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <div className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}



            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







