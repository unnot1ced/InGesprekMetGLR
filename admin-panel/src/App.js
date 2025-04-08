import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

// Initialize socket connection
const socket = io('http://localhost:5000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Helper function to normalize image paths
const normalizeImagePath = (path) => {
  if (!path) return null;
  
  // If the path already starts with http:// or https://, leave it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove any leading slash to ensure proper concatenation
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Return the full URL with the base
  return `http://localhost:5000/${normalizedPath}`;
};

function App() {
  const [room, setRoom] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [teamPlayers, setTeamPlayers] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionImage, setQuestionImage] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [scores, setScores] = useState([]);
  const [showingResults, setShowingResults] = useState(false);
  const [winner, setWinner] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [playerAnswers, setPlayerAnswers] = useState([]);
  const [showRoundScreen, setShowRoundScreen] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(4);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [pointsAmount, setPointsAmount] = useState(1);
  const [isActivityRound, setIsActivityRound] = useState(false);
  const [activityDescription, setActivityDescription] = useState('');
  const [mediaError, setMediaError] = useState(null);
  const [currentActivityOption, setCurrentActivityOption] = useState(0);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [activityToForce, setActivityToForce] = useState(0);

  const handleRoomJoin = (e) => {
    e.preventDefault();
    if (room && adminCode === 'IGM2024') {
      setAuthenticated(true);
      socket.emit('joinAdminPanel', room);
      setConnected(true);
    } else {
      alert('Invalid admin code');
    }
  };

  const startGame = () => {
    if (connected && room) {
      socket.emit('startGame', room);
      setGameStarted(true);
    }
  };

  const nextQuestion = () => {
    if (connected && room) {
      socket.emit('adminNextQuestion', room);
    }
  };
  
  const startRound = () => {
    if (connected && room) {
      socket.emit('adminStartRound', room);
      setShowRoundScreen(false);
    }
  };

  const resetGame = () => {
    if (connected && room) {
      socket.emit('resetGame', room);
      setGameStarted(false);
      setWinner(null);
      setShowingResults(false);
      setIsActivityRound(false);
    }
  };
  
  // New functions for activity rounds
  const startActivityRound = () => {
    if (connected && room) {
      socket.emit('startActivityRound', room, activityToForce);
      setIsActivityRound(true);
    }
  };
  
  const endActivityRound = () => {
    if (connected && room) {
      socket.emit('endActivityRound', room);
      setIsActivityRound(false);
    }
  };

  // Add a function to end the quiz
  const endQuiz = () => {
    if (connected && room) {
      if (confirm("Are you sure you want to end the quiz? This will show the final results.")) {
        socket.emit('adminEndQuiz', room);
      }
    }
  };

  useEffect(() => {
    socket.on('connect', () => {
      setConnectionError(false);
    });

    socket.on('connect_error', () => {
      setConnectionError(true);
    });

    socket.on('teamPlayersUpdate', (teams) => {
      setTeamPlayers(teams);
    });

    socket.on('gameStarted', () => {
      setGameStarted(true);
      setShowingResults(false);
      setWinner(null);
    });

    socket.on('newQuestion', (data) => {
      setCurrentQuestion(data.question);
      setQuestionImage(data.image || null);
      setShowingResults(false);
      setShowRoundScreen(false);
      setCorrectAnswer(null);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setCurrentRound(data.currentRound);
      setTotalRounds(data.totalRounds);
      setPlayerAnswers([]);
      setIsActivityRound(false);
      setQuestionsAsked(questionsAsked + 1);
    });
    
    socket.on('roundScreen', (data) => {
      setShowRoundScreen(true);
      setShowingResults(false);
      setCurrentRound(data.roundNumber);
      setTotalRounds(data.totalRounds);
      setIsActivityRound(false);
    });
    
    // Add handlers for activity rounds
    socket.on('activityRoundStarting', (data) => {
      setIsActivityRound(true);
      setShowRoundScreen(false);
      setShowingResults(false);
      setCurrentRound(data.roundNumber);
      setTotalRounds(data.totalRounds);
      setActivityDescription(data.description);
    });
    
    socket.on('activityRoundInProgress', (data) => {
      setIsActivityRound(true);
      setActivityDescription(data.description);
    });

    socket.on('playerAnswered', (data) => {
      setPlayerAnswers(prev => [...prev, data]);
    });

    socket.on('showResults', (data) => {
      setShowingResults(true);
      setScores(data.scores);
    });

    socket.on('roundResults', (data) => {
      setScores(data.scores);
      setCorrectAnswer(data.answers.correct);
      setQuestionsAsked(data.questionsAsked);
    });
    
    socket.on('roundComplete', (data) => {
      setShowRoundScreen(true);
      setCurrentRound(data.nextRound);
      setScores(data.scores);
      setIsActivityRound(false);
    });

    socket.on('gameOver', (data) => {
      setWinner(data.winner);
      setIsActivityRound(false);
    });

    // Add listener for score updates (including points added/removed by admin)
    socket.on('scoresUpdate', (data) => {
      console.log('Scores update received:', data);
      setScores(data.scores);
    });

    socket.on('activityTypeChanged', (data) => {
      setCurrentActivityOption(data.activityIndex);
      setActivityDescription(data.description);
    });

    socket.on('activityRoundEnded', (data) => {
      setIsActivityRound(false);
      setQuestionsAsked(data.questionsAsked);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('teamPlayersUpdate');
      socket.off('gameStarted');
      socket.off('newQuestion');
      socket.off('playerAnswered');
      socket.off('showResults');
      socket.off('roundResults');
      socket.off('roundComplete');
      socket.off('roundScreen');
      socket.off('gameOver');
      socket.off('scoresUpdate');
      socket.off('activityRoundStarting');
      socket.off('activityRoundInProgress');
      socket.off('activityTypeChanged');
      socket.off('activityRoundEnded');
    };
  }, [questionsAsked]);

  useEffect(() => {
    if (questionImage) {
      setMediaError(null);
    }
  }, [questionImage]);

  if (!authenticated) {
    return (
      <div className="admin-login">
        <h1>In Gesprek Met - Admin Panel</h1>
        {connectionError ? (
          <div className="error-message">
            <p>Cannot connect to server! Please make sure the server is running.</p>
            <button onClick={() => socket.connect()}>Retry Connection</button>
          </div>
        ) : (
          <form onSubmit={handleRoomJoin}>
            <input 
              type="text" 
              placeholder="Enter Room Code" 
              value={room} 
              onChange={(e) => setRoom(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Enter Admin Code" 
              value={adminCode} 
              onChange={(e) => setAdminCode(e.target.value)}
              required
            />
            <button type="submit">Connect as Admin</button>
          </form>
        )}
      </div>
    );
  }

  const togglePowerups = (enabled) => {
    if (connected && room) {
      socket.emit('adminTogglePowerups', room, enabled);
    }
  };

  // Points management functions

  const addPoints = () => {
    if (connected && room && selectedTeam && pointsAmount > 0) {
      socket.emit('adminAddPoints', room, selectedTeam, pointsAmount);
    }
  };

  const removePoints = () => {
    if (connected && room && selectedTeam && pointsAmount > 0) {
      socket.emit('adminRemovePoints', room, selectedTeam, pointsAmount);
    }
  };
  
  const handlePointsChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setPointsAmount(value);
  };

  const handleEndActivity = () => {
    if (connected && room) {
      socket.emit('endActivityRound', room);
      setIsActivityRound(false);
    }
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>In Gesprek Met - Admin Panel</h1>
        <div className="room-info">
          <span>Room: {room}</span>
          <span>Status: {gameStarted ? 'Game in Progress' : 'Waiting to Start'}</span>
          {gameStarted && !isActivityRound && <span>Question: {questionNumber}/{totalQuestions}</span>}
          {isActivityRound && <span className="activity-badge">Activity Round</span>}
        </div>
        <div className="admin-controls">
          {!gameStarted && (
            <button 
              className="start-game-btn" 
              onClick={startGame}
              disabled={Object.values(teamPlayers).every(team => team.players.length === 0)}
            >
              Start Game
            </button>
          )}
          {gameStarted && showRoundScreen && (currentRound === 1 || currentRound === 4) && (
            <>
              <button className="start-round-btn" onClick={startRound}>
                Start Normal Round {currentRound}
              </button>
              <button className="activity-round-btn" onClick={startActivityRound}>
                Start Activity Round {currentRound}
              </button>
            </>
          )}
          {gameStarted && showRoundScreen && currentRound !== 1 && currentRound !== 4 && (
            <button className="start-round-btn" onClick={startRound}>
              Start Round {currentRound}
            </button>
          )}
          {gameStarted && !winner && !showRoundScreen && !isActivityRound && (
            <div className="admin-controls-row">
              <button className="next-question-btn" onClick={nextQuestion}>
                Next Question
              </button>
              <div className="force-activity-container">
                <select 
                  value={activityToForce} 
                  onChange={(e) => setActivityToForce(parseInt(e.target.value))}
                  className="activity-select"
                >
                  <option value={0}>Ballen gooien</option>
                  <option value={1}>Toekomsteten</option>
                </select>
                <button className="activity-round-btn" onClick={startActivityRound}>
                  Force Activity Round
                </button>
              </div>
            </div>
          )}
          {gameStarted && isActivityRound && (
            <button className="end-activity-btn" onClick={endActivityRound}>
              End Activity Round
            </button>
          )}
          {(gameStarted || winner) && (
            <button className="reset-game-btn" onClick={resetGame}>
              Reset Game
            </button>
          )}
          {gameStarted && !winner && (
            <div className="admin-controls">
              <h3>Admin Controls</h3>
              {!isActivityRound ? (
                <>
                  {!showRoundScreen && (
                    <div className="admin-controls-row">
                      <button className="next-question-btn" onClick={nextQuestion}>
                        Next Question
                      </button>
                      <button className="activity-round-btn" onClick={startActivityRound}>
                        Force Activity Round
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button className="end-activity-btn" onClick={endActivityRound}>
                  End Activity Round
                </button>
              )}
              
              <button className="end-quiz-btn" onClick={endQuiz}>
                End Quiz
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="admin-content">
        {showRoundScreen ? (
          <div className="round-screen-panel">
            <h2>Round {currentRound} of {totalRounds}</h2>
            {currentRound === 1 || currentRound === 4 ? (
              <>
                <p>
                  This is an activity round. Choose how to proceed:
                </p>
                <div className="round-options">
                  <button className="start-round-btn" onClick={startRound}>Start as Normal Round</button>
                  <button className="activity-round-btn" onClick={startActivityRound}>Start as Activity Round</button>
                </div>
                {currentRound === 1 && (
                  <div className="activity-description">
                    <h3>Activity Round 1:</h3>
                    <p>Ballen gooien – punten worden handmatig ingevoerd.</p>
                  </div>
                )}
                {currentRound === 4 && (
                  <div className="activity-description">
                    <h3>Activity Round 2:</h3>
                    <p>Wie eet als eerst het bord toekomsteten leeg. Handmatig punten invoeren voor de eerste drie lege borden: 3 voor eerste team, 2 voor tweede team, 1 voor derde team.</p>
                  </div>
                )}
              </>
            ) : (
              <p>Click "Start Round {currentRound}" to begin the round</p>
            )}
            
            <div className="current-standings">
              <h3>Current Standings</h3>
              <div className="scores-list">
                {scores.map((team, index) => (
                  <div 
                    key={index} 
                    className={`team-score ${team.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <span className="team-name">{team.name}</span>
                    <span className="team-score-value">{team.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !gameStarted ? (
          <div className="waiting-room-panel">
            <h2>Teams Ready</h2>
            <div className="teams-grid">
              {Object.entries(teamPlayers).map(([teamName, teamData]) => (
                <div 
                  key={teamName} 
                  className={`team-card ${teamName.toLowerCase().replace(' ', '-')}`}
                >
                  <h3>{teamName}</h3>
                  <div className="player-count">{teamData.players ? teamData.players.length : 0} Players</div>
                  <div className="player-list">
                    {teamData.players && teamData.players.map((player, index) => (
                      <div key={index} className="player-name">{player.name}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : winner ? (
          <div className="game-over-panel">
            <h2>Game Over</h2>
            <div className="winner-announcement">
              <h3>The Winner is:</h3>
              <div className="winner-team">{winner}</div>
            </div>
            <div className="final-scores">
              <h3>Final Scores</h3>
              <div className="scores-list">
                {scores.map((team, index) => (
                  <div 
                    key={index} 
                    className={`team-score ${team.name.toLowerCase().replace(' ', '-')} ${team.name === winner ? 'winner' : ''}`}
                  >
                    <span className="team-name">{team.name}</span>
                    <span className="team-score-value">{team.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : isActivityRound ? (
          <div className="activity-round-panel">
            <h2>Activity Round {currentRound}</h2>
            <div className="activity-controls">
              <h3>Activity Options</h3>
              <div className="activity-options">
                <button 
                  className={`activity-option-btn ${currentActivityOption === 0 ? 'active' : ''}`}
                  onClick={() => socket.emit("switchActivityType", room, 0)}
                >
                  Ballen gooien
                </button>
                <button 
                  className={`activity-option-btn ${currentActivityOption === 1 ? 'active' : ''}`}
                  onClick={() => socket.emit("switchActivityType", room, 1)}
                >
                  Toekomsteten
                </button>
              </div>
              <div className="activity-description">
                {currentActivityOption === 0 ? (
                  <p>Ballen gooien – punten worden handmatig ingevoerd.</p>
                ) : (
                  <p>Wie eet als eerst het bord toekomsteten leeg. HANDMATIG PUNTEN INVOEREN VOOR DE EERSTE DRIE LEGE BORDEN. 3 voor eerste team, 2 voor tweede team, 1 voor derde team.</p>
                )}
              </div>
              <button className="end-activity-btn" onClick={handleEndActivity}>
                End Activity Round
              </button>
            </div>
            
            <div className="points-manager">
              <h3>Award Points to Teams</h3>
              <div className="points-controls">
                <select 
                  value={selectedTeam} 
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  required
                >
                  <option value="">Select Team</option>
                  {Object.keys(teamPlayers).map((teamName) => (
                    <option key={teamName} value={teamName}>{teamName}</option>
                  ))}
                </select>
                
                <div className="points-amount">
                  <label>Points:</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={pointsAmount} 
                    onChange={handlePointsChange}
                  />
                </div>
                
                <div className="points-buttons">
                  <button 
                    className="add-points-btn" 
                    onClick={addPoints}
                    disabled={!selectedTeam}
                  >
                    Award Points
                  </button>
                  <button 
                    className="remove-points-btn" 
                    onClick={removePoints}
                    disabled={!selectedTeam}
                  >
                    Remove Points
                  </button>
                </div>
              </div>
            </div>
            
            <div className="current-standings">
              <h3>Current Standings</h3>
              <div className="scores-list">
                {scores.length > 0 ? scores.map((team, index) => (
                  <div 
                    key={index} 
                    className={`team-score ${team.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <span className="team-name">{team.name}</span>
                    <span className="team-score-value">{team.score}</span>
                  </div>
                )) : Object.entries(teamPlayers).map(([teamName, teamData]) => (
                  <div 
                    key={teamName} 
                    className={`team-score ${teamName.toLowerCase().replace(' ', '-')}`}
                  >
                    <span className="team-name">{teamName}</span>
                    <span className="team-score-value">{teamData.score || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="game-panel">
            <div className="question-panel">
              <h2>Current Question</h2>
              <div className="question-display">
                <p className="question-text">{currentQuestion}</p>
                {questionImage && (
                  <div className="question-image-container">
                    {mediaError ? (
                      <div className="media-error">{mediaError}</div>
                    ) : (
                      <img 
                        src={normalizeImagePath(questionImage)} 
                        alt="Question"
                        className="question-image"
                        onError={() => {
                          console.error("Image failed to load:", questionImage);
                          setMediaError(`Image failed to load. Please check the path: ${questionImage}`);
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
              {correctAnswer && (
                <div className="correct-answer">
                  <h3>Correct Answer:</h3>
                  <p>{correctAnswer}</p>
                </div>
              )}
            </div>

            <div className="answers-panel">
              <h2>Player Answers</h2>
              <div className="answers-list">
                {playerAnswers.length > 0 ? (
                  playerAnswers.map((answer, index) => (
                    <div 
                      key={index} 
                      className={`player-answer ${answer.team.toLowerCase().replace(' ', '-')}`}
                    >
                      <span className="player-name">{answer.playerName}</span>
                      <span className="player-team">{answer.team}</span>
                      <span className={`answer-status ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                        {answer.isCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="no-answers">No answers submitted yet</p>
                )}
              </div>
            </div>

            <div className="scores-panel">
              <h2>Current Scores</h2>
              <div className="scores-list">
                {scores.map((team, index) => (
                  <div 
                    key={index} 
                    className={`team-score ${team.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <span className="team-name">{team.name}</span>
                    <span className="team-score-value">{team.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Points Management Section - Always visible */}
        <div className="points-management">
          <h3>Points Management</h3>
          <div className="points-controls">
            <select 
              value={selectedTeam} 
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="">Select Team</option>
              {gameStarted && scores.length > 0 ? 
                scores.map((team) => (
                  <option key={team.name} value={team.name}>{team.name}</option>
                )) : 
                Object.keys(teamPlayers).map((teamName) => (
                  <option key={teamName} value={teamName}>{teamName}</option>
                ))
              }
            </select>
            <input 
              type="number" 
              min="1" 
              value={pointsAmount} 
              onChange={handlePointsChange}
            />
            <button onClick={addPoints}>Add Points</button>
            <button onClick={removePoints}>Remove Points</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;