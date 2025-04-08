import React, { useState, useEffect } from 'react';
import './App.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import io from 'socket.io-client';

const socket = io("ws://localhost:5000", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Helper function to normalize image paths
const normalizeImagePath = (path) => {
  if (!path) return '';
  // Remove any leading slashes and ensure proper path format
  const cleanPath = path.replace(/^\/+/, '');
  return `${window.location.protocol}//${window.location.hostname}:5000/${cleanPath}`;
};

function App() {
  // Initialize state variables with empty strings instead of null
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [info, setInfo] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [seconds, setSeconds] = useState(0); // Initialize with 0 instead of undefined
  const [scores, setScores] = useState([]);
  const [winner, setWinner] = useState(null);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [showingResults, setShowingResults] = useState(false);
  const [nextQuestionTimer, setNextQuestionTimer] = useState(0);
  const [progress, setProgress] = useState(100);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [team, setTeam] = useState('');
  const [answers, setAnswers] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [questionImage, setQuestionImage] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showAdminInput, setShowAdminInput] = useState(false);
  // New states for the start screen
  const [showStartScreen, setShowStartScreen] = useState(false);
  const [teamPlayers, setTeamPlayers] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  // New states for round display
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(4);
  const [showRoundScreen, setShowRoundScreen] = useState(false);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  // Add a state for room creation error
  const [roomError, setRoomError] = useState('');
  
  // Add questionImage1 and questionImage2 states
  const [questionImage1, setQuestionImage1] = useState(null);
  const [questionImage2, setQuestionImage2] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (name && room && team) {
      // Try to join the room
      socket.emit('checkRoom', room, (exists) => {
        if (exists) {
          setInfo(true);
          setShowStartScreen(true);
          socket.emit('joinRoom', room, name, team);
        } else {
          setRoomError(`Room ${room} doesn't exist. Please ask an admin to create it.`);
          toast.error(`Room ${room} doesn't exist. Please ask an admin to create it.`, {
            position: "top-center",
            autoClose: 5000,
          });
        }
      });
    }
  };

  // Add a function for admin to create a room
  const createRoom = () => {
    if (isAdmin && room) {
      socket.emit('createRoom', room);
      setInfo(true);
      setShowStartScreen(true);
      toast.success(`Room ${room} created successfully!`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleAdminAccess = (e) => {
    e.preventDefault();
    if (adminCode === 'IGM2024') { // You can change this admin code
      setIsAdmin(true);
      setShowAdminInput(false);
      toast.success('Admin access granted!');
    } else {
      toast.error('Invalid admin code');
    }
  };

  const startGame = () => {
    if (isAdmin) {
      socket.emit('startGame', room);
      setShowStartScreen(false);
      setGameStarted(true);
    }
  };

  // Add new state for power-ups
  const [powerupsEnabled, setPowerupsEnabled] = useState(false);
  const [teamPowerups, setTeamPowerups] = useState({});
  const [disabledOptions, setDisabledOptions] = useState([]);

  const handleQuit = () => {
    if (room) {
      setIsExiting(true);
      setTimeout(() => {
        socket.emit('quitGame', room);
        setInfo(false);
        setName('');
        setRoom('');
        setQuestion('');
        setOptions([]);
        setScores([]);
        setWinner(null);
        setIsExiting(false);
        setShowStartScreen(false);
        setGameStarted(false);
      }, 400); // Match the pageExit animation duration
    }
  };

  const handleAnswer = (index) => {
    if (answered) return;
    
    setSelectedAnswerIndex(index);
    setAnswered(true);
    
    socket.emit('submitAnswer', room, index);
    
    toast.info('Answer submitted!', {
      position: "top-right",
      autoClose: 2000,
    });
  };

  // Add this function after handleAnswer but before the useEffect hooks
  const handleNextQuestion = () => {
    if (isAdmin && room) {
      socket.emit('adminNextQuestion', room);
      toast.info('Moving to next question...', {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  // All useEffect hooks must be at the top level of the component
  useEffect(() => {
    socket.on('connect', () => {
      setConnectionError(false);
    });

    socket.on('connect_error', () => {
      setConnectionError(true);
      toast.error('Cannot connect to server! Please make sure the server is running.', {
        position: "top-center",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });

    socket.on('message', (message) => {
      toast.info(message, {
        position: "top-right",
        autoClose: 3000,
      });
    });

    socket.on('playerLeft', (message) => {
      toast.info(message, {
        position: "top-right",
        autoClose: 3000,
      });
    });

    socket.on('newQuestion', (data) => {
      setQuestion(data.question);
      // Only handle image paths now
      setQuestionImage(data.image || null);
      setQuestionImage1(data.image1 || null);
      setQuestionImage2(data.image2 || null);
      setOptions(data.answers || []);
      setAnswered(false);
      setSelectedAnswerIndex(null);
      setDisabledOptions([]);
      setShowingResults(false);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      
      // Update round info
      setCurrentRound(data.currentRound);
      setTotalRounds(data.totalRounds);
      
      // Set up timer
      const durationMs = (data.duration || 15) * 1000;
      setDuration(durationMs);
      setStartTime(Date.now());
      setSeconds(durationMs / 1000);
      setProgress(100);
    });

    socket.on('showResults', (data) => {
      setShowingResults(true);
      setScores(data.scores);
      setNextQuestionTimer(data.nextQuestionIn);
      
      // Start countdown for next question
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = data.duration - elapsed;
        
        if (remaining <= 0) {
          clearInterval(interval);
          return;
        }
        
        setNextQuestionTimer(Math.ceil(remaining / 1000));
        setProgress((remaining / data.duration) * 100);
      }, 100);
      
      return () => clearInterval(interval);
    });

    socket.on('roundResults', (data) => {
      setScores(data.scores);
      setAnswers(data.answers);
    });

    socket.on('gameOver', (data) => {
      setWinner(data.winner);
      toast.success(`${data.winner} wins the game!`, {
        position: "top-center",
        autoClose: false,
      });
    });

    // Add new effect for team players updates
    socket.on('teamPlayersUpdate', (teams) => {
      setTeamPlayers(teams);
    });

    socket.on('gameStarted', () => {
      setShowStartScreen(false);
      setGameStarted(true);
    });

    // Add listeners for round-related events
    socket.on('roundScreen', (data) => {
      setShowRoundScreen(true);
      setCurrentRound(data.roundNumber);
      setTotalRounds(data.totalRounds);
      setQuestion('');
      setOptions([]);
      setShowingResults(false);
    });

    socket.on('roundStarting', (data) => {
      setShowRoundScreen(false);
      setCurrentRound(data.roundNumber);
      setIsRoundComplete(false);
    });

    socket.on('roundComplete', (data) => {
      setIsRoundComplete(true);
      setCurrentRound(data.nextRound);
    });

    // Add handler for powerups and their effects
    socket.on('powerupsStatus', (data) => {
      setPowerupsEnabled(data.enabled);
    });

    socket.on('teamPowerupsUpdate', (data) => {
      setTeamPowerups(data);
    });

    socket.on('disableOptions', (optionIndices) => {
      setDisabledOptions(optionIndices);
    });

    // Add handler for timeUp event
    socket.on('timeUp', () => {
      console.log('Time is up for the current question');
      // Mark the question as answered to prevent further submissions
      setAnswered(true);
      setSeconds(0);
      setProgress(0);
      // Notify the user that time is up
      toast.info('Time is up! No more answers can be submitted.', {
        position: "top-center",
        autoClose: 2000,
      });
    });
    
    // Add handler for timer updates from server
    socket.on('timerUpdate', (data) => {
      if (!answered) {
        const remainingSeconds = data.timeRemaining / 1000;
        setSeconds(remainingSeconds);
        setProgress((remainingSeconds / (duration / 1000)) * 100);
      }
    });

    // Clean up event listeners when component unmounts
    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('message');
      socket.off('playerLeft');
      socket.off('newQuestion');
      socket.off('showResults');
      socket.off('roundResults');
      socket.off('gameOver');
      socket.off('timeUp');
      socket.off('timerUpdate');
      socket.off('teamPlayersUpdate');
      socket.off('gameStarted');
      socket.off('roundScreen');
      socket.off('roundStarting');
      socket.off('roundComplete');
      socket.off('powerupsStatus');
      socket.off('teamPowerupsUpdate');
      socket.off('disableOptions');
    };
  }, []);

  // Timer effect - as a backup to server updates
  useEffect(() => {
    if (!startTime || !duration || answered) return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = duration - elapsed;
      
      if (remaining <= 0) {
        clearInterval(interval);
        setSeconds(0);
        setProgress(0);
        // Mark as answered when timer reaches zero locally
        // This ensures the UI updates immediately even before the server's timeUp event
        setAnswered(true);
        return;
      }
      
      setSeconds(remaining / 1000);
      setProgress((remaining / duration) * 100);
    }, 100);
    
    return () => clearInterval(interval);
  }, [startTime, duration, answered]);
  
  // Reset timer when answered changes to false (new question)
  useEffect(() => {
    if (!answered && startTime && duration) {
      const elapsed = Date.now() - startTime;
      const remaining = duration - elapsed;
      
      if (remaining > 0) {
        setSeconds(remaining / 1000);
        setProgress((remaining / duration) * 100);
      }
    }
  }, [answered, startTime, duration]);

  // All useEffect hooks must be at the top level of the component
  useEffect(() => {
    if (questionImage) {
      setMediaError(null);
    }
  }, [questionImage]);

  if (winner) {
    return (
      <h1>De winnaar is {winner}</h1>
    );
  }

  return (
    <div className="App">
      <ToastContainer />
      {connectionError && !info ? (
        <div className="error-screen">
          <h2>Cannot connect to server</h2>
          <p>Please make sure the server is running at localhost:5000</p>
          <button onClick={() => socket.connect()}>Retry Connection</button>
        </div>
      ) : !info ? (
        <div className='join-div'>
          <img 
            src="/images/Logo_IGM-DT.svg" 
            alt="Quiz Start Screen" 
            className="start-screen-image"
          />
          <h1>In gesprek met</h1>
          {roomError && <p className="room-error">{roomError}</p>}
          <form onSubmit={handleSubmit}>
            <input required placeholder='Enter your name' value={name} onChange={(e) => setName(e.target.value)} />
            <input required placeholder='Enter room no' value={room} onChange={(e) => setRoom(e.target.value)} />
            <select required value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">Select Team</option>
              <option value="Fotografie">Fotografie</option>
              <option value="Mediamanagement">Mediamanagement</option>
              <option value="Redactie">Redactie</option>
              <option value="Software">Software</option>
              <option value="AV">AV</option>
              <option value="PET">PET</option>
              <option value="Mediavormgeven">Mediavormgeven</option>
              <option value="ICT & mediatechnologie">ICT & mediatechnologie</option>
              <option value="Sign">Sign</option>
              <option value="Mediamaker">Mediamaker</option>
            </select>
            <button type='submit' className='join-btn'>Join</button>
          </form>
          
          <button className="admin-access-btn" onClick={() => setShowAdminInput(!showAdminInput)}>
            Admin Access
          </button>
          
          {showAdminInput && (
            <form onSubmit={handleAdminAccess} className="admin-form">
              <input
                type="password"
                placeholder="Enter admin code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
              />
              <button type="submit">Verify</button>
            </form>
          )}
          
          {isAdmin && (
            <div className="admin-create-room">
              <button onClick={createRoom} className="create-room-btn">
                Create Room
              </button>
            </div>
          )}
        </div>
      ) : showStartScreen ? (
        // Start screen with admin power-up toggle
        <div className="start-screen">
          <button className="quit-button" onClick={handleQuit}>
            Quit Game
          </button>
          <h1>In Gesprek met</h1>
          <p className='room-id'>Join Id: {room}</p>
          
          <div className="teams-container">
            <h2>Teams Ready</h2>
            {Object.entries(teamPlayers).map(([teamName, teamData], teamIndex) => (
              <div 
                key={teamName} 
                className={`team-card ${teamName.toLowerCase().replace(' ', '-')}`}
                style={{ '--index': teamIndex }}
              >
                <h3>{teamName}</h3>
                <div className="team-players">
                  {teamData.players.length > 0 ? (
                    teamData.players.map((player, index) => (
                      <div 
                        key={index} 
                        className="player-item"
                        style={{ '--index': index }}
                      >
                        {player.name}
                      </div>
                    ))
                  ) : (
                    <p className="no-players">No players yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {isAdmin && (
            <div className="admin-start-controls">
              <div className="powerup-toggle">
                <h3>Power-ups</h3>
                <div className="toggle-buttons">
                  <button 
                    onClick={() => togglePowerups(true)} 
                    className={`toggle-btn ${powerupsEnabled ? 'active' : ''}`}
                  >
                    Enable
                  </button>
                  <button 
                    onClick={() => togglePowerups(false)} 
                    className={`toggle-btn ${!powerupsEnabled ? 'active' : ''}`}
                  >
                    Disable
                  </button>
                </div>
              </div>
              <button onClick={startGame} className="start-game-btn">
                Start Game
              </button>
            </div>
          )}
          {!isAdmin && (
            <p className="waiting-text">Waiting for admin to start the game...</p>
          )}
        </div>
      ) : showRoundScreen ? (
        // New Round Screen Component
        <div className="round-screen">
          <button className="quit-button" onClick={handleQuit}>
            Quit Game
          </button>
          <h1>In Gesprek met</h1>
          <p className='room-id'>Join Id: {room}</p>
          
          <div className="round-display">
            <h2 className="round-title">Round {currentRound}</h2>
            <p className="round-subtitle">Get ready for the next set of questions!</p>
            
            <div className="round-progress">
              <div className="round-progress-bar">
                <div 
                  className="round-progress-indicator" 
                  style={{ width: `${(currentRound / totalRounds) * 100}%` }}
                ></div>
              </div>
              <p className="round-progress-text">Round {currentRound} of {totalRounds}</p>
            </div>
            
            {isAdmin && (
              <div className="admin-controls">
                <button onClick={handleNextQuestion} className="admin-btn">
                  Start Questions
                </button>
              </div>
            )}
            {!isAdmin && (
              <p className="waiting-text">Waiting for admin to start the questions...</p>
            )}
          </div>
        </div>
      ) : (
        // Existing game screen
        <div className={isExiting ? 'page-exit' : ''}>
          <button className="quit-button" onClick={handleQuit}>
            Quit Game
          </button>
          <h1>In Gesprek met</h1>
          <p className='room-id'>Join Id: {room}</p>

          {showingResults ? (
            <div className='results-screen'>
              <h2>Current Scores</h2>
              <div className='timer-bar'>
                <div
                  className={`timer-progress ${
                    progress < 30 ? 'danger' : progress < 60 ? 'warning' : ''
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className='scores-list'>
                {scores.map((player, index) => (
                  <p
                    key={index}
                    className='score-item'
                    style={{ '--index': index }}
                  >
                    {player.name}: {player.score}
                  </p>
                ))}
              </div>
              <p>Next question in: {nextQuestionTimer} seconds</p>
              {answers && (
                <div className='answers-summary'>
                  <h3>Correct Answer: {answers.correct}</h3>
                  <div className='player-answers'>
                    {answers.correctAnswers.length > 0 && (
                      <>
                        <h4>Correct Answers:</h4>
                        {answers.correctAnswers.map((answer, index) => (
                          <p
                            key={`correct-${index}`}
                            className="answer correct"
                            style={{ '--index': index }}
                          >
                            {answer.playerName} ({answer.team})
                          </p>
                        ))}
                      </>
                    )}
                    {answers.incorrectAnswers.length > 0 && (
                      <>
                        <h4>Incorrect Answers:</h4>
                        {answers.incorrectAnswers.map((answer, index) => (
                          <p key={`incorrect-${index}`} className="answer wrong">
                            {answer.playerName} ({answer.team}): {options[answer.answer]}
                          </p>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : question ? (
            <div className='quiz-div'>
              <div className='question-counter'>
                Question {questionNumber}/{totalQuestions}
              </div>
              <div className='timer-bar'>
                <div
                  className={`timer-progress ${
                    progress < 30 ? 'danger' : progress < 60 ? 'warning' : ''
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className='timer-text'>Time remaining: {Math.ceil(seconds)} seconds</p>

              <div className='question'>
                <p className='question-text'>{question}</p>
                {questionImage && (
                  <div className='question-image-container'>
                    <img 
                      src={normalizeImagePath(questionImage)} 
                      alt="Question"
                      className='question-image'
                      onError={(e) => {
                        console.error("Image failed to load:", questionImage);
                        setMediaError(`Failed to load image. Path: ${questionImage}`);
                        console.log("Full image URL:", normalizeImagePath(questionImage));
                      }}
                    />
                    {mediaError && (
                      <div className="media-error">
                        {mediaError}
                      </div>
                    )}
                  </div>
                )}
                
                {(questionImage1 || questionImage2) && (
                  <div className='multiple-images-container'>
                    {questionImage1 && (
                      <div className='image-container'>
                        <div className='image-label'>Foto 1</div>
                        <img 
                          src={normalizeImagePath(questionImage1)} 
                          alt="Image 1"
                          className='comparison-image'
                          onError={(e) => {
                            console.error("Image 1 failed to load:", questionImage1);
                            setMediaError(`Failed to load Image 1: ${questionImage1}`);
                            console.log("Full image 1 URL:", normalizeImagePath(questionImage1));
                          }}
                        />
                      </div>
                    )}
                    
                    {questionImage2 && (
                      <div className='image-container'>
                        <div className='image-label'>Foto 2</div>
                        <img 
                          src={normalizeImagePath(questionImage2)} 
                          alt="Image 2"
                          className='comparison-image'
                          onError={(e) => {
                            console.error("Image 2 failed to load:", questionImage2);
                            setMediaError(`Failed to load Image 2: ${questionImage2}`);
                            console.log("Full image 2 URL:", normalizeImagePath(questionImage2));
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {mediaError && (
                  <div className="media-error">
                    {mediaError}
                  </div>
                )}
              </div>
              {/* Add power-up buttons here */}
              {powerupsEnabled && !answered && (
                <div className="powerups-container">
                  {team && teamPowerups[team] && Object.entries(teamPowerups[team].powerups || {}).map(([type, count]) => (
                    <button 
                      key={type}
                      onClick={() => usePowerup(type)}
                      disabled={count <= 0}
                      className={`powerup-btn ${count <= 0 ? 'disabled' : ''}`}
                    >
                      {type} ({count})
                    </button>
                  ))}
                </div>
              )}
              
              <ul>
                {options.map((answer, index) => (
                  <li key={index}>
                    <button 
                      className={`options ${selectedAnswerIndex === index ? 'selected' : ''} ${disabledOptions.includes(index) ? 'disabled' : ''}`}
                      onClick={() => handleAnswer(index)} 
                      disabled={answered || disabledOptions.includes(index)}
                    >
                      {answer}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>Vraag Laden</p>
          )}
          {isAdmin && (
            <div className="admin-controls">
              <button onClick={handleNextQuestion} className="admin-btn">
                Next Question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Move these functions before the return statement
  const togglePowerups = (enabled) => {
    if (isAdmin && room) {
      socket.emit('adminTogglePowerups', room, enabled);
    }
  };

  const usePowerup = (powerupType) => {
    if (room && gameStarted && !answered) {
      socket.emit('usePowerup', room, powerupType);
    }
  };
}

export default App;


