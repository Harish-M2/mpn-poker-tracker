import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';
import '../styles/AdminPanel.css';

export default function AdminPanel() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [formData, setFormData] = useState({
    tournament_date: new Date().toISOString().split('T')[0],
    buy_in: '',
    rebuys: '0',
    winnings: '0',
    total_players: '',
    placement: ''
  });

  useEffect(() => {
    checkAdminStatus();
  }, [currentUser]);

  async function checkAdminStatus() {
    try {
      const { doc: docRef, getDoc } = await import('firebase/firestore');
      const userDoc = await getDoc(docRef(db, 'users', currentUser.uid));
      const adminStatus = userDoc.exists() && userDoc.data().isAdmin === true;
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        fetchUsers();
        fetchAllTournaments();
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }

  async function fetchAllTournaments() {
    try {
      const q = query(collection(db, 'tournaments'));
      const querySnapshot = await getDocs(q);
      const tournamentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.tournament_date) - new Date(a.tournament_date));
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
  }

  async function toggleAdminStatus(userId, currentStatus) {
    if (window.confirm(`${currentStatus ? 'Remove' : 'Grant'} admin privileges?`)) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          isAdmin: !currentStatus
        });
        fetchUsers();
        alert('Admin status updated successfully');
      } catch (error) {
        console.error('Error updating admin status:', error);
        alert('Failed to update admin status');
      }
    }
  }

  async function handleAddTournament(e) {
    e.preventDefault();
    
    if (!selectedUser) {
      alert('Please select a user');
      return;
    }

    try {
      const user = users.find(u => u.id === selectedUser);
      const totalPlayers = parseInt(formData.total_players) || 0;
      const placement = parseInt(formData.placement) || 0;
      const points = totalPlayers > 0 && placement > 0 && placement <= totalPlayers 
        ? totalPlayers - placement + 1 
        : 0;

      await addDoc(collection(db, 'tournaments'), {
        userId: selectedUser,
        userEmail: user.email,
        userName: user.displayName || user.email,
        tournament_date: formData.tournament_date,
        buy_in: parseFloat(formData.buy_in),
        rebuys: parseFloat(formData.rebuys),
        winnings: parseFloat(formData.winnings),
        total_players: totalPlayers,
        placement: placement,
        points: points,
        createdAt: new Date(),
        addedBy: currentUser.uid
      });

      setFormData({
        tournament_date: new Date().toISOString().split('T')[0],
        buy_in: '',
        rebuys: '0',
        winnings: '0',
        total_players: '',
        placement: ''
      });
      setSelectedUser('');
      fetchAllTournaments();
      alert('Tournament added successfully');
    } catch (error) {
      console.error('Error adding tournament:', error);
      alert('Failed to add tournament');
    }
  }

  async function handleDeleteTournament(tournamentId) {
    if (window.confirm('Are you sure you want to delete this tournament entry?')) {
      try {
        await deleteDoc(doc(db, 'tournaments', tournamentId));
        fetchAllTournaments();
        alert('Tournament deleted successfully');
      } catch (error) {
        console.error('Error deleting tournament:', error);
        alert('Failed to delete tournament');
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

  if (!isAdmin) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="card">
            <h2>Access Denied</h2>
            <p>You do not have admin privileges to access this page.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>🔧 Admin Panel</h1>

        {/* User Management */}
        <div className="card">
          <h2>User Management</h2>
          <div className="table-responsive">
            <table className="tournament-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Admin</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.displayName || 'N/A'}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.isAdmin ? (
                        <span className="badge admin-badge">Admin</span>
                      ) : (
                        <span className="badge user-badge">User</span>
                      )}
                    </td>
                    <td>
                      {user.id !== currentUser.uid && (
                        <button
                          onClick={() => toggleAdminStatus(user.id, user.isAdmin)}
                          className={`btn btn-sm ${user.isAdmin ? 'btn-danger' : 'btn-primary'}`}
                        >
                          {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Tournament for Any User */}
        <div className="card">
          <h2>Add Tournament Entry for Any Player</h2>
          <form onSubmit={handleAddTournament} className="tournament-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="selectedUser">Select Player</label>
                <select
                  id="selectedUser"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  required
                >
                  <option value="">Choose a player...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.displayName || user.email}
                    </option>
                  ))}
                </select>
              </div>

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
                <label htmlFor="placement">Placement</label>
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

            <button type="submit" className="btn btn-primary">Add Tournament Entry</button>
          </form>
        </div>

        {/* All Tournaments */}
        <div className="card">
          <h2>All Tournament Entries</h2>
          <div className="table-responsive">
            <table className="tournament-table">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Date</th>
                  <th>Players</th>
                  <th>Place</th>
                  <th>Points</th>
                  <th>Buy-in</th>
                  <th>Rebuys</th>
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
                      <td>{tournament.userName || tournament.userEmail}</td>
                      <td>{new Date(tournament.tournament_date).toLocaleDateString()}</td>
                      <td>{tournament.total_players || '-'}</td>
                      <td>{tournament.placement || '-'}</td>
                      <td className="points-cell">{tournament.points || 0}</td>
                      <td>£{tournament.buy_in.toFixed(2)}</td>
                      <td>£{tournament.rebuys.toFixed(2)}</td>
                      <td>£{tournament.winnings.toFixed(2)}</td>
                      <td className={profitLoss >= 0 ? 'profit' : 'loss'}>
                        £{profitLoss.toFixed(2)}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteTournament(tournament.id)}
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
        </div>
      </div>
    </>
  );
}
