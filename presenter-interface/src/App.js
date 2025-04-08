import React, { useState, useEffect } from 'react';
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
  // State for room connection
  const [roomId, setRoomId] = useState('');
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showingResults, setShowingResults] = useState(false);
  const [answerStats, setAnswerStats] = useState({});
  const [teamScores, setTeamScores] = useState([]);
  const [timer, setTimer] = useState(0);
  const [maxTime, setMaxTime] = useState(15);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(4);
  const [roundComplete, setRoundComplete] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [winner, setWinner] = useState(null);
  const [mediaError, setMediaError] = useState(null);
  // Activity round states
  const [isActivityRound, setIsActivityRound] = useState(false);
  const [activityDescription, setActivityDescription] = useState('');
  // Multiple images
  const [questionImage1, setQuestionImage1] = useState(null);
  const [questionImage2, setQuestionImage2] = useState(null);
  
  // Reset media error when question changes
  useEffect(() => {
    if (currentQuestion && currentQuestion.image) {
      setMediaError(null);
    }
  }, [currentQuestion]);

  // Handle room connection
  const handleRoomJoin = (e) => {
    e.preventDefault();
    if (roomId) {
      socket.emit('joinPresenter', roomId);
      setConnected(true);
    }
  };

  // Socket event handlers
  useEffect(() => {
    socket.on('connect', () => {
      setConnectionError(false);
    });

    socket.on('connect_error', () => {
      setConnectionError(true);
    });

    socket.on('gameStarted', () => {
      setGameStarted(true);
      setShowingResults(false);
      setWinner(null);
    });

    socket.on('newQuestion', (data) => {
      setCurrentQuestion(data);
      setShowingResults(false);
      setRoundComplete(false);
      
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setCurrentRound(data.currentRound);
      setTotalRounds(data.totalRounds);
      
      // Set up timer
      setMaxTime(data.timerDuration || 15);
      setTimer(data.timerDuration || 15);
      
      // Reset stats
      setAnswerStats({});
      
      // Reset activity round state
      setIsActivityRound(false);
      
      // Handle multiple images
      setQuestionImage1(data.image1 || null);
      setQuestionImage2(data.image2 || null);
    });

    socket.on('activityRoundStarting', (data) => {
      setIsActivityRound(true);
      setShowingResults(false);
      setRoundComplete(false);
      setActivityDescription(data.description);
      setCurrentRound(data.roundNumber);
    });

    socket.on('activityRoundInProgress', (data) => {
      setIsActivityRound(true);
      setActivityDescription(data.description);
    });

    socket.on('activityRoundEnded', () => {
      setIsActivityRound(false);
      setRoundComplete(true);
    });

    socket.on('timerUpdate', (data) => {
      // Extract timeRemaining from the data object
      if (data && typeof data.timeRemaining === 'number') {
        setTimer(Math.ceil(data.timeRemaining / 1000)); // Convert from ms to seconds
      }
    });

    socket.on('questionEnded', (data) => {
      setShowingResults(true);
      if (data.stats) {
        setAnswerStats(data.stats);
      }
      if (data.teamScores) {
        setTeamScores(Object.entries(data.teamScores).map(([team, score]) => ({ team, score })));
      }
    });

    socket.on('roundResults', (data) => {
      setShowingResults(true);
      if (data.isRoundComplete) {
        setRoundComplete(true);
      }
      
      if (data.scores) {
        setTeamScores(data.scores);
      }
      
      setCurrentRound(data.currentRound);
    });

    socket.on('roundComplete', (data) => {
      setRoundComplete(true);
      setCurrentRound(data.nextRound);
      if (data.scores) {
        setTeamScores(data.scores);
      }
    });

    socket.on('gameOver', (data) => {
      setWinner(data.winner);
    });

    socket.on('viewerUpdate', (count) => {
      setViewerCount(count);
    });

    // Clean up on unmount
    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('gameStarted');
      socket.off('newQuestion');
      socket.off('timerUpdate');
      socket.off('questionEnded');
      socket.off('roundResults');
      socket.off('roundComplete');
      socket.off('gameOver');
      socket.off('viewerUpdate');
    };
  }, []);

  // Admin controls
  const startGame = () => {
    socket.emit('startGame', roomId);
  };

  const nextQuestion = () => {
    socket.emit('nextQuestion', roomId);
  };

  const startNextRound = () => {
    socket.emit('startRound', roomId);
  };

  const resetGame = () => {
    socket.emit('resetGame', roomId);
    setGameStarted(false);
    setCurrentQuestion(null);
    setShowingResults(false);
    setAnswerStats({});
    setTeamScores([]);
    setRoundComplete(false);
    setWinner(null);
  };

  // Login screen
  if (!connected) {
    return (
      <div className="app">
        <div className="login-container">
          <h2>Presenter Interface</h2>
          {connectionError ? (
            <div className="error-message">
              <p>Cannot connect to server! Please make sure the server is running.</p>
              <button className="submit-button" onClick={() => socket.connect()}>Retry Connection</button>
            </div>
          ) : (
            <form className="login-form" onSubmit={handleRoomJoin}>
              <div className="form-group">
                <label htmlFor="roomId">Room Code</label>
                <input
                  id="roomId"
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter room code"
                  required
                />
              </div>
              <button type="submit" className="submit-button">Connect</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Winner screen
  if (winner) {
    return (
      <div className="app">
        <div className="presenter-header">
          <h1>Presenter Dashboard</h1>
          <div className="room-code">Room: {roomId}</div>
          <div className="room-code">Viewers: {viewerCount}</div>
        </div>
        
        <div className="winner-screen">
          <h2>Game Over!</h2>
          <div className="winner-announcement">The Winner is: {winner}</div>
          
          <div className="team-standings">
            <h3>Final Standings</h3>
            <div className="team-list">
              {teamScores.sort((a, b) => b.score - a.score).map((team, index) => (
                <div key={index} className={`team-score ${index === 0 ? 'winner' : ''}`}>
                  {team.name}: {team.score} points
                </div>
              ))}
            </div>
          </div>
          
          <button className="game-control-button" onClick={resetGame}>Start New Game</button>
        </div>
      </div>
    );
  }

  // Waiting for game to start
  if (!gameStarted) {
    return (
      <div className="app">
        <div className="presenter-header">
          <h1>Presenter Dashboard</h1>
          <div className="room-code">Room: {roomId}</div>
          <div className="room-code">Viewers: {viewerCount}</div>
        </div>
        
        <div className="waiting-screen">
          <h2>Waiting for Players</h2>
          <p>Use the room code <strong>{roomId}</strong> to join the game.</p>
          <p>Current viewers: {viewerCount}</p>
          
          <button className="game-control-button" onClick={startGame}>Start Game</button>
        </div>
      </div>
    );
  }

  // Round complete screen
  if (roundComplete) {
    return (
      <div className="app">
        <div className="presenter-header">
          <h1>Presenter Dashboard</h1>
          <div className="room-code">Room: {roomId}</div>
          <div className="room-code">Viewers: {viewerCount}</div>
        </div>
        
        <div className="round-complete">
          <h2>Round {currentRound - 1} Complete!</h2>
          
          <div className="team-standings">
            <h3>Current Standings</h3>
            <div className="team-list">
              {teamScores.sort((a, b) => b.score - a.score).map((team, index) => (
                <div key={index} className={`team-score ${index === 0 ? 'leading' : ''}`}>
                  {team.name}: {team.score} points
                </div>
              ))}
            </div>
          </div>
          
          <div className="round-controls">
            <h3>Ready for Round {currentRound}</h3>
            <button className="game-control-button next-button" onClick={startNextRound}>
              Start Round {currentRound}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main game interface
  return (
    <div className="app">
      <div className="presenter-header">
        <h1>Presenter Dashboard</h1>
        <div className="room-code">Room: {roomId}</div>
        <div className="room-code">Round: {currentRound}/{totalRounds}</div>
        <div className="room-code">Viewers: {viewerCount}</div>
        {isActivityRound && <div className="activity-badge">Activity Round</div>}
      </div>
      
      <div className="game-controls">
        <button className="game-control-button" onClick={resetGame}>Reset Game</button>
        {showingResults && !isActivityRound && (
          <button className="game-control-button next-button" onClick={nextQuestion}>
            Next Question
          </button>
        )}
        {isActivityRound && (
          <button className="game-control-button end-activity-button" onClick={() => socket.emit('endActivityRound', roomId)}>
            End Activity Round
          </button>
        )}
      </div>
      
      {isActivityRound ? (
        <div className="activity-round-display">
          <h2>Activity Round {currentRound}</h2>
          <div className="activity-description">
            <p>{activityDescription}</p>
          </div>
          <div className="teams-status">
            <h3>Team Standings</h3>
            <div className="team-scores">
              {teamScores.sort((a, b) => b.score - a.score).map((team, index) => (
                <div key={index} className={`team-standing ${index === 0 ? 'leading' : ''}`}>
                  <span className="team-name">{team.name}</span>
                  <span className="team-score">{team.score} points</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : currentQuestion && (
        <div className="question-display">
          <div className="question-header">
            <div className="question-counter">Question {questionNumber}/{totalQuestions}</div>
            <div className="round-indicator">Round {currentRound}/{totalRounds}</div>
          </div>
          
          {!showingResults && (
            <div className="timer-container">
              <div className="timer-bar">
                <div 
                  className={`timer-progress ${timer < maxTime * 0.3 ? 'danger' : timer < maxTime * 0.6 ? 'warning' : ''}`} 
                  style={{ width: `${((timer || 0) / Math.max(maxTime, 1)) * 100}%` }}
                ></div>
              </div>
              <div className="timer-text">{timer || 0} seconds remaining</div>
            </div>
          )}
          
          <h2 className="question-text">{currentQuestion.question}</h2>
          
          {/* Presenter-only correct answer guide */}
          <div className="presenter-correct-answer">
            <div className="correct-answer-badge">CORRECT ANSWER</div>
            <div className="correct-answer-text">
              {Array.isArray(currentQuestion.answers) && currentQuestion.answers.map((answer, index) => {
                const isCorrect = typeof answer === 'object' ? answer.correct : (index === currentQuestion.correctAnswer);
                if (isCorrect) {
                  const answerText = typeof answer === 'object' ? answer.text : answer;
                  return (
                    <div key={index} className="correct-answer-display">
                      <span className="correct-letter">{String.fromCharCode(65 + index)}</span>
                      <span className="correct-content">{answerText}</span>
                    </div>
                  );
                }
                return null;
              }).filter(Boolean)[0] || <span className="no-answer">No correct answer specified</span>}
            </div>
          </div>
          
          {currentQuestion.image && (
            <div className="image-container">
              {mediaError ? (
                <div className="media-error">{mediaError}</div>
              ) : currentQuestion.image.match(/\.(mp4|webm|ogg)$/i) ? (
                <video 
                  src={normalizeImagePath(currentQuestion.image)} 
                  alt="Question Video" 
                  className="question-image"
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  onError={() => {
                    console.error("Video failed to load:", currentQuestion.image);
                    setMediaError(`Video failed to load. Please check the path: ${currentQuestion.image}`);
                  }}
                />
              ) : (
                <img 
                  src={normalizeImagePath(currentQuestion.image)} 
                  alt="Question" 
                  className="question-image"
                  onError={() => {
                    console.error("Image failed to load:", currentQuestion.image);
                    setMediaError(`Image failed to load. Please check the path: ${currentQuestion.image}`);
                  }}
                />
              )}
            </div>
          )}
          
          {/* Display multiple images when available */}
          {(questionImage1 || questionImage2) && (
            <div className="multiple-images-container">
              {questionImage1 && (
                <div className="comparison-image-container">
                  <div className="image-label">Foto 1</div>
                  <img 
                    src={normalizeImagePath(questionImage1)} 
                    alt="Image 1" 
                    className="comparison-image"
                    onError={() => {
                      console.error("Image 1 failed to load:", questionImage1);
                      setMediaError(`Image 1 failed to load. Please check the path: ${questionImage1}`);
                    }}
                  />
                </div>
              )}
              
              {questionImage2 && (
                <div className="comparison-image-container">
                  <div className="image-label">Foto 2</div>
                  <img 
                    src={normalizeImagePath(questionImage2)} 
                    alt="Image 2" 
                    className="comparison-image"
                    onError={() => {
                      console.error("Image 2 failed to load:", questionImage2);
                      setMediaError(`Image 2 failed to load. Please check the path: ${questionImage2}`);
                    }}
                  />
                </div>
              )}
            </div>
          )}
          
          <div className="answer-options">
            {currentQuestion.answers && Array.isArray(currentQuestion.answers) && currentQuestion.answers.map((answer, index) => {
              // Handle both object format ({ text, correct }) and string format
              const answerText = typeof answer === 'object' ? answer.text : answer;
              const isCorrect = typeof answer === 'object' ? answer.correct : (index === currentQuestion.correctAnswer);
              
              return (
                <div 
                  key={index} 
                  className={`answer-option ${isCorrect ? 'correct-answer-highlight' : ''}`}
                >
                  <div className={`option-marker ${isCorrect ? 'correct-marker' : ''}`}>{String.fromCharCode(65 + index)}</div>
                  <div className="option-text">{answerText}</div>
                  {isCorrect && <div className="correct-label">✓ CORRECT</div>}
                </div>
              );
            })}
          </div>
          
          {showingResults && currentQuestion.answers && (
            <div className="results-display">
              <h3>Answer Statistics</h3>
              
              <div className="answer-stats">
                {Array.isArray(currentQuestion.answers) && currentQuestion.answers.map((answer, index) => {
                  // Handle both object format and string format
                  const answerText = typeof answer === 'object' ? answer.text : answer;
                  const isCorrect = typeof answer === 'object' ? answer.correct : (index === currentQuestion.correctAnswer);
                  
                  return (
                    <div key={index} className={`answer-stat ${isCorrect ? 'correct-stat' : ''}`}>
                      <div className="answer-text">
                        {String.fromCharCode(65 + index)}: {answerText}
                        {isCorrect && <span className="correct-stat-label">✓ CORRECT</span>}
                      </div>
                      <div className="answer-percentage">
                        <div className="percentage-bar">
                          <div 
                            className="percentage-fill" 
                            style={{ width: `${answerStats[index] || 0}%` }}
                          ></div>
                        </div>
                        <div className="percentage-text">{answerStats[index] || 0}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App; 