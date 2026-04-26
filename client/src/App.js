import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LandingPage from './components/LandingPage';
import SignUpPage from './components/SignUpPage';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import SplashScreen from './components/SplashScreen';
import './index.css';
import { DataProvider } from './context/DataContext';
import { AppProvider } from './context/AppContext';
import ReportPage from './components/ReportPage';
import LeadPage from './components/LeadPage';
import RevenuePage from './components/RevenuePage';
import History from './pages/History';
import MarketingPage from './components/MarketingPage';
import TaskPage from './components/TaskPage';
import ContactPage from './components/ContactPage';
import HelpPage from './components/HelpPage';
import SettingsPage from './components/SettingsPage';


const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

function App() {
  const [loading, setLoading] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Stage 1: Display Splash (2.5s)
    const timer = setTimeout(() => {
      setFadingOut(true);
      // Stage 2: Fade out animation duration (0.8s)
      setTimeout(() => {
        setLoading(false);
      }, 750);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AppProvider>
        <DataProvider>
          <Router>
          <div className="App bg-[#0b1016]">
            {loading && <SplashScreen isFadingOut={fadingOut} />}
            
            <div>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/leads"    element={<LeadPage />} />
                <Route path="/revenue"  element={<RevenuePage />} />
                <Route path="/marketing" element={<MarketingPage />} />
                <Route path="/tasks" element={<TaskPage />} />
                <Route path="/contacts" element={<ContactPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/history"  element={<History />} />
              </Routes>
            </div>
          </div>
        </Router>
      </DataProvider>
    </AppProvider>
  </GoogleOAuthProvider>
  );
}

export default App;
