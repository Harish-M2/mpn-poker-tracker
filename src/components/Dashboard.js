import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [formData, setFormData] = useState({
    tournament_date: new Date().toISOString().split('T')[0],
    buy_in: '',
    rebuys: '0',
    winnings: '0',
    total_players: '',
    placement: ''
  });

  const [stats, setStats] = useState({
    total_tournaments: 0,
    total_spent: 0,
    total_winnings: 0,
    net_profit: 0,
    total_points: 0,
    win_rate: 0,
    average_placement: 0,
    best_month: null,
    worst_month: null,
    times_in_money: 0
  });

  useEffect(() => {
    fetchTournaments();
    fetchUserName();
  }, [currentUser]);

  async function fetchUserName() {
    try {
      const { doc: docRef, getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(docRef(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserName(userDoc.data().displayName || currentUser.email);
      } else {
        // User document doesn't exist, create it
        const displayName = prompt('Please enter your name for the leaderboard:');
        if (displayName) {
          await createUserDocument(displayName);
          setUserName(displayName);
        } else {
          setUserName(currentUser.email);
        }
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
      setUserName(currentUser.email);
    }
  }

  async function createUserDocument(displayName) {
    try {
      const { doc: docRef, setDoc } = await import('firebase/firestore');
      await setDoc(docRef(db, 'users', currentUser.uid), {
        displayName: displayName,
        email: currentUser.email,
        isAdmin: false, // Set to true if you want to be admin
        createdAt: new Date()
      });
      console.log('User document created');
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }

  async function fetchTournaments() {
    try {
      const q = query(
        collection(db, 'tournaments'),
        where('userId', '==', currentUser.uid),
        orderBy('tournament_date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const tournamentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTournaments(tournamentsData);
      calculateStats(tournamentsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      
      // If index error, fetch without orderBy
      if (error.code === 'failed-precondition' || error.message.includes('index')) {
        console.log('Fetching without index...');
        try {
          const simpleQuery = query(
            collection(db, 'tournaments'),
            where('userId', '==', currentUser.uid)
          );
          const querySnapshot = await getDocs(simpleQuery);
          const tournamentsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).sort((a, b) => new Date(b.tournament_date) - new Date(a.tournament_date));
          
          setTournaments(tournamentsData);
          calculateStats(tournamentsData);
        } catch (err) {
          console.error('Error with simple query:', err);
        }
      }
      setLoading(false);
    }
  }

  function calculateStats(tournamentsData) {
    if (tournamentsData.length === 0) {
      setStats({ total_tournaments: 0, total_spent: 0, total_winnings: 0, net_profit: 0, total_points: 0, win_rate: 0, average_placement: 0, best_month: null, worst_month: null, times_in_money: 0 });
      return;
    }

    // Basic stats
    const basicStats = tournamentsData.reduce((acc, t) => {
      const spent = parseFloat(t.buy_in) + parseFloat(t.rebuys);
      const winnings = parseFloat(t.winnings);
      const points = t.points || 0;
      const placement = parseInt(t.placement) || 0;
      const totalPlayers = parseInt(t.total_players) || 0;
      
      // Count times in money (top 3 or top 33%)
      const inMoneyThreshold = Math.max(3, Math.ceil(totalPlayers * 0.33));
      const inMoney = placement > 0 && placement <= inMoneyThreshold ? 1 : 0;
      
      return {
        total_tournaments: acc.total_tournaments + 1,
        total_spent: acc.total_spent + spent,
        total_winnings: acc.total_winnings + winnings,
        net_profit: acc.net_profit + (winnings - spent),
        total_points: acc.total_points + points,
        total_placement: acc.total_placement + placement,
        wins: acc.wins + (placement === 1 ? 1 : 0),
        times_in_money: acc.times_in_money + inMoney
      };
    }, { total_tournaments: 0, total_spent: 0, total_winnings: 0, net_profit: 0, total_points: 0, total_placement: 0, wins: 0, times_in_money: 0 });

    // Calculate win rate and average placement
    const win_rate = basicStats.total_tournaments > 0 
      ? ((basicStats.wins / basicStats.total_tournaments) * 100).toFixed(1)
      : 0;
    
    const average_placement = basicStats.total_tournaments > 0
      ? (basicStats.total_placement / basicStats.total_tournaments).toFixed(1)
      : 0;

    // Calculate best/worst month
    const monthlyStats = {};
    tournamentsData.forEach(t => {
      const month = t.tournament_date.substring(0, 7);
      if (!monthlyStats[month]) {
        monthlyStats[month] = { profit: 0, tournaments: 0, month };
      }
      const spent = parseFloat(t.buy_in) + parseFloat(t.rebuys);
      const winnings = parseFloat(t.winnings);
      monthlyStats[month].profit += (winnings - spent);
      monthlyStats[month].tournaments += 1;
    });

    const monthsArray = Object.values(monthlyStats);
    const best_month = monthsArray.length > 0 
      ? monthsArray.reduce((max, month) => month.profit > max.profit ? month : max)
      : null;
    
    const worst_month = monthsArray.length > 0
      ? monthsArray.reduce((min, month) => month.profit < min.profit ? month : min)
      : null;
    
    setStats({
      ...basicStats,
      win_rate,
      average_placement,
      best_month,
      worst_month
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      // Calculate points based on placement
      const totalPlayers = parseInt(formData.total_players) || 0;
      const placement = parseInt(formData.placement) || 0;
      const points = totalPlayers > 0 && placement > 0 && placement <= totalPlayers 
        ? totalPlayers - placement + 1 
        : 0;
      
      await addDoc(collection(db, 'tournaments'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: userName || currentUser.email,
        tournament_date: formData.tournament_date,
        buy_in: parseFloat(formData.buy_in),
        rebuys: parseFloat(formData.rebuys),
        winnings: parseFloat(formData.winnings),
        total_players: totalPlayers,
        placement: placement,
        points: points,
        createdAt: new Date()
      });
      
      setFormData({
        tournament_date: new Date().toISOString().split('T')[0],
        buy_in: '',
        rebuys: '0',
        winnings: '0',
        total_players: '',
        placement: ''
      });
      
      fetchTournaments();
    } catch (error) {
      console.error('Error adding tournament:', error);
      alert('Failed to add tournament entry');
    }
  }

  async function handleDelete(id) {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteDoc(doc(db, 'tournaments', id));
        fetchTournaments();
      } catch (error) {
        console.error('Error deleting tournament:', error);
        alert('Failed to delete tournament entry');
      }
    }
  }

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p className="loading">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Welcome, {userName || currentUser.email}!</h1>
        
        {/* Statistics Summary */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Tournaments</h3>
            <p className="stat-value">{stats.total_tournaments}</p>
          </div>
          <div className="stat-card">
            <h3>Total Points</h3>
            <p className="stat-value">{stats.total_points}</p>
          </div>
          <div className="stat-card">
            <h3>Win Rate</h3>
            <p className="stat-value">{stats.win_rate}%</p>
            <p className="stat-subtitle">1st place finishes</p>
          </div>
          <div className="stat-card">
            <h3>Average Placement</h3>
            <p className="stat-value">{stats.average_placement}</p>
            <p className="stat-subtitle">Lower is better</p>
          </div>
          <div className="stat-card">
            <h3>In The Money</h3>
            <p className="stat-value">{stats.times_in_money}</p>
            <p className="stat-subtitle">Top 3 finishes</p>
          </div>
          <div className="stat-card">
            <h3>Total Spent</h3>
            <p className="stat-value">£{stats.total_spent.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Total Winnings</h3>
            <p className="stat-value">£{stats.total_winnings.toFixed(2)}</p>
          </div>
          <div className={`stat-card ${stats.net_profit >= 0 ? 'profit' : 'loss'}`}>
            <h3>Net Profit/Loss</h3>
            <p className="stat-value">£{stats.net_profit.toFixed(2)}</p>
          </div>
        </div>

        {/* Best/Worst Month Cards */}
        {stats.best_month && stats.worst_month && (
          <div className="month-stats">
            <div className="month-card best-month">
              <h3>🏆 Best Month</h3>
              <p className="month-name">{new Date(stats.best_month.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
              <p className="month-profit profit">£{stats.best_month.profit.toFixed(2)}</p>
              <p className="month-detail">{stats.best_month.tournaments} tournament{stats.best_month.tournaments !== 1 ? 's' : ''}</p>
            </div>
            <div className="month-card worst-month">
              <h3>📉 Worst Month</h3>
              <p className="month-name">{new Date(stats.worst_month.month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
              <p className="month-profit loss">£{stats.worst_month.profit.toFixed(2)}</p>
              <p className="month-detail">{stats.worst_month.tournaments} tournament{stats.worst_month.tournaments !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        {/* Add Tournament Form */}
        <div className="card">
          <h2>Add Tournament Entry</h2>
          <form onSubmit={handleSubmit} className="tournament-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tournament_date">Tournament Date</label>
                <input
                  type="date"
                  id="tournament_date"
                  name="tournament_date"
                  value={formData.tournament_date}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="total_players">Total Players</label>
                <input
                  type="number"
                  id="total_players"
                  name="total_players"
                  min="1"
                  value={formData.total_players}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="placement">Your Placement</label>
                <input
                  type="number"
                  id="placement"
                  name="placement"
                  min="1"
                  value={formData.placement}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="buy_in">Buy-in (£)</label>
                <input
                  type="number"
                  id="buy_in"
                  name="buy_in"
                  step="0.01"
                  min="0"
                  value={formData.buy_in}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="rebuys">Rebuys (£)</label>
                <input
                  type="number"
                  id="rebuys"
                  name="rebuys"
                  step="0.01"
                  min="0"
                  value={formData.rebuys}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="winnings">Winnings (£)</label>
                <input
                  type="number"
                  id="winnings"
                  name="winnings"
                  step="0.01"
                  min="0"
                  value={formData.winnings}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary">Add Entry</button>
          </form>
        </div>

        {/* Tournament History */}
        <div className="card">
          <h2>Tournament History</h2>
          {tournaments.length === 0 ? (
            <p className="no-data">No tournaments recorded yet. Add your first entry above!</p>
          ) : (
            <div className="table-responsive">
              <table className="tournament-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Players</th>
                    <th>Placement</th>
                    <th>Points</th>
                    <th>Buy-in</th>
                    <th>Rebuys</th>
                    <th>Total Spent</th>
                    <th>Winnings</th>
                    <th>Profit/Loss</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map(tournament => {
                    const totalSpent = tournament.buy_in + tournament.rebuys;
                    const profitLoss = tournament.winnings - totalSpent;
                    return (
                      <tr key={tournament.id}>
                        <td>{new Date(tournament.tournament_date).toLocaleDateString()}</td>
                        <td>{tournament.total_players || '-'}</td>
                        <td>{tournament.placement || '-'}</td>
                        <td className="points-cell">{tournament.points || 0}</td>
                        <td>£{tournament.buy_in.toFixed(2)}</td>
                        <td>£{tournament.rebuys.toFixed(2)}</td>
                        <td>£{totalSpent.toFixed(2)}</td>
                        <td>£{tournament.winnings.toFixed(2)}</td>
                        <td className={profitLoss >= 0 ? 'profit' : 'loss'}>
                          £{profitLoss.toFixed(2)}
                        </td>
                        <td>
                          <button
                            onClick={() => handleDelete(tournament.id)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
