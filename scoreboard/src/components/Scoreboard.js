import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './Scoreboard.css';

const Scoreboard = () => {
  const [socket, setSocket] = useState(null);
  const [teams, setTeams] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [waitingForAdmin, setWaitingForAdmin] = useState(true);
  const [roundResults, setRoundResults] = useState(null);
  const [showingResults, setShowingResults] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [viewerStats, setViewerStats] = useState({});
  const [viewerTeamScore, setViewerTeamScore] = useState(0);
  
  // Get room ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room') || '1'; // Default to room '1' if not specified

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('Scoreboard connected to server');
      console.log('Scoreboard joining room:', roomId);
      
      // Use the special scoreboard event instead of joinRoom
      newSocket.emit('joinScoreboard', roomId);
    });
    
    newSocket.on('teamPlayersUpdate', (teamsData) => {
      console.log('Teams updated:', teamsData);
      // Ensure all teams have a players array and score property
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
      setWaitingForAdmin(false);
    });
    
    newSocket.on('newQuestion', (questionData) => {
      console.log('New question received:', questionData);
      setCurrentQuestion(questionData);
      setShowingResults(false);
      setCurrentRound(questionData.currentRound || 1);
    });
    
    newSocket.on('roundResults', (results) => {
      console.log('Round results received:', results);
      setRoundResults(results);
      setShowingResults(true);
      setIsRoundComplete(results.isRoundComplete || false);
    });
    
    newSocket.on('roundComplete', (data) => {
      console.log('Round complete received:', data);
      setIsRoundComplete(true);
      setCurrentRound(data.nextRound);
    });
    
    newSocket.on('roundStarting', (data) => {
      console.log('Round starting received:', data);
      setIsRoundComplete(false);
      setCurrentRound(data.roundNumber);
    });
    
    newSocket.on('scoresUpdate', (data) => {
      console.log('Scores update received:', data);
      // Update teams with new scores
      if (roundResults) {
        setRoundResults(prev => ({
          ...prev,
          scores: data.scores
        }));
      }
      
      // Also update the teams state with new scores
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
    
    newSocket.on('gameOver', (data) => {
      console.log('Game over received:', data);
      setGameOver(true);
      setWinner(data.winner);
    });
    
    newSocket.on('questionEnded', (data) => {
      console.log('Question ended received:', data);
      // Update viewer statistics if available
      if (data.viewerStats) {
        setViewerStats(data.viewerStats);
        
        // Calculate viewer team score based on correct answers
        if (currentQuestion) {
          const correctAnswerIndex = currentQuestion.answers.findIndex(answer => answer === roundResults?.answers?.correct);
          if (correctAnswerIndex >= 0) {
            const correctPercentage = data.viewerStats[correctAnswerIndex] || 0;
            // Add points based on percentage of correct answers (1 point for every 20% correct)
            const pointsEarned = Math.round(correctPercentage / 20);
            setViewerTeamScore(prev => prev + pointsEarned);
          }
        }
      }
    });
    
    newSocket.on('gameReset', () => {
      console.log('Game reset received');
      // Just reset the game state without disconnecting
      setGameStarted(false);
      setWaitingForAdmin(true);
      setCurrentQuestion(null);
      setRoundResults(null);
      setShowingResults(false);
      setGameOver(false);
      setWinner(null);
      setCurrentRound(1);
      setIsRoundComplete(false);
      setViewerTeamScore(0); // Reset viewer team score
      setViewerStats({});    // Reset viewer statistics
      
      // Re-join the room to ensure we're still connected
      newSocket.emit('joinScoreboard', roomId);
    });
    
    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  const renderWaitingScreen = () => (
    <div className="waiting-screen">
      {isRoundComplete ? (
        <div className="round-complete-banner">
          <h2>Round {currentRound - 1} Complete!</h2>
          <p>Waiting for admin to start Round {currentRound}</p>
        </div>
      ) : (
        <h2>Waiting for admin to start the game</h2>
      )}
      
      {gameOver ? <p className="reset-message">Game has been reset. Waiting for admin to start a new game.</p> : null}
      
      <div className="join-info">
        <div className="qr-code-container">
          {/* Placeholder for QR code - in a real implementation, generate this dynamically */}
          <svg width="200" height="200" viewBox="0 0 200 200">
            <rect width="200" height="200" fill="#ffffff" />
            <g transform="scale(4)">
              {/* Simple QR code pattern - this would be replaced with a real QR code */}
              <rect x="10" y="10" width="30" height="30" fill="#000000" />
              <rect x="15" y="15" width="20" height="20" fill="#ffffff" />
              <rect x="20" y="20" width="10" height="10" fill="#000000" />
            </g>
          </svg>
        </div>
        
        <div className="room-code-display">{roomId}</div>
        
        <div className="join-instructions">
          <p>Scan the QR code or enter the room code to join as a viewer</p>
          <p>Visit: <strong>http://localhost:3000/viewer?room={roomId}</strong></p>
        </div>
      </div>
    </div>
  );

  const renderQuestion = () => (
    <div className="question-container">
      <div className="round-header">
        <h2>Ronde {currentRound}</h2>
      </div>
      
      <div className="question-header">
        <h3>Vraag {currentQuestion?.questionNumber || 1} van {currentQuestion?.totalQuestions || 5}</h3>
      </div>
      
      <div className="question-content">
        <h3 className="highlighted-question">{currentQuestion?.question}</h3>
        {currentQuestion?.image && (
          <div className="question-image">
            <img src={currentQuestion.image} alt="Question" />
          </div>
        )}
      </div>
      
      <div className="answers-grid enhanced">
        {currentQuestion?.answers.map((answer, index) => (
          <div key={index} className="answer-option enhanced">
            <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
            <span className="answer-text">{answer}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="results-container">
      <div className="round-header">
        <h2>Ronde {currentRound} {isRoundComplete ? '- Voltooid!' : ''}</h2>
      </div>
      
      <div className="correct-answer">
        <h3>Juiste Antwoord: {roundResults?.answers?.correct}</h3>
      </div>
      
      <div className="team-scores">
        <h3>Tussenstand</h3>
        <div className="scores-grid">
          {roundResults?.scores
            .filter(team => {
              // Find the team in teams object to check if it has players
              const teamData = teams[team.name];
              return teamData && teamData.players && teamData.players.length > 0;
            })
            .map((team, index) => (
              <div key={index} className={`team-score ${team.name.toLowerCase().replace(' ', '-')}`}>
                <h4>{team.name}</h4>
                <p className="score">{team.score}</p>
              </div>
            ))}
          {/* Viewer Team Score - Always show this */}
          <div className="team-score viewers-team">
            <h4>Viewers Team</h4>
            <p className="score">{viewerTeamScore}</p>
          </div>
        </div>
      </div>
      
      {isRoundComplete && (
        <div className="round-complete-message">
          <h3>Ronde {currentRound - 1} is voltooid!</h3>
          <p>Wachten op de admin om ronde {currentRound} te starten...</p>
        </div>
      )}
      
      <div className="player-answers">
        <div className="correct-players">
          <h3>Juiste Antwoorden</h3>
          <ul>
            {roundResults?.answers?.correctAnswers?.map((answer, index) => (
              <li key={index}>{answer.playerName} ({answer.team})</li>
            ))}
          </ul>
        </div>
        
        <div className="incorrect-players">
          <h3>Onjuiste Antwoorden</h3>
          <ul>
            {roundResults?.answers?.incorrectAnswers?.map((answer, index) => (
              <li key={index}>{answer.playerName} ({answer.team})</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div className="game-over">
      <h2>Quiz Voltooid!</h2>
      <div className="winner">
        <h3>{winner} Wint!</h3>
      </div>
      
      <div className="final-scores">
        <h3>Eindstand</h3>
        <div className="scores-grid">
          {roundResults?.scores
            .filter(team => {
              // Find the team in teams object to check if it has players
              const teamData = teams[team.name];
              return teamData && teamData.players && teamData.players.length > 0;
            })
            .map((team, index) => (
              <div key={index} className={`team-score ${team.name.toLowerCase().replace(' ', '-')}`}>
                <h4>{team.name}</h4>
                <p className="score">{team.score}</p>
              </div>
            ))}
          {/* Viewer Team Score - Always show this */}
          <div className="team-score viewers-team">
            <h4>Viewers Team</h4>
            <p className="score">{viewerTeamScore}</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Function to render teams on the left side
  const renderLeftTeams = () => {
    // Get the first half of teams with players
    const teamsWithPlayers = Object.entries(teams)
      .filter(([_, teamData]) => teamData.players && teamData.players.length > 0);
    
    const leftTeams = teamsWithPlayers.slice(0, Math.ceil(teamsWithPlayers.length / 2));
    
    return (
      <div className="teams-sidebar left-sidebar">
        <h3>Teams</h3>
        {leftTeams.map(([teamName, teamData]) => (
          <div key={teamName} className={`team-score ${teamName.toLowerCase().replace(' ', '-')}`}>
            <h4>{teamName}</h4>
            <p className="score">{teamData.score || 0}</p>
          </div>
        ))}
      </div>
    );
  };
  
  // Function to render teams on the right side
  const renderRightTeams = () => {
    // Get the second half of teams with players
    const teamsWithPlayers = Object.entries(teams)
      .filter(([_, teamData]) => teamData.players && teamData.players.length > 0);
    
    const rightTeams = teamsWithPlayers.slice(Math.ceil(teamsWithPlayers.length / 2));
    
    // Always add viewer team to the right sidebar
    return (
      <div className="teams-sidebar right-sidebar">
        <h3>Teams</h3>
        {rightTeams.map(([teamName, teamData]) => (
          <div key={teamName} className={`team-score ${teamName.toLowerCase().replace(' ', '-')}`}>
            <h4>{teamName}</h4>
            <p className="score">{teamData.score || 0}</p>
          </div>
        ))}
        <div className="team-score viewers-team">
          <h4>Viewers Team</h4>
          <p className="score">{viewerTeamScore}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="scoreboard">
      <header>
        <h1>Quiz Scorebord</h1>
        <div className="room-info">Kamer: {roomId}</div>
      </header>
      
      <main>
        {/* Left sidebar with teams - always display */}
        {renderLeftTeams()}
        
        {/* Central content */}
        <div className="central-content">
          {waitingForAdmin && renderWaitingScreen()}
          {gameStarted && !showingResults && !gameOver && currentQuestion && renderQuestion()}
          {showingResults && !gameOver && renderResults()}
          {gameOver && renderGameOver()}
        </div>
        
        {/* Right sidebar with teams - always display */}
        {renderRightTeams()}
      </main>
    </div>
  );
};

export default Scoreboard;