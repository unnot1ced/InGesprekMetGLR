import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const url = "https://igm-backend.onrender.com";
const socket = io("ws://localhost:5000", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

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

  const handleRoomJoin = (e) => {
    e.preventDefault();
    if (room && adminCode === 'IGM2025ADM1n.') {
      setAuthenticated(true);
      socket.emit('joinAdminPanel', room);
      setConnected(true);
    } else {
      alert('Foute admin code.. :)');
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

  const resetGame = () => {
    if (connected && room) {
      socket.emit('resetGame', room);
      setGameStarted(false);
      setWinner(null);
      setShowingResults(false);
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
      setCorrectAnswer(null);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setPlayerAnswers([]);
    });

    socket.on('playerAnswered', (data) => {
      setPlayerAnswers(prev => [...prev, data]);
    });

    socket.on('showResults', (data) => {
      setShowingResults(true);
      setScores(data.scores);
    });

    socket.on('roundResults', (data) => {
      if (data.answers && data.answers.correct) {
        setCorrectAnswer(data.answers.correct);
        setScores(data.scores);
      }
    });

    socket.on('gameOver', (data) => {
      setWinner(data.winner);
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
      socket.off('gameOver');
    };
  }, []);

  // Add the team name mapping function
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

  if (!authenticated) {
    return (
      <div className="admin-login">
        <h1>In Gesprek Met - Admin Panel</h1>
        {connectionError ? (
          <div className="error-message">
            <p>Uh oh! De server draait niet of je kan niet verbinden :(</p>
            <button onClick={() => socket.connect()}>Probeer opnieuw</button>
          </div>
        ) : (
          <form onSubmit={handleRoomJoin}>
            <input 
              type="text" 
              placeholder="Room code" 
              value={room} 
              onChange={(e) => setRoom(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Typ de Admin Code" 
              value={adminCode} 
              onChange={(e) => setAdminCode(e.target.value)}
              required
            />
            <button type="submit">Meedoen als Admin</button>
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

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>In Gesprek Met - Admin Panel</h1>
        <div className="room-info">
          <span>Room: {room}</span>
          <span>Status: {gameStarted ? 'Game in Progress' : 'Waiting to Start'}</span>
          {gameStarted && <span>Vraag: {questionNumber}/{totalQuestions}</span>}
        </div>
        <div className="admin-controls">
          {!gameStarted && (
            <button 
              className="start-game-btn" 
              onClick={startGame}
              disabled={Object.values(teamPlayers).every(team => team.players.length === 0)}
            >
              Start Spel
            </button>
          )}
          {gameStarted && !winner && (
            <button className="next-question-btn" onClick={nextQuestion}>
              Volgende vraag
            </button>
          )}
          {(gameStarted || winner) && (
            <button className="reset-game-btn" onClick={resetGame}>
              Reset Spel
            </button>
          )}
        </div>
      </header>

      <div className="admin-content">
        {!gameStarted ? (
          <div className="waiting-room-panel">
            <h2>Teams Klaar voor de start!</h2>
            <div className="teams-grid">
              {Object.entries(teamPlayers).map(([teamName, teamData]) => (
                <div 
                  key={teamName} 
                  className={`team-card ${teamName.toLowerCase().replace(' ', '-')}`}
                >
                  <h3>{getTeamDisplayName(teamName)}</h3>
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
        ) : winner ? (
          <div className="game-over-panel">
            <h2>Game Over</h2>
            <div className="winner-announcement">
              <h3>De Winnaar is:</h3>
              <div className="winner-team">{winner}</div>
            </div>
            <div className="final-scores">
              <h3>Eindscores</h3>
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
        ) : (
          <div className="game-panel">
            <div className="question-panel">
              <h2>Huidige vraag</h2>
              <div className="question-display">
                <p className="question-text">{currentQuestion}</p>
                {questionImage && (
                  <div className="question-image-container">
                    <img 
                      src={questionImage} 
                      alt="Question"
                      className="question-image"
                    />
                  </div>
                )}
              </div>
              {correctAnswer && (
                <div className="correct-answer">
                  <h3>Goede antwoord:</h3>
                  <p>{correctAnswer}</p>
                </div>
              )}
            </div>

            <div className="answers-panel">
              <h2>Antwoorden spelers</h2>
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
              <h2>Huidige Scores</h2>
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
      </div>
    </div>
  );
}

export default App;
