import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import '../styles/Navbar.css';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [currentUser]);

  async function checkAdminStatus() {
    if (!currentUser) return;
    
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists() && userDoc.data().isAdmin === true) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  if (!currentUser) return null;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">🃏♠️♥️ MPN</div>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/statistics">Statistics</Link>
          {isAdmin && <Link to="/admin" className="admin-link">Admin</Link>}
          <span className="nav-user">👤 {currentUser.displayName || currentUser.email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>
    </nav>
  );
}
