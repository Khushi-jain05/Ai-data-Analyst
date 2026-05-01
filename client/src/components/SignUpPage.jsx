import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import logo from '../assets/logo.png';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');

  const isGoogleConfigured = process.env.REACT_APP_GOOGLE_CLIENT_ID && process.env.REACT_APP_GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID';

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!isGoogleConfigured) {
        setError('Google Login is not configured. Please add your Client ID to the .env file.');
        return;
      }
      try {
        const res = await axios.post('https://ai-data-analyst-lt82.onrender.com/api/auth/google', { access_token: tokenResponse.access_token });
        localStorage.setItem('token', res.data.token);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.error || 'Google signup failed.');
      }
    },
    onError: () => setError('Google Link Failed')
  });

  const handleGoogleClick = () => {
    if (!isGoogleConfigured) {
      setError('Google Login is not configured. Please add your Client ID to the client/.env file. See GETTING_STARTED_GOOGLE.md for instructions.');
      return;
    }
    googleLogin();
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('https://ai-data-analyst-lt82.onrender.com/api/auth/signup', formData);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign up failed. Please try again.');
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0b1016] text-white font-sans overflow-hidden">
      
      {/* Left Column / Brand Side */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between relative bg-emerald-900/20 px-16 py-24 border-r border-emerald-900/50">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800/40 via-emerald-950/80 to-[#0b1016] mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0b1016]"></div>
        
        <div className="relative z-10 max-w-lg mt-10">
          <img src={logo} alt="DataNova" className="w-12 h-12 object-contain mb-8" />
          <h1 className="text-5xl font-semibold mb-6 leading-tight text-white">Get Started <br/> with Us</h1>
          <p className="text-emerald-200/70 text-lg leading-relaxed max-w-sm">
            Complete these easy steps to register your account.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative z-10 flex gap-4 mt-auto pb-10">
          {/* Step 1 - Active */}
          <div className="bg-white text-black p-5 flex-1 rounded-2xl shadow-xl transition-transform hover:-translate-y-1">
            <div className="w-6 h-6 bg-black text-white text-xs rounded-full flex items-center justify-center mb-4">1</div>
            <h3 className="font-bold text-sm">Sign up your<br/>account</h3>
          </div>
          {/* Step 2 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 flex-1 rounded-2xl transition-transform hover:-translate-y-1">
            <div className="w-6 h-6 bg-white/20 text-white text-xs rounded-full flex items-center justify-center mb-4">2</div>
            <h3 className="font-semibold text-sm text-gray-300">Set up your<br/>workspace</h3>
          </div>
          {/* Step 3 */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 flex-1 rounded-2xl transition-transform hover:-translate-y-1">
            <div className="w-6 h-6 bg-white/20 text-white text-xs rounded-full flex items-center justify-center mb-4">3</div>
            <h3 className="font-semibold text-sm text-gray-300">Set up your<br/>profile</h3>
          </div>
        </div>
      </div>

      {/* Right Column / Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0b1016]">
        <div className="w-full max-w-md">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold mb-3">Sign Up Account</h2>
            <p className="text-gray-400 text-sm">Enter your personal data to create your account.</p>
          </div>

          {/* Social Logins */}
          <div className="w-full mb-8">
            <button type="button" onClick={handleGoogleClick} className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-white/10 rounded-xl hover:bg-white/5 transition text-sm font-medium">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-xs text-gray-500 font-medium">Or</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          {error && <div className="mb-4 text-xs font-semibold text-red-400 bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</div>}
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-gray-400">First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="eg. John" className="w-full bg-[#1c212b] border-none outline-none text-sm text-white px-4 py-3.5 rounded-xl focus:ring-1 focus:ring-emerald-500 transition placeholder:text-gray-600" required />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-gray-400">Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="eg. Francisco" className="w-full bg-[#1c212b] border-none outline-none text-sm text-white px-4 py-3.5 rounded-xl focus:ring-1 focus:ring-emerald-500 transition placeholder:text-gray-600" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="eg. johnfrans@gmail.com" className="w-full bg-[#1c212b] border-none outline-none text-sm text-white px-4 py-3.5 rounded-xl focus:ring-1 focus:ring-emerald-500 transition placeholder:text-gray-600" required />
            </div>

            <div className="space-y-2 relative">
              <label className="text-xs font-medium text-gray-400">Password</label>
              <div className="relative">
                 <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" minLength={8} className="w-full bg-[#1c212b] border-none outline-none text-sm text-white px-4 py-3.5 pr-12 rounded-xl focus:ring-1 focus:ring-emerald-500 transition placeholder:text-gray-600" required />
                 <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                   <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg>
                 </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Must be at least 8 characters.</p>
            </div>

            <button type="submit" className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-3.5 rounded-xl transition mt-2 mb-6">
              Sign Up
            </button>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              Already have an account? <Link to="/login" className="text-white hover:underline ml-1 font-medium">Log in</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
