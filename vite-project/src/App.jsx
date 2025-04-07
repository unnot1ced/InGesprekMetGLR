import React, { useState, useEffect } from 'react';
import './App.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import io from 'socket.io-client';

const socket = io("https://igm-backend.onrender.com", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

function App() {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [info, setInfo] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [seconds, setSeconds] = useState(0); 
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
  const [showStartScreen, setShowStartScreen] = useState(false);
  const [teamPlayers, setTeamPlayers] = useState({});
  const [gameStarted, setGameStarted] = useState(false);

  const [roomError, setRoomError] = useState('');
  const [teamVotes, setTeamVotes] = useState({});
  const [teamAnswerSummary, setTeamAnswerSummary] = useState(null);
  
  const handleSubmit = (e) => {
    e.preventDefault();

    if (name && room && team) {
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
    if (adminCode === 'IGM2024') { 
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
      }, 400);
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

  const handleNextQuestion = () => {
    if (isAdmin && room) {
      socket.emit('adminNextQuestion', room);
      toast.info('Moving to next question...', {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  useEffect(() => {
    socket.on('connect', () => {
      setConnectionError(false);
    });

    socket.on('connect_error', () => {
      setConnectionError(true);
      toast.error('Aw nee de server staat niet aan:(', {
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
      setOptions(data.answers);
      setAnswered(false);
      setSelectedAnswerIndex(null);
      setShowingResults(false);
      setQuestionImage(data.image || null);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      
      if (data.duration) {
        setSeconds(data.duration / 1000);
        setStartTime(Date.now());
        setDuration(data.duration);
        setProgress(100);
      }
    });

    socket.on('showResults', (data) => {
      setShowingResults(true);
      setScores(data.scores);
      setNextQuestionTimer(data.nextQuestionIn);
      
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
      
      // Extract team voting information for display
      if (data.answers && data.answers.teamVotes) {
        setTeamAnswerSummary(data.answers);
      }
      
      // Reset team votes for next question
      setTeamVotes({});
    });

    socket.on('gameOver', (data) => {
      setWinner(data.winner);
      toast.success(`${data.winner} wint het spel!`, {
        position: "top-center",
        autoClose: false,
      });
    });

    socket.on('teamPlayersUpdate', (teams) => {
      setTeamPlayers(teams);
    });

    socket.on('gameStarted', () => {
      setShowStartScreen(false);
      setGameStarted(true);
    });

    socket.on('playerAnswered', (data) => {
      // Update UI to show a team member has voted
      setTeamVotes(prev => {
        const newVotes = {...prev};
        if (!newVotes[data.team]) {
          newVotes[data.team] = [];
        }
        if (!newVotes[data.team].includes(data.playerName)) {
          newVotes[data.team] = [...newVotes[data.team], data.playerName];
        }
        return newVotes;
      });
      
      // Notify with toast if it's useful
      if (data.team === team && data.playerName !== name) {
        toast.info(`Your teammate ${data.playerName} has answered!`, {
          position: "top-right",
          autoClose: 2000,
        });
      }
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('message');
      socket.off('playerLeft');
      socket.off('newQuestion');
      socket.off('showResults');
      socket.off('roundResults');
      socket.off('gameOver');
      socket.off('teamPlayersUpdate');
      socket.off('gameStarted');
      socket.off('playerAnswered');
    };
  }, [team, name]);

  useEffect(() => {
    if (!startTime || !duration) return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = duration - elapsed;
      
      if (remaining <= 0) {
        clearInterval(interval);
        setSeconds(0);
        setProgress(0);
        return;
      }
      
      setSeconds(remaining / 1000);
      setProgress((remaining / duration) * 100);
    }, 100);
    
    return () => clearInterval(interval);
  }, [startTime, duration]);

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
          <h2>Kan niet verbinden met server</h2>
          <p>Weet je zeker dat de server runt?</p>
          <button onClick={() => socket.connect()}>Probeer opnieuw</button>
        </div>
      ) : !info ? (
        <div className='join-div'>
          <div className='blue-filler-div'></div>
          <div className='start-screen-img-background'></div>
          <img 
            src="/images/logo-whitebackground.png" 
            alt="Quiz Start Screen" 
            className="start-screen-image"
          />
          {roomError && <p className="room-error">{roomError}</p>}
          <form onSubmit={handleSubmit}>
            <input required placeholder='Enter your name' value={name} onChange={(e) => setName(e.target.value)} />
            <input required placeholder='Enter room no' value={room} onChange={(e) => setRoom(e.target.value)} />
            <select required value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">Selecteer Opleiding</option>
              <option value="Red Team" className="team-option red-team">Media-vormgeven</option>
              <option value="Orange Team" className="team-option orange-team">Media-manager</option>
              <option value="Yellow Team" className="team-option yellow-team">AV-specialist</option>
              <option value="Darkyellow Team" className="team-option darkyellow-team">Fotografie</option>
              <option value="Pink Team" className="team-option pink-team">Redactie-medewerker</option>
              <option value="Lavender Team" className="team-option lavender-team">Mediamaker</option>
              <option value="Purple Team" className="team-option purple-team">Medewerker-sign</option>
              <option value="Turqoise Team" className="team-option turqoise-team">Podium-evenementen</option>
              <option value="Lightblue Team" className="team-option lightblue-team">ICT-media</option>
              <option value="Blue Team" className="team-option blue-team">Creative-software-developer</option>
            </select>
            <button type='submit' className='join-btn'>Join</button>
          </form>
          
          
          
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
        <div className="start-screen">
          <button className="quit-button" onClick={handleQuit}>
            Verlaten
          </button>
          <h1>In Gesprek met</h1>
          <p className='room-id'>Join Id: {room}</p>
          
          <div className="teams-container">
            {Object.entries(teamPlayers).map(([teamName, teamData], teamIndex) => (
              <div 
                key={teamName} 
                className={`team-card ${teamName.toLowerCase().replace(' ', '-')}`}
                style={{ '--index': teamIndex }}
              >
                <h3>{getTeamDisplayName(teamName)}</h3>
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
      ) : (
        <div className={isExiting ? 'page-exit' : ''}>
          <button className="quit-button" onClick={handleQuit}>
            Verlaat spel
          </button>
          <h1>In Gesprek met</h1>
          <p className='room-id'>Join Id: {room}</p>

          {showingResults ? (
            <div className='results-screen'>
              <h2>Huidige vraag</h2>
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
              <p>Volgende vraag in: {nextQuestionTimer} seconden</p>
              {answers && (
                <div className='answers-summary'>
                  <h3>Correct antwoord: {answers.correct}</h3>
                  <div className="team-results">
                    {answers.correctTeams && answers.correctTeams.length > 0 && (
                      <div className="correct-teams">
                        <h4>Teams met correct antwoord:</h4>
                        {answers.correctTeams.map((teamData, index) => (
                          <div key={index} className="team-result correct">
                            <div className="team-name">{getTeamDisplayName(teamData.team)}</div>
                            <div className="team-answer">Gekozen: {teamData.majorityAnswer}</div>
                            <div className="player-list">
                              {teamData.players && teamData.players.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {answers.incorrectTeams && answers.incorrectTeams.length > 0 && (
                      <div className="incorrect-teams">
                        <h4>Teams met foute antwoord:</h4>
                        {answers.incorrectTeams.map((teamData, index) => (
                          <div key={index} className="team-result incorrect">
                            <div className="team-name">{getTeamDisplayName(teamData.team)}</div>
                            <div className="team-answer">Gekozen: {teamData.majorityAnswer}</div>
                            <div className="player-list">
                              {teamData.players && teamData.players.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className='player-answers'>
                    {answers.correctAnswers.length > 0 && (
                      <>
                        <h4>Correct antwoorden:</h4>
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
                        <h4>Foute antwoorden:</h4>
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
                Vraag {questionNumber}/{totalQuestions}
              </div>
              <div className='timer-bar'>
                <div
                  className={`timer-progress ${
                    progress < 30 ? 'danger' : progress < 60 ? 'warning' : ''
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className='timer-text'>Nog: {Math.ceil(seconds)} seconden</p>

              <div className='question'>
                <p className='question-text'>{question}</p>
                {questionImage && (
                  <div className='question-image-container'>
                    <img 
                      src={questionImage} 
                      alt="Question"
                      className='question-image'
                    />
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
              {!answered && (
                <div className="team-voting-status">
                  <h4>Team Stemmen Status</h4>
                  {Object.entries(teamVotes).map(([teamName, players]) => (
                    <div key={teamName} className={`team-votes ${teamName.toLowerCase().replace(' ', '-')}`}>
                      <span className="team-name">{getTeamDisplayName(teamName)}</span>: 
                      <span className="voted-count">{players.length} spelers gestemd</span>
                      {teamName === team && (
                        <div className="your-team-votes">
                          {teamPlayers[team]?.players.map(player => (
                            <span 
                              key={player.id} 
                              className={teamVotes[team]?.includes(player.name) ? "voted" : "not-voted"}
                            >
                              {player.name} {teamVotes[team]?.includes(player.name) ? "✓" : "..."}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p>Vraag Laden</p>
          )}
          {isAdmin && (
            <div className="admin-controls">
              <button onClick={handleNextQuestion} className="admin-btn">
                Volgende vraag
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

  // Add to your useEffect
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
      setOptions(data.answers);
      setAnswered(false);
      setSelectedAnswerIndex(null);
      setShowingResults(false);
      setQuestionImage(data.image || null);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      
      // If timer is enabled
      if (data.duration) {
        setSeconds(data.duration / 1000);
        setStartTime(Date.now());
        setDuration(data.duration);
        setProgress(100);
      }
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

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('message');
      socket.off('playerLeft');
      socket.off('newQuestion');
      socket.off('showResults');
      socket.off('roundResults');
      socket.off('gameOver');
      socket.off('teamPlayersUpdate');
      socket.off('gameStarted');
    };
  }, [team]);

  // Timer effect
  useEffect(() => {
    if (!startTime || !duration) return;
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = duration - elapsed;
      
      if (remaining <= 0) {
        clearInterval(interval);
        setSeconds(0);
        setProgress(0);
        return;
      }
      
      setSeconds(remaining / 1000);
      setProgress((remaining / duration) * 100);
    }, 100);
    
    return () => clearInterval(interval);
  }, [startTime, duration]);

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
          <form onSubmit={handleSubmit}>
            <input required placeholder='Enter your name' value={name} onChange={(e) => setName(e.target.value)} />
            <input required placeholder='Enter room no' value={room} onChange={(e) => setRoom(e.target.value)} />
            <select required value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">Select Team</option>
              <option value="Red Team">Red Team</option>
              <option value="Blue Team">Blue Team</option>
              <option value="Green Team">Green Team</option>
              <option value="Yellow Team">Yellow Team</option>
              <option value="Purple Team">Purple Team</option>
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
        </div>
      ) : showStartScreen ? (
        // New start screen showing teams and players
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
                <h3>{getTeamDisplayName(teamName)}</h3>
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
            <button onClick={startGame} className="start-game-btn">
              Start Game
            </button>
          )}
          {!isAdmin && (
            <p className="waiting-text">Waiting for admin to start the game...</p>
          )}
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
                  <div className="team-results">
                    {answers.correctTeams && answers.correctTeams.length > 0 && (
                      <div className="correct-teams">
                        <h4>Teams met correct antwoord:</h4>
                        {answers.correctTeams.map((teamData, index) => (
                          <div key={index} className="team-result correct">
                            <div className="team-name">{getTeamDisplayName(teamData.team)}</div>
                            <div className="team-answer">Gekozen: {teamData.majorityAnswer}</div>
                            <div className="player-list">
                              {teamData.players && teamData.players.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {answers.incorrectTeams && answers.incorrectTeams.length > 0 && (
                      <div className="incorrect-teams">
                        <h4>Teams met foute antwoord:</h4>
                        {answers.incorrectTeams.map((teamData, index) => (
                          <div key={index} className="team-result incorrect">
                            <div className="team-name">{getTeamDisplayName(teamData.team)}</div>
                            <div className="team-answer">Gekozen: {teamData.majorityAnswer}</div>
                            <div className="player-list">
                              {teamData.players && teamData.players.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                      src={questionImage} 
                      alt="Question"
                      className='question-image'
                    />
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
              {!answered && (
                <div className="team-voting-status">
                  <h4>Team Stemmen Status</h4>
                  {Object.entries(teamVotes).map(([teamName, players]) => (
                    <div key={teamName} className={`team-votes ${teamName.toLowerCase().replace(' ', '-')}`}>
                      <span className="team-name">{getTeamDisplayName(teamName)}</span>: 
                      <span className="voted-count">{players.length} spelers gestemd</span>
                      {teamName === team && (
                        <div className="your-team-votes">
                          {teamPlayers[team]?.players.map(player => (
                            <span 
                              key={player.id} 
                              className={teamVotes[team]?.includes(player.name) ? "voted" : "not-voted"}
                            >
                              {player.name} {teamVotes[team]?.includes(player.name) ? "✓" : "..."}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
}

const getTeamDisplayName = (teamId) => {
  const teamNameMap = {
    "Red Team": "Media-vormgeven",
    "Orange Team": "Media-manager",
    "Yellow Team": "AV-specialist",
    "Darkyellow Team": "Fotografie",
    "Pink Team": "Redactie-medewerker",
    "Lavender Team": "Mediamaker",
    "Purple Team": "Medewerker-sign",
    "Turqoise Team": "Podium-evenementen",
    "Lightblue Team": "ICT-media",
    "Blue Team": "Creative-software-developer"
  };
  return teamNameMap[teamId] || teamId;
};

export default App;


