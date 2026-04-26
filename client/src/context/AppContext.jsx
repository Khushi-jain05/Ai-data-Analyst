import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const Ctx = createContext(null);
const API = 'http://localhost:5000/api';

export function AppProvider({ children }) {
  const [page,        setPage]        = useState('home');
  const [dataset,     setDataset]     = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [history,     setHistory]     = useState([
    { id:1, icon:'📊', q:'Show me top 10 customers by revenue',  file:'Q1_Sales_Report.csv',    time:'3h ago' },
    { id:2, icon:'📈', q:'Compare Q1 vs Q2 performance',         file:'Revenue_Analysis.json',  time:'1d ago' },
    { id:3, icon:'📋', q:'Revenue breakdown by region',           file:'Customer_Segments.xlsx', time:'2d ago' },
    { id:4, icon:'🗄', q:'Which products have declining sales?',  file:'Q1_Sales_Report.csv',    time:'3d ago' },
    { id:5, icon:'📊', q:'Average order value by segment',        file:'Customer_Segments.xlsx', time:'4d ago' },
  ]);

  const navigate = useCallback((p) => setPage(p), []);

  // Load hardcoded demo dataset (no server needed)
  const loadDataset = useCallback((meta) => {
    setDataset(meta);
    setMessages([{
      id: Date.now(), role: 'ai', type: 'show_insight',
      data: {
        text: `**${meta.name}** loaded — **${meta.rowCount.toLocaleString()} rows**, ${meta.columns} columns detected.\n\nI'm ready to analyse your data. What would you like to explore?`,
        highlights: meta.hints || [],
      },
    }]);
    setPage('chat');
  }, []);

  // Upload a REAL file to the Express backend
  const uploadFile = useCallback(async (file) => {
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);   // 'file' must match multer field name

      const { data } = await axios.post(`${API}/upload/file`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Build dataset metadata from server response
      const meta = {
        name:     data.name,
        rowCount: data.rowCount,
        columns:  data.columns,
        hints:    data.columnNames?.slice(0, 5).map(c => `Column: ${c}`) || [],
        datasetId: data.datasetId,
        preview:  data.preview,
      };

      setDataset(meta);
      setMessages([{
        id: Date.now(), role: 'ai', type: 'show_insight',
        data: {
          text: `**${data.name}** uploaded — **${data.rowCount.toLocaleString()} rows**, ${data.columns} columns detected.\n\nWhat would you like to explore?`,
          highlights: data.columnNames?.slice(0, 6).map(c => `Column: ${c}`) || [],
        },
      }]);
      setPage('chat');

    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Upload failed';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }, []);

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]);
  }, []);

  const addHistory = useCallback((q, file) => {
    setHistory(prev => [{ id: Date.now(), icon:'📊', q, file, time:'just now' }, ...prev]);
  }, []);

  const clearChat = useCallback(() => setMessages([]), []);

  return (
    <Ctx.Provider value={{
      page, navigate,
      dataset, loadDataset,
      messages, addMessage, clearChat,
      history, addHistory,
      uploading, uploadFile,
      uploadError, setUploadError,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);