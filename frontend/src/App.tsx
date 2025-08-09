import React, { useEffect, useState } from 'react';
import Home from './pages/Home';
import './App.css';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <>
      <nav className="navbar">
        <h2>Real Estate</h2>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
        </button>
      </nav>

      {/* ✅ FIX: Wrap the page inside the page-wrapper */}
      <div className="page-wrapper">
        <Home />
      </div>
    </>
  );
};

export default App;
