import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const AdminPanel = () => {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [connected, setConnected] = useState(false);
  const [teams, setTeams] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [pointsToAdd, setPointsToAdd] = useState(1);
  const [allPlayersAnswered, setAllPlayersAnswered] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('teamPlayersUpdate', (teamsData) => {
      console.log('Received team update:', teamsData);
      // Ensure all teams have a players array
      const updatedTeams = {};
      Object.entries(teamsData).forEach(([teamName, teamData]) => {
        updatedTeams[teamName] = {
          ...teamData,
          players: teamData.players || [],
          score: teamData.score || 0
        };
      });
      setTeams(updatedTeams);
    });

    newSocket.on('gameStarted', () => {
      console.log('Game started event received');
      setGameStarted(true);
      setIsRoundComplete(false);
    });

    newSocket.on('newQuestion', (questionData) => {
      console.log('New question received:', questionData);
      setCurrentQuestion(questionData);
      setCurrentRound(questionData.currentRound || 1);
      setAllPlayersAnswered(false);
    });

    newSocket.on('gameReset', () => {
      console.log('Game reset event received');
      setGameStarted(false);
      setCurrentQuestion(null);
      setCurrentRound(1);
      setIsRoundComplete(false);
    });
    
    newSocket.on('roundResults', (results) => {
      console.log('Round results received:', results);
      setIsRoundComplete(results.isRoundComplete || false);
    });
    
    newSocket.on('roundComplete', (data) => {
      console.log('Round complete received:', data);
      setIsRoundComplete(true);
      setCurrentRound(data.nextRound);
    });
    
    newSocket.on('scoresUpdate', (data) => {
      console.log('Scores update received:', data);
      // Update teams with new scores
      setTeams(prevTeams => {
        const updatedTeams = {...prevTeams};
        data.scores.forEach(team => {
          if (updatedTeams[team.name]) {
            updatedTeams[team.name].score = team.score;
          }
        });
        return updatedTeams;
      });
    });
    
    newSocket.on('playerAnswered', (data) => {
      console.log(`Player ${data.playerName} from ${data.team} answered`);
    });
    
    newSocket.on('allPlayersAnswered', () => {
      console.log('All players have answered');
      setAllPlayersAnswered(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleJoinRoom = () => {
    if (roomId && socket) {
      console.log('Admin joining room:', roomId);
      socket.emit('joinAdminPanel', roomId);
      setConnected(true);
    }
  };

  const handleStartGame = () => {
    if (connected && socket) {
      console.log('Admin starting game in room:', roomId);
      socket.emit('startGame', roomId);
    }
  };

  const handleNextQuestion = () => {
    if (connected && socket) {
      console.log('Admin requesting next question in room:', roomId);
      socket.emit('adminNextQuestion', roomId);
    }
  };

  const handleResetGame = () => {
    if (connected && socket) {
      console.log('Admin resetting game in room:', roomId);
      socket.emit('resetGame', roomId);
    }
  };
  
  const handleStartRound = () => {
    if (connected && socket) {
      console.log('Admin starting round in room:', roomId);
      socket.emit('adminStartRound', roomId);
      setIsRoundComplete(false);
    }
  };
  
  const handleAddPoints = () => {
    if (connected && socket && selectedTeam) {
      console.log(`Admin adding ${pointsToAdd} points to ${selectedTeam} in room:`, roomId);
      socket.emit('adminAddPoints', roomId, selectedTeam, parseInt(pointsToAdd));
    }
  };
  
  const handleRemovePoints = () => {
    if (connected && socket && selectedTeam) {
      console.log(`Admin removing ${pointsToAdd} points from ${selectedTeam} in room:`, roomId);
      socket.emit('adminRemovePoints', roomId, selectedTeam, parseInt(pointsToAdd));
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Quiz Admin Panel</h1>
        {!connected ? (
          <div className="room-join">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
            />
            <button onClick={handleJoinRoom}>Join Room</button>
          </div>
        ) : (
          <div className="room-info">
            <span>Room: {roomId}</span>
            <div className="admin-controls">
              {!gameStarted ? (
                <button 
                  className="start-game-btn" 
                  onClick={handleStartGame}
                >
                  Start Game
                </button>
              ) : isRoundComplete ? (
                <button 
                  className="start-round-btn" 
                  onClick={handleStartRound}
                >
                  Start Round {currentRound}
                </button>
              ) : (
                <button 
                  className="next-question-btn" 
                  onClick={handleNextQuestion}
                  disabled={!allPlayersAnswered}
                >
                  {allPlayersAnswered ? 'Next Question' : 'Waiting for all answers...'}
                </button>
              )}
              <button 
                className="reset-game-btn" 
                onClick={handleResetGame}
              >
                Reset Game
              </button>
            </div>
          </div>
        )}
      </div>

      {connected && (
        <div className="admin-content">
          {/* Points Management Section */}
          <div className="points-management">
            <h3>Manage Team Points</h3>
            <div className="points-controls">
              <select 
                value={selectedTeam} 
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">Select Team</option>
                {Object.keys(teams).map(teamName => (
                  <option key={teamName} value={teamName}>{teamName}</option>
                ))}
              </select>
              <input 
                type="number" 
                min="1" 
                value={pointsToAdd} 
                onChange={(e) => setPointsToAdd(e.target.value)}
              />
              <button onClick={handleAddPoints}>Add Points</button>
              <button onClick={handleRemovePoints}>Remove Points</button>
            </div>
          </div>
          
          {/* Round Information */}
          <div className="round-info">
            <h3>Current Round: {currentRound}</h3>
            {isRoundComplete && <p className="round-complete">Round Complete!</p>}
          </div>
          
          {/* Teams Grid */}
          <div className="teams-grid">
            {Object.entries(teams).map(([teamName, teamData]) => {
              // Initialize empty arrays if players is undefined
              const players = teamData.players || [];
              return (
                <div key={teamName} className={`team-card ${teamName.toLowerCase().replace(' ', '-')}`}>
                  <h3>{teamName}</h3>
                  <div className="team-score">
                    Score: {teamData.score || 0}
                  </div>
                  <div className="player-count">
                    {players.length} player(s)
                  </div>
                  <div className="player-list">
                    {players.map(player => (
                      <div key={player.id} className="player-name">
                        {player.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Current Question Panel */}
          {currentQuestion && (
            <div className="question-panel">
              <h3>Current Question</h3>
              <p className="question-text">{currentQuestion.question}</p>
              <div className="answers-list">
                {currentQuestion.answers.map((answer, index) => (
                  <div key={index} className="answer-option">
                    {answer}
                  </div>
                ))}
              </div>
              {allPlayersAnswered && (
                <div className="all-answered-notification">
                  All players have answered! You can proceed to the next question.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;