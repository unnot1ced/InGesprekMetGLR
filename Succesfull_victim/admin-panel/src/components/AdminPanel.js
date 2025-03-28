import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const AdminPanel = () => {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [connected, setConnected] = useState(false);
  const [teams, setTeams] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('teamPlayersUpdate', (teamsData) => {
      console.log('Received team update:', teamsData);
      setTeams(teamsData);
    });

    newSocket.on('gameStarted', () => {
      console.log('Game started event received');
      setGameStarted(true);
    });

    newSocket.on('newQuestion', (questionData) => {
      console.log('New question received:', questionData);
      setCurrentQuestion(questionData);
    });

    newSocket.on('gameReset', () => {
      console.log('Game reset event received');
      setGameStarted(false);
      setCurrentQuestion(null);
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
              <button 
                className="start-game-btn" 
                onClick={handleStartGame}
                disabled={gameStarted}
              >
                {gameStarted ? 'Game Started' : 'Start Game'}
              </button>
              {gameStarted && (
                <>
                  <button 
                    className="next-question-btn" 
                    onClick={handleNextQuestion}
                  >
                    Next Question
                  </button>
                  <button 
                    className="reset-game-btn" 
                    onClick={handleResetGame}
                  >
                    Reset Game
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {connected && (
        <div className="admin-content">
          <div className="teams-grid">
            {Object.entries(teams).map(([teamName, teamData]) => (
              <div key={teamName} className={`team-card ${teamName.toLowerCase().replace(' ', '-')}`}>
                <h3>{teamName}</h3>
                <div className="player-count">
                  {teamData.players.length} player(s)
                </div>
                <div className="player-list">
                  {teamData.players.map(player => (
                    <div key={player.id} className="player-name">
                      {player.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;