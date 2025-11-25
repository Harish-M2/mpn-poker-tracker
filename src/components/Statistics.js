import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/Statistics.css';

export default function Statistics() {
  const { currentUser } = useAuth();
  const [monthlyData, setMonthlyData] = useState([]);
  const [userComparison, setUserComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [headToHeadData, setHeadToHeadData] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, [currentUser]);

  async function fetchStatistics() {
    try {
      // Fetch all users' display names
      const { getDocs: getDocsImport } = await import('firebase/firestore');
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocsImport(usersQuery);
      const usersData = {};
      usersSnapshot.docs.forEach(doc => {
        usersData[doc.id] = doc.data().displayName || doc.data().email;
      });
      
      // Fetch all tournaments
      let allTournaments = [];
      try {
        const q = query(collection(db, 'tournaments'), orderBy('tournament_date', 'asc'));
        const querySnapshot = await getDocs(q);
        allTournaments = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        // If index error, fetch without orderBy and sort manually
        console.log('Fetching without index...');
        const simpleQuery = query(collection(db, 'tournaments'));
        const querySnapshot = await getDocs(simpleQuery);
        allTournaments = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => new Date(a.tournament_date) - new Date(b.tournament_date));
      }

      // Calculate monthly data for current user
      const userTournaments = allTournaments.filter(t => t.userId === currentUser.uid);
      const monthlyStats = {};
      
      userTournaments.forEach(t => {
        const month = t.tournament_date.substring(0, 7); // YYYY-MM
        if (!monthlyStats[month]) {
          monthlyStats[month] = { month, tournaments: 0, spent: 0, won: 0, profit: 0, points: 0 };
        }
        const spent = t.buy_in + t.rebuys;
        monthlyStats[month].tournaments += 1;
        monthlyStats[month].spent += spent;
        monthlyStats[month].won += t.winnings;
        monthlyStats[month].profit += (t.winnings - spent);
        monthlyStats[month].points += (t.points || 0);
      });

      setMonthlyData(Object.values(monthlyStats));

      // Calculate user comparison
      const userStats = {};
      
      allTournaments.forEach(t => {
        const userId = t.userId;
        const userName = t.userName || usersData[userId] || t.userEmail || 'Unknown';
        
        if (!userStats[userId]) {
          userStats[userId] = {
            userId,
            username: userName,
            total_tournaments: 0,
            total_spent: 0,
            total_winnings: 0,
            net_profit: 0,
            total_points: 0
          };
        }
        
        const spent = t.buy_in + t.rebuys;
        userStats[userId].total_tournaments += 1;
        userStats[userId].total_spent += spent;
        userStats[userId].total_winnings += t.winnings;
        userStats[userId].net_profit += (t.winnings - spent);
        userStats[userId].total_points += (t.points || 0);
      });

      const usersArray = Object.values(userStats)
        .map(user => ({
          ...user,
          roi_percentage: user.total_spent > 0 
            ? ((user.total_winnings / user.total_spent * 100) - 100).toFixed(2)
            : 0
        }))
        .sort((a, b) => b.total_points - a.total_points);

      setUserComparison(usersArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setLoading(false);
    }
  }

  function calculateHeadToHead(opponentId, allTournaments) {
    // Find tournaments where both players participated
    const tournamentDates = {};
    
    allTournaments.forEach(t => {
      const date = t.tournament_date;
      if (!tournamentDates[date]) {
        tournamentDates[date] = [];
      }
      tournamentDates[date].push(t);
    });

    let yourWins = 0;
    let opponentWins = 0;
    let ties = 0;
    let tournamentsPlayedTogether = 0;
    let yourTotalPlacement = 0;
    let opponentTotalPlacement = 0;
    let yourTotalPoints = 0;
    let opponentTotalPoints = 0;

    Object.values(tournamentDates).forEach(dayTournaments => {
      const yourEntry = dayTournaments.find(t => t.userId === currentUser.uid);
      const opponentEntry = dayTournaments.find(t => t.userId === opponentId);

      if (yourEntry && opponentEntry) {
        tournamentsPlayedTogether++;
        yourTotalPlacement += yourEntry.placement;
        opponentTotalPlacement += opponentEntry.placement;
        yourTotalPoints += yourEntry.points || 0;
        opponentTotalPoints += opponentEntry.points || 0;

        if (yourEntry.placement < opponentEntry.placement) {
          yourWins++;
        } else if (yourEntry.placement > opponentEntry.placement) {
          opponentWins++;
        } else {
          ties++;
        }
      }
    });

    if (tournamentsPlayedTogether === 0) {
      return null;
    }

    return {
      tournamentsPlayedTogether,
      yourWins,
      opponentWins,
      ties,
      yourAvgPlacement: (yourTotalPlacement / tournamentsPlayedTogether).toFixed(1),
      opponentAvgPlacement: (opponentTotalPlacement / tournamentsPlayedTogether).toFixed(1),
      yourTotalPoints,
      opponentTotalPoints
    };
  }

  async function handleOpponentSelect(e) {
    const opponentId = e.target.value;
    setSelectedOpponent(opponentId);

    if (!opponentId) {
      setHeadToHeadData(null);
      return;
    }

    try {
      const q = query(collection(db, 'tournaments'));
      const querySnapshot = await getDocs(q);
      const allTournaments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const h2hData = calculateHeadToHead(opponentId, allTournaments);
      setHeadToHeadData(h2hData);
    } catch (error) {
      console.error('Error calculating head-to-head:', error);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <p className="loading">Loading statistics...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Statistics & Analysis</h1>
        
        {/* Monthly Performance Chart */}
        <div className="card">
          <h2>Your Monthly Performance</h2>
          {monthlyData.length === 0 ? (
            <p className="no-data">No data available yet. Add some tournament entries to see your performance!</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d6a3d" />
                <XAxis dataKey="month" stroke="#b8b8b8" />
                <YAxis yAxisId="left" stroke="#b8b8b8" />
                <YAxis yAxisId="right" orientation="right" stroke="#b8b8b8" />
                <Tooltip formatter={(value, name) => {
                  if (name === 'Points') return value;
                  return `£${value.toFixed(2)}`;
                }} />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#4caf50" 
                  strokeWidth={3}
                  name="Profit/Loss"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="points" 
                  stroke="#d4af37" 
                  strokeWidth={3}
                  name="Points"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Player Comparison */}
        <div className="card">
          <h2>Player Comparison</h2>
          {userComparison.length === 0 ? (
            <p className="no-data">No player data available yet.</p>
          ) : (
            <>
              <div className="table-responsive">
                <table className="tournament-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player</th>
                      <th>Points</th>
                      <th>Tournaments</th>
                      <th>Total Spent</th>
                      <th>Total Won</th>
                      <th>Net Profit/Loss</th>
                      <th>ROI %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userComparison.map((user, index) => (
                      <tr 
                        key={user.userId} 
                        className={user.userId === currentUser.uid ? 'highlight-row' : ''}
                      >
                        <td>{index + 1}</td>
                        <td>
                          {user.username}
                          {user.userId === currentUser.uid && (
                            <span className="badge">You</span>
                          )}
                        </td>
                        <td className="points-cell"><strong>{user.total_points}</strong></td>
                        <td>{user.total_tournaments}</td>
                        <td>£{user.total_spent.toFixed(2)}</td>
                        <td>£{user.total_winnings.toFixed(2)}</td>
                        <td className={user.net_profit >= 0 ? 'profit' : 'loss'}>
                          £{user.net_profit.toFixed(2)}
                        </td>
                        <td className={user.roi_percentage >= 0 ? 'profit' : 'loss'}>
                          {user.roi_percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Comparison Chart */}
              <div style={{ marginTop: '30px' }}>
                <h3>Points Leaderboard</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3d6a3d" />
                    <XAxis dataKey="username" stroke="#b8b8b8" />
                    <YAxis stroke="#b8b8b8" />
                    <Tooltip formatter={(value) => value} />
                    <Legend />
                    <Bar 
                      dataKey="total_points" 
                      fill="#d4af37"
                      name="Total Points"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Head-to-Head Comparison */}
        {userComparison.length > 1 && (
          <div className="card">
            <h2>🎯 Head-to-Head Comparison</h2>
            <div className="h2h-selector">
              <label htmlFor="opponent-select">Compare yourself against:</label>
              <select 
                id="opponent-select"
                value={selectedOpponent}
                onChange={handleOpponentSelect}
                className="h2h-dropdown"
              >
                <option value="">-- Select a player --</option>
                {userComparison
                  .filter(user => user.userId !== currentUser.uid)
                  .map(user => (
                    <option key={user.userId} value={user.userId}>
                      {user.username}
                    </option>
                  ))}
              </select>
            </div>

            {headToHeadData && (
              <div className="h2h-results">
                {headToHeadData.tournamentsPlayedTogether === 0 ? (
                  <p className="no-data">You haven't played in any tournaments together yet.</p>
                ) : (
                  <>
                    <div className="h2h-summary">
                      <div className="h2h-stat-card your-record">
                        <h4>Your Record</h4>
                        <div className="h2h-big-number">{headToHeadData.yourWins}</div>
                        <p>Wins</p>
                      </div>
                      <div className="h2h-stat-card ties-record">
                        <h4>Ties</h4>
                        <div className="h2h-big-number">{headToHeadData.ties}</div>
                        <p>Same placement</p>
                      </div>
                      <div className="h2h-stat-card opponent-record">
                        <h4>Their Record</h4>
                        <div className="h2h-big-number">{headToHeadData.opponentWins}</div>
                        <p>Wins</p>
                      </div>
                    </div>

                    <div className="h2h-details">
                      <h3>Detailed Stats</h3>
                      <table className="h2h-table">
                        <thead>
                          <tr>
                            <th></th>
                            <th>You</th>
                            <th>Opponent</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Tournaments Together</td>
                            <td colSpan="2" style={{textAlign: 'center', fontWeight: 'bold'}}>
                              {headToHeadData.tournamentsPlayedTogether}
                            </td>
                          </tr>
                          <tr>
                            <td>Average Placement</td>
                            <td className={parseFloat(headToHeadData.yourAvgPlacement) < parseFloat(headToHeadData.opponentAvgPlacement) ? 'highlight-winner' : ''}>
                              {headToHeadData.yourAvgPlacement}
                            </td>
                            <td className={parseFloat(headToHeadData.opponentAvgPlacement) < parseFloat(headToHeadData.yourAvgPlacement) ? 'highlight-winner' : ''}>
                              {headToHeadData.opponentAvgPlacement}
                            </td>
                          </tr>
                          <tr>
                            <td>Total Points</td>
                            <td className={headToHeadData.yourTotalPoints > headToHeadData.opponentTotalPoints ? 'highlight-winner' : ''}>
                              {headToHeadData.yourTotalPoints}
                            </td>
                            <td className={headToHeadData.opponentTotalPoints > headToHeadData.yourTotalPoints ? 'highlight-winner' : ''}>
                              {headToHeadData.opponentTotalPoints}
                            </td>
                          </tr>
                          <tr>
                            <td>Win Rate</td>
                            <td className={headToHeadData.yourWins > headToHeadData.opponentWins ? 'highlight-winner' : ''}>
                              {((headToHeadData.yourWins / headToHeadData.tournamentsPlayedTogether) * 100).toFixed(1)}%
                            </td>
                            <td className={headToHeadData.opponentWins > headToHeadData.yourWins ? 'highlight-winner' : ''}>
                              {((headToHeadData.opponentWins / headToHeadData.tournamentsPlayedTogether) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
