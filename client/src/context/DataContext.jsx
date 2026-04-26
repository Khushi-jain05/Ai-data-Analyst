import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const DataContext = createContext();

/* ─── helpers ─── */
const fmt = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
};

const DAY_NAMES  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const DataProvider = ({ children }) => {
  const [data, setDataRaw] = useState([]);
  const [fileName, setFileName] = useState('');
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [metrics, setMetrics] = useState({
    totalSales: '1,200K',
    salesGrowth: '+2.1%',
    visitorData: WEEK_DAYS.map((d, i) => ({ name: d, value: 80 + i * 12 })),
    revenueData: SHORT_DAYS.map((d, i) => ({ name: d, value: 180 + i * 45 })),
    retentionRate: 72,
    topCustomers: [
      { name: 'Devon Lane',        type: 'Social app',  avatar: 'https://i.pravatar.cc/150?u=devon'   },
      { name: 'Wade Warren',       type: 'Mobile web',  avatar: 'https://i.pravatar.cc/150?u=wade'    },
      { name: 'Darlene Robertson', type: 'E-commerce',  avatar: 'https://i.pravatar.cc/150?u=darlene' },
    ],
    marketShare: [
      { name: 'Tiktok',     value: 32, color: '#10b981' },
      { name: 'Instagram',  value: 50, color: '#ef4444' },
    ],
    dailyActivity: WEEK_DAYS.map((d, i) => ({ d, v: 55 + i * 7 })),
    weeklyTasks: { completed: 7, total: 10, pct: 70 },
    avgOrderValue: '$120',
    topCategory: 'Technology',
    anomalies: [],
  });

  /* ── fetchHistory from backend ── */
  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5002/api/history', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setHistory(res.data.history || []);
      return res.data.history || [];
    } catch (err) {
      console.error('History fetch error:', err.message);
      return [];
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  /* ── smart column finder ── */
  const findCol = useCallback((cols, hints) =>
    cols.find(c => hints.some(h => c.toLowerCase().includes(h))), []);

  const firstNumericCol = useCallback((cols, rows) =>
    cols.find(c => {
      const vals = rows.slice(0, 20).map(r => r[c]).filter(v => v != null && v !== '');
      return vals.length > 0 && vals.every(v => !isNaN(Number(v)));
    }), []);

  /* ─────────────────────── processBusinessData ─────────────────────── */
  const processBusinessData = useCallback((rows) => {
    if (!rows || rows.length === 0) return;

    const cols = Object.keys(rows[0]);

    // ── column detection ──
    const salesCol = findCol(cols, ['sales', 'revenue', 'amount', 'total', 'price', 'income', 'value', 'turnover', 'profit']);
    const dateCol  = findCol(cols, ['date', 'time', 'created', 'ordered', 'timestamp', 'day', 'month']);
    const custCol  = findCol(cols, ['customer', 'client', 'buyer', 'name', 'user', 'person']);
    const catCol   = findCol(cols, ['category', 'segment', 'type', 'region', 'product', 'department']);

    const numCol = salesCol || firstNumericCol(cols, rows);

    const numOf = (row) => (numCol ? parseFloat(row[numCol]) || 0 : 1);

    // ── total sales ──
    const total = rows.reduce((s, r) => s + numOf(r), 0);

    // ── growth: compare first half vs second half ──
    const half     = Math.floor(rows.length / 2);
    const firstH   = rows.slice(0, half).reduce((s, r) => s + numOf(r), 0);
    const secondH  = rows.slice(half).reduce((s, r) => s + numOf(r), 0);
    const growthPct = firstH > 0 ? ((secondH - firstH) / firstH * 100).toFixed(1) : 2.1;
    const salesGrowth = `${growthPct > 0 ? '+' : ''}${growthPct}%`;

    // ── visitor data (Mon-Sun) by day-of-week ──
    const dayCount = Object.fromEntries(WEEK_DAYS.map(d => [d, 0]));
    const daySum   = Object.fromEntries(WEEK_DAYS.map(d => [d, 0]));

    rows.forEach(row => {
      let resolved = null;
      if (dateCol) {
        const d = new Date(row[dateCol]);
        if (!isNaN(d)) resolved = DAY_NAMES[d.getDay()];
      }
      if (!resolved) {
        // distribute evenly
        resolved = WEEK_DAYS[Math.floor(Math.random() * 7)];
      }
      if (dayCount[resolved] !== undefined) {
        dayCount[resolved]++;
        daySum[resolved] += numOf(row);
      }
    });

    const maxDaySum = Math.max(...Object.values(daySum), 1);
    const visitorData = WEEK_DAYS.map(d => ({
      name: d,
      value: Math.round((daySum[d] / maxDaySum) * 130) + 50,
    }));

    // ── revenue data (Mon-Fri) — chunks of rows ──
    const chunk = Math.ceil(rows.length / 5);
    const revenueData = SHORT_DAYS.map((d, i) => ({
      name: d,
      value: Math.round(rows.slice(i * chunk, (i + 1) * chunk).reduce((s, r) => s + numOf(r), 0)),
    }));

    // ── retention rate ──
    let retentionRate = 72;
    if (numCol) {
      const vals    = rows.map(r => parseFloat(r[numCol])).filter(v => !isNaN(v));
      const avg     = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
      const above   = vals.filter(v => v >= avg).length;
      retentionRate = Math.max(40, Math.min(95, Math.round((above / vals.length) * 100)));
    }

    // ── top customers ──
    let topCustomers = metrics.topCustomers;
    if (custCol) {
      const map = {};
      rows.forEach(row => {
        const key = String(row[custCol] || '').trim();
        if (key) map[key] = (map[key] || 0) + numOf(row);
      });
      const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3);
      if (sorted.length >= 2) {
        topCustomers = sorted.map(([name, val], i) => ({
          name,
          type: catCol ? (rows.find(r => String(r[custCol]).trim() === name)?.[catCol] || 'N/A') : 'Customer',
          revenue: fmt(val),
          avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}${i}`,
        }));
      }
    }

    // ── market share (top 2 categories) ──
    let marketShare = metrics.marketShare;
    if (catCol) {
      const map = {};
      rows.forEach(row => {
        const k = String(row[catCol] || '').trim();
        if (k) map[k] = (map[k] || 0) + numOf(row);
      });
      const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
      const totalCat = sorted.reduce((s, [, v]) => s + v, 0);
      if (sorted.length >= 2) {
        marketShare = sorted.slice(0, 2).map(([name, val], i) => ({
          name,
          value: Math.round((val / totalCat) * 100),
          color: i === 0 ? '#10b981' : '#ef4444',
        }));
      }
    }

    // ── daily activity (Mon-Sun) — record count per day ──
    const dayAct = Object.fromEntries(WEEK_DAYS.map(d => [d, 0]));
    rows.forEach(row => {
      let dn = null;
      if (dateCol) {
        const d = new Date(row[dateCol]);
        if (!isNaN(d)) dn = DAY_NAMES[d.getDay()];
      }
      if (!dn) dn = WEEK_DAYS[Math.floor(Math.random() * 7)];
      if (dayAct[dn] !== undefined) dayAct[dn]++;
    });
    const maxAct = Math.max(...Object.values(dayAct), 1);
    const dailyActivity = WEEK_DAYS.map(d => ({
      d,
      v: Math.round((dayAct[d] / maxAct) * 80) + 30,
    }));

    // ── weekly tasks ──
    const completedTasks = Math.max(1, Math.min(10, Math.round(retentionRate / 10)));
    const taskPct        = completedTasks * 10;

    // ── top category ──
    let topCategory = 'Technology';
    if (catCol) {
      const map = {};
      rows.forEach(r => { const k = r[catCol]; if (k) map[k] = (map[k] || 0) + 1; });
      topCategory = Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Technology';
    }

    // ── avg order value ──
    const avgOrder = numCol ? `$${fmt(total / rows.length)}` : '$120';

    // ── anomalies ──
    const anomalies = [];
    if (growthPct > 10) anomalies.push({ type: 'spike', text: `Revenue spike: ${salesGrowth} growth in second half of dataset` });
    if (growthPct < -5) anomalies.push({ type: 'drop',  text: `Revenue drop detected: ${salesGrowth} decline vs first half` });
    anomalies.push({ type: 'info', text: `${rows.length.toLocaleString()} records analyzed across ${cols.length} columns` });

    setMetrics({
      totalSales: fmt(total),
      salesGrowth,
      visitorData,
      revenueData,
      retentionRate,
      topCustomers,
      marketShare,
      dailyActivity,
      weeklyTasks: { completed: completedTasks, total: 10, pct: taskPct },
      avgOrderValue: avgOrder,
      topCategory,
      anomalies,
    });
  }, [findCol, firstNumericCol, metrics.topCustomers, metrics.marketShare]);

  const setData = useCallback((newData, name) => {
    setDataRaw(newData);
    setFileName(name || '');
  }, []);

  /* ── GLOBAL MOUNT INIT: Fetch user & latest dataset on refresh/login ── */
  const initGlobal = useCallback(async () => {
    const token = localStorage.getItem('token');
    console.log('🔄 initGlobal: Token present?', !!token);
    if (!token) return;
    
    try {
      // 1. Fetch user globally
      if (!currentUser) {
        console.log('📡 initGlobal: Fetching /api/auth/me...');
        const uRes = await axios.get('http://localhost:5002/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ initGlobal: User fetched:', uRes.data.user);
        setCurrentUser(uRes.data.user);
      }

      // 2. Fetch history globally
      console.log('📡 initGlobal: Fetching history...');
      const hist = await fetchHistory();
      if (hist && hist.length > 0 && data.length === 0) {
        console.log('📡 initGlobal: Auto-loading newest dataset:', hist[0].filename);
        // 3. Auto-load the newest dataset
        const dRes = await axios.get(`http://localhost:5002/api/history/${hist[0].id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const upload = dRes.data.upload;
        const parsed = JSON.parse(upload.file_data);
        setDataRaw(parsed);
        setFileName(upload.filename);
        processBusinessData(parsed);
        console.log('✅ initGlobal: Dataset loaded.');
      }
    } catch (err) {
      console.error('❌ Global data init failed:', err.message);
      if (err.response?.status === 401) {
        console.log('🚨 401 Unauthorized detected. Clearing token and redirecting...');
        localStorage.removeItem('token');
        setCurrentUser(null);
        window.location.href = '/login';
      }
    }
  }, [currentUser, data.length, fetchHistory, processBusinessData]);

  useEffect(() => {
    initGlobal();
  }, [initGlobal]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  /* ── Update User Profile ── */
  const updateUserProfile = useCallback(async (updatedFields) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('http://localhost:5002/api/auth/update', updatedFields, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(res.data.user);
      return { success: true, message: res.data.message };
    } catch (err) {
      console.error('Update profile error:', err.message);
      return { success: false, message: err.response?.data?.error || 'Failed to update profile' };
    }
  }, []);

  return (
    <DataContext.Provider value={{
      data, setData, fileName, metrics, history, isHistoryLoading, fetchHistory, processBusinessData,
      currentUser, setCurrentUser, initGlobal, updateUserProfile,
      theme, setTheme
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};
