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
  const [room, setRoom] = useState('');
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [teamScores, setTeamScores] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionImage, setQuestionImage] = useState(null);
  const [showingResults, setShowingResults] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [teamPlayers, setTeamPlayers] = useState({});
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [progress, setProgress] = useState(100);
  const [nextQuestionTimer, setNextQuestionTimer] = useState(0);
  const [showRoundScreen, setShowRoundScreen] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1);
  const [viewerStats, setViewerStats] = useState({});
  const [totalViewers, setTotalViewers] = useState(0);
  const [currentOptions, setCurrentOptions] = useState([]);
  const [isActivityRound, setIsActivityRound] = useState(false);
  const [activityDescription, setActivityDescription] = useState("");
  const [mediaError, setMediaError] = useState(null);
  // Add state for multiple images
  const [questionImage1, setQuestionImage1] = useState(null);
  const [questionImage2, setQuestionImage2] = useState(null);
  // Add state for video
  const [questionVideo, setQuestionVideo] = useState(null);
  // Add state for question count
  const [questionsAsked, setQuestionsAsked] = useState(0);

  const handleRoomJoin = (e) => {
    e.preventDefault();
    if (room) {
      socket.emit('joinScoreboard', room);
      setConnected(true);
    }
  };

  useEffect(() => {
    socket.on('connect', () => {
      setConnectionError(false);
      console.log('Connected to server');
    });

    socket.on('connect_error', () => {
      setConnectionError(true);
      console.error('Connection error');
    });

    socket.on('teamPlayersUpdate', (teams) => {
      console.log('Team players update received:', teams);
      setTeamPlayers(teams);
      
      // Update scores when team data changes
      setTeamScores(prevScores => {
        const updatedScores = {...prevScores};
        Object.entries(teams).forEach(([teamName, teamData]) => {
          if (teamData.score !== undefined) {
            // If team exists in scores, update it
            if (updatedScores[teamName]) {
              updatedScores[teamName].score = teamData.score;
            } else {
              // Otherwise create a new entry
              updatedScores[teamName] = {
                score: teamData.score,
                players: teamData.players || []
              };
            }
          }
        });
        return updatedScores;
      });
    });

    socket.on('gameStarted', () => {
      console.log('Game started event received');
      setGameStarted(true);
      setShowingResults(false);
      setWinner(null);
      setShowRoundScreen(false);
      
      // Initialize scores based on teamPlayers
      const initialScores = {};
      Object.entries(teamPlayers).forEach(([teamName, teamData]) => {
        initialScores[teamName] = {
          score: teamData.score || 0,
          players: teamData.players || []
        };
      });
      setTeamScores(initialScores);
    });

    socket.on('newQuestion', (data) => {
      console.log('New question received:', data);
      setCurrentQuestion(data.question);
      setQuestionImage(data.image || null);
      setQuestionImage1(data.image1 || null);
      setQuestionImage2(data.image2 || null);
      setQuestionVideo(data.video || null);
      setShowingResults(false);
      setShowRoundScreen(false);
      setCorrectAnswer(null);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setCurrentRound(data.currentRound || 1);
      setTotalRounds(data.totalRounds || 1);
      setCurrentOptions(data.answers);
    });

    socket.on('showResults', (data) => {
      console.log('Show results received:', data);
      setShowingResults(true);
      
      // Group scores by team
      const teams = {};
      if (data.scores) {
        data.scores.forEach(player => {
          if (!teams[player.team]) {
            teams[player.team] = {
              score: 0,
              players: []
            };
          }
          teams[player.team].players.push(player);
          teams[player.team].score += player.score;
        });
        
        setTeamScores(teams);
      }
      // Remove timer functionality
      setNextQuestionTimer(0);
      setProgress(100);
    });
    
    // Add handler for round screen
    socket.on('roundScreen', (data) => {
      console.log('Round screen received:', data);
      setShowRoundScreen(true);
      setShowingResults(false);
      setCurrentRound(data.roundNumber || 1);
      setTotalRounds(data.totalRounds || 1);
      
      // Update team scores
      if (data.scores) {
        const teams = {};
        data.scores.forEach(team => {
          teams[team.name] = {
            score: team.score,
            players: []
          };
        });
        
        setTeamScores(teams);
      }
    });
    
    socket.on('roundStarting', (data) => {
      console.log('Round starting received:', data);
      setShowRoundScreen(false);
      setShowingResults(false);
      setCurrentRound(data.roundNumber || 1);
      if (data.questionsAsked !== undefined) {
        setQuestionsAsked(data.questionsAsked);
      }
    });

    socket.on('roundResults', (data) => {
      console.log('Round results received:', data);
      if (data.answers && data.answers.correct) {
        setCorrectAnswer(data.answers.correct);
      }
      
      // Update scores if provided in the data
      if (data.scores) {
        const updatedTeamScores = {};
        data.scores.forEach(team => {
          updatedTeamScores[team.name] = {
            score: team.score,
            players: teamScores[team.name]?.players || []
          };
        });
        setTeamScores(prevScores => ({...prevScores, ...updatedTeamScores}));
      }

      // Update question count if provided
      if (data.questionsAsked !== undefined) {
        setQuestionsAsked(data.questionsAsked);
      }
      if (data.totalQuestions !== undefined) {
        setTotalQuestions(data.totalQuestions);
      }
    });

    // Add a handler specifically for score updates
    socket.on('scoresUpdate', (data) => {
      console.log('Scores update received:', data);
      if (data.scores) {
        const updatedTeamScores = {};
        data.scores.forEach(team => {
          updatedTeamScores[team.name] = {
            score: team.score,
            players: teamScores[team.name]?.players || []
          };
        });
        setTeamScores(prevScores => ({...prevScores, ...updatedTeamScores}));
      }
    });

    socket.on('gameOver', (data) => {
      console.log('Game over received:', data);
      setWinner(data.winner);
      // Store top three teams if provided
      if (data.topThree) {
        console.log('Top three teams received:', data.topThree);
        // Update team scores from the top three data
        const updatedTeamScores = {};
        data.topThree.forEach(team => {
          updatedTeamScores[team.name] = {
            score: team.score,
            players: teamScores[team.name]?.players || []
          };
        });
        setTeamScores(prevScores => ({...prevScores, ...updatedTeamScores}));
      }
    });

    socket.on('questionEnded', (data) => {
      console.log('Question ended received:', data);
      if (data.viewerStats) {
        setViewerStats(data.viewerStats);
      }
    });

    socket.on('viewerUpdate', (count) => {
      console.log('Viewer update received:', count);
      setTotalViewers(count);
    });

    socket.on('gameReset', () => {
      console.log('Game reset received');
      setTeamScores({});
      setCurrentQuestion('');
      setQuestionImage(null);
      setQuestionImage1(null);
      setQuestionImage2(null);
      setQuestionVideo(null);
      setShowingResults(false);
      setGameStarted(false);
      setWinner(null);
      setQuestionNumber(0);
      setTotalQuestions(0);
      setTeamPlayers({});
      setCorrectAnswer(null);
      setProgress(100);
      setNextQuestionTimer(0);
      setShowRoundScreen(false);
      setCurrentRound(1);
      setTotalRounds(1);
      setViewerStats({});
      setTotalViewers(0);
      setQuestionsAsked(0);
    });

    // Add listener for activity round events
    socket.on('activityRoundForScoreboard', (data) => {
      console.log('Activity round for scoreboard received:', data);
      setIsActivityRound(true);
      setShowingResults(false);
      setCurrentRound(data.roundNumber || 1);
      setActivityDescription(data.description || "");
    });
    
    // Listen for end of activity rounds
    socket.on('activityRoundEnded', () => {
      console.log('Activity round ended received');
      setIsActivityRound(false);
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('teamPlayersUpdate');
      socket.off('gameStarted');
      socket.off('newQuestion');
      socket.off('showResults');
      socket.off('roundScreen');
      socket.off('roundStarting');
      socket.off('roundResults');
      socket.off('scoresUpdate');
      socket.off('gameOver');
      socket.off('questionEnded');
      socket.off('viewerUpdate');
      socket.off('gameReset');
      socket.off('activityRoundForScoreboard');
      socket.off('activityRoundEnded');
    };
  }, [teamScores]);

  // Clear media error when question image changes
  useEffect(() => {
    if (questionImage) {
      setMediaError(null);
    }
  }, [questionImage]);

  if (!connected) {
    return (
      <div className="scoreboard-login">
        <h1>In Gesprek Met - Scoreboard</h1>
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
            <button type="submit">Connect to Room</button>
          </form>
        )}
      </div>
    );
  }

  if (winner) {
    return (
      <div className="winner-screen">
        <h1>Game Over!</h1>
        <div className="winner-announcement">
          <h2>The Winner is:</h2>
          <div className="winner-team">{winner}</div>
        </div>
        
        <div className="podium-container">
          <h2>Top Teams</h2>
          <div className="podium">
            {Object.entries(teamScores)
              .sort((a, b) => b[1].score - a[1].score)
              .slice(0, 3)
              .map(([teamName, data], index) => {
                // Determine position class based on index
                const positionClass = index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze';
                return (
                  <div key={teamName} className={`podium-position ${positionClass}`}>
                    <div className="position-number">{index + 1}</div>
                    <div className="team-name">{teamName}</div>
                    <div className="team-score">{data.score} points</div>
                  </div>
                );
              })}
          </div>
        </div>
        
        <div className="final-scores">
          {Object.entries(teamScores).sort((a, b) => b[1].score - a[1].score).map(([teamName, data], index) => (
            <div 
              key={teamName} 
              className={`team-score ${teamName.toLowerCase().replace(' ', '-')} ${index === 0 ? 'winner' : ''}`}
            >
              <h3>{teamName}</h3>
              <p className="team-total-score">{data.score}</p>
            </div>
          ))}
          
          {totalViewers > 0 && (
            <div className="viewer-participation">
              <h3>Audience Participation</h3>
              <p className="viewer-count-final">{totalViewers} Viewers</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="waiting-room">
        <h1>In Gesprek Met</h1>
        <p className="room-code">Room Code: {room}</p>
        
        <div className="waiting-room-layout">
          {/* Left side teams */}
          <div className="teams-side teams-left">
            {Object.entries(teamPlayers)
              .filter(([_, teamData]) => teamData.players && teamData.players.length > 0)
              .slice(0, Math.ceil(Object.entries(teamPlayers).filter(([_, teamData]) => teamData.players && teamData.players.length > 0).length / 2))
              .map(([teamName, teamData]) => (
                <div 
                  key={teamName} 
                  className={`team-card ${teamName.toLowerCase().replace(' ', '-')}`}
                >
                  <h3>{teamName}</h3>
                  <div className="player-count">{teamData.players.length} Players</div>
                  <div className="player-list">
                    {teamData.players.map((player, index) => (
                      <div key={index} className="player-name">{player.name}</div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
          
          {/* Center viewer participation section */}
          <div className="viewer-participation-section">
            <div className="viewer-join-prompt">
              <h2>Join the Game!</h2>
              <div className="qr-placeholder">
                <div className="qr-code-frame">
                  <p>Scan to Join</p>
                </div>
              </div>
              <div className="join-instructions">
                <p>Use your phone to participate</p>
                <p className="room-code-large">Room Code: <span>{room}</span></p>
                {totalViewers > 0 && (
                  <div className="current-viewers">
                    <p>{totalViewers} viewers already participating</p>
                  </div>
                )}
              </div>
            </div>
            <div className="waiting-message">
              <h2>Waiting for admin to start the game...</h2>
            </div>
          </div>
          
          {/* Right side teams */}
          <div className="teams-side teams-right">
            {Object.entries(teamPlayers)
              .filter(([_, teamData]) => teamData.players && teamData.players.length > 0)
              .slice(Math.ceil(Object.entries(teamPlayers).filter(([_, teamData]) => teamData.players && teamData.players.length > 0).length / 2))
              .map(([teamName, teamData]) => (
                <div 
                  key={teamName} 
                  className={`team-card ${teamName.toLowerCase().replace(' ', '-')}`}
                >
                  <h3>{teamName}</h3>
                  <div className="player-count">{teamData.players.length} Players</div>
                  <div className="player-list">
                    {teamData.players.map((player, index) => (
                      <div key={index} className="player-name">{player.name}</div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (showRoundScreen) {
    return (
      <div className="round-screen">
        <h1>In Gesprek Met</h1>
        <p className="room-code">Room Code: {room}</p>
        <p className="viewer-count">Viewers: {totalViewers}</p>
        
        <div className="round-announcement">
          <h2>Round {currentRound} of {totalRounds}</h2>
          <div className="round-description">Waiting for admin to start the round...</div>
        </div>
        
        <div className="team-scores-container">
          <h2>Current Standings</h2>
          <div className="team-scores-grid">
            {Object.entries(teamScores)
              .sort((a, b) => b[1].score - a[1].score)
              .map(([teamName, data], index) => (
                <div 
                  key={teamName} 
                  className={`team-score-card ${teamName.toLowerCase().replace(' ', '-')} ${index === 0 ? 'leading' : ''}`}
                >
                  <h3>{teamName}</h3>
                  <div className="score-display">{data.score}</div>
                </div>
              ))
            }
            
            {totalViewers > 0 && (
              <div className="team-score-card viewers-team">
                <h3>Audience</h3>
                <div className="viewer-count-display">{totalViewers} Viewers</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scoreboard">
      <h1>In Gesprek Met</h1>
      <p className="room-code">Room Code: {room}</p>
      <p className="viewer-count">Viewers: {totalViewers}</p>
      
      {isActivityRound ? (
        <div className="activity-round-container">
          <div className="activity-round-header">
            <h2 className="activity-round-title">Activity Round {currentRound}</h2>
            <div className="activity-badge">DOEVRAAG</div>
          </div>
          
          <div className="activity-description">
            <p>{activityDescription}</p>
          </div>
          
          <div className="team-scores-grid activity-scores">
            {Object.entries(teamScores)
              .sort((a, b) => b[1].score - a[1].score)
              .map(([teamName, data], index) => (
                <div 
                  key={teamName} 
                  className={`team-score-card ${teamName.toLowerCase().replace(' ', '-')} ${index === 0 ? 'leading' : ''}`}
                >
                  <h3>{teamName}</h3>
                  <div className="score-display">{data.score}</div>
                </div>
              ))
            }
          </div>
        </div>
      ) : (
        <div className="waiting-room-layout">
          {/* Left side teams */}
          <div className="teams-side teams-left">
            {Object.entries(teamPlayers)
              .filter(([_, teamData]) => teamData.players && teamData.players.length > 0)
              .slice(0, Math.ceil(Object.entries(teamPlayers).filter(([_, teamData]) => teamData.players && teamData.players.length > 0).length / 2))
              .map(([teamName, teamData]) => (
                <div 
                  key={teamName} 
                  className={`team-card ${teamName.toLowerCase().replace(' ', '-')}`}
                >
                  <h3>{teamName}</h3>
                  <div className="player-count">{teamData.players.length} Players</div>
                  <div className="score-display">{teamScores[teamName] ? teamScores[teamName].score : teamData.score || 0}</div>
                </div>
              ))}
            
            {/* Viewers Card */}
            {totalViewers > 0 && (
              <div className="team-card viewers-card">
                <h3>Viewers</h3>
                <div className="player-count">{totalViewers} Viewers</div>
                <div className="score-display">
                  {Object.keys(viewerStats).length > 0 ? 
                    // Calculate correct viewer responses percentage
                    Object.entries(viewerStats).reduce((score, [optionIndex, percentage]) => {
                      // Check if this option matches the correct answer
                      const optionText = currentOptions[parseInt(optionIndex)]?.text;
                      if (optionText && optionText === correctAnswer) {
                        return percentage;
                      }
                      return score;
                    }, 0) + '%'
                  : '0%'}
                </div>
                {Object.keys(viewerStats).length > 0 && (
                  <div className="viewer-accuracy">Accuracy</div>
                )}
              </div>
            )}
          </div>
          
          {/* Center question section */}
          <div className="question-info">
            <div className="question-counter">
              {isActivityRound ? `Activity Round ${currentRound}` : `Question ${questionNumber}/${totalQuestions}`}
            </div>
            
            {isActivityRound ? (
              <div className="activity-round-display">
                <h2>Activity Round</h2>
                <div className="activity-description">
                  {activityDescription}
                </div>
                <div className="activity-instructions">
                  <p>Points will be awarded by the admin based on performance.</p>
                </div>
              </div>
            ) : showingResults ? (
              <div className="results-display">
                <h2>Current Question Results</h2>
                {correctAnswer && (
                  <div className="correct-answer">
                    <h3>Correct Answer:</h3>
                    <p>{correctAnswer}</p>
                  </div>
                )}
                {Object.keys(viewerStats).length > 0 && (
                  <div className="viewer-stats">
                    <h3>Viewer Responses</h3>
                    <div className="viewer-stats-grid">
                      {Object.entries(viewerStats).map(([optionIndex, percentage]) => (
                        <div key={optionIndex} className="viewer-stat-item">
                          <div className="viewer-option-text">{currentOptions[optionIndex]?.text || `Option ${parseInt(optionIndex) + 1}`}</div>
                          <div className="viewer-percentage-bar">
                            <div
                              className="viewer-percentage-fill"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="viewer-percentage-text">{percentage}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="current-question">
                <h2>Current Question:</h2>
                <p className="question-text">{currentQuestion}</p>
                {questionImage && (
                  <div className="question-image-container">
                    {mediaError ? (
                      <div className="media-error">{mediaError}</div>
                    ) : questionImage.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video 
                        src={normalizeImagePath(questionImage)} 
                        alt="Question Video" 
                        className="question-image"
                        controls
                        autoPlay
                        muted
                        loop
                        playsInline
                        onError={() => {
                          console.error("Video failed to load:", questionImage);
                          setMediaError(`Video failed to load. Please check the path: ${questionImage}`);
                        }}
                      />
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
                
                {/* Display multiple images for comparison */}
                {(questionImage1 || questionImage2) && (
                  <div className="comparison-images-container">
                    {questionImage1 && (
                      <div className="comparison-image-box">
                        <div className="comparison-image-label">Foto 1</div>
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
                      <div className="comparison-image-box">
                        <div className="comparison-image-label">Foto 2</div>
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
                
                {currentOptions && currentOptions.length > 0 && (
                  <div className="question-options">
                    {currentOptions.map((option, index) => (
                      <div key={index} className="question-option">
                        <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                        <span className="option-text">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Right side teams */}
          <div className="teams-side teams-right">
            {Object.entries(teamPlayers)
              .filter(([_, teamData]) => teamData.players && teamData.players.length > 0)
              .slice(Math.ceil(Object.entries(teamPlayers).filter(([_, teamData]) => teamData.players && teamData.players.length > 0).length / 2))
              .map(([teamName, teamData]) => (
                <div 
                  key={teamName} 
                  className={`team-card ${teamName.toLowerCase().replace(' ', '-')}`}
                >
                  <h3>{teamName}</h3>
                  <div className="player-count">{teamData.players.length} Players</div>
                  <div className="score-display">{teamScores[teamName] ? teamScores[teamName].score : teamData.score || 0}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;