import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const url = "https://igm-backend.onrender.com";
const socket = io("ws://localhost:5000", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

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
    });

    socket.on('showResults', (data) => {
      setShowingResults(true);
      
      const teams = {};
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
      if (data.answers && data.answers.correct) {
        setCorrectAnswer(data.answers.correct);
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
      socket.off('showResults');
      socket.off('roundResults');
      socket.off('gameOver');
    };
  }, []);

  if (!connected) {
    return (
      <div className="scoreboard-login">
        <h1>In Gesprek Met - Scoreboard</h1>
        {connectionError ? (
          <div className="error-message">
            <p>Uh oh! De server draait niet of je kan niet verbinden :(</p>
            <button onClick={() => socket.connect()}>Opnieuw proberem</button>
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
            <button type="submit">Verbinden met room?</button>
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
          <h2>The Winnaar is:</h2>
          <div className="winner-team">{winner}</div>
        </div>
        <div className="final-scores">
          {Object.entries(teamScores).sort((a, b) => b[1].score - a[1].score).map(([teamName, data], index) => (
            <div 
              key={teamName} 
              className={`team-score ${teamName.toLowerCase().replace(' ', '-')} ${index === 0 ? 'winner' : ''}`}
            >
              <h3>{getTeamDisplayName(teamName)}</h3>
              <p className="team-total-score">{data.score}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="waiting-room">
        <h1>In Gesprek Met</h1>
        <p className="room-code">Room Code: {room}</p>
        <h2>Teams staan klaar!</h2>
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
        <div className="waiting-message">
          <h2>Een admin start het spel zometeen!</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="scoreboard">
      <h1>In Gesprek Met</h1>
      <p className="room-code">Room Code: {room}</p>
      
      <div className="question-info">
        <div className="question-counter">
          Vraag {questionNumber}/{totalQuestions}
        </div>
        
        {showingResults ? (
          <div className="results-display">
            <h2>Huidige vraag resultaten</h2>
            {correctAnswer && (
              <div className="correct-answer">
                <h3>Correcte vraag:</h3>
                <p>{correctAnswer}</p>
              </div>
            )}
            <div className="timer-bar">
              <div
                className={`timer-progress ${
                  progress < 30 ? 'danger' : progress < 60 ? 'warning' : ''
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="next-question-timer">Volgende vraag in: {nextQuestionTimer} seconden</p>
          </div>
        ) : (
          <div className="current-question">
            <h2>Huidige vraag:</h2>
            <p>{currentQuestion}</p>
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
        )}
      </div>
      
      <div className="team-scores-container">
        <h2>Team Scores</h2>
        <div className="team-scores-grid">
          {Object.entries(teamScores)
            .sort((a, b) => b[1].score - a[1].score)
            .map(([teamName, data], index) => (
              <div 
                key={teamName} 
                className={`team-score-card ${teamName.toLowerCase().replace(' ', '-')} ${index === 0 ? 'leading' : ''}`}
              >
                <h3>{getTeamDisplayName(teamName)}</h3>
                <div className="score-display">{data.score}</div>
                <div className="team-players">
                  {data.players
                    .sort((a, b) => b.score - a.score)
                    .map((player, playerIndex) => (
                      <div key={playerIndex} className="player-score">
                        <span className="player-name">{player.name}</span>
                        <span className="player-points">{player.score}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

export default App;