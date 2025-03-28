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
      setTeams(teamsData);
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
    });
    
    newSocket.on('roundResults', (results) => {
      console.log('Round results received:', results);
      setRoundResults(results);
      setShowingResults(true);
    });
    
    newSocket.on('showResults', (data) => {
      console.log('Show results received:', data);
      // Handle showing intermediate results
    });
    
    newSocket.on('gameOver', (data) => {
      console.log('Game over received:', data);
      setGameOver(true);
      setWinner(data.winner);
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
      
      // Re-join the room to ensure we're still connected
      newSocket.emit('joinScoreboard', roomId);
    });
    
    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  const renderWaitingScreen = () => (
    <div className="waiting-screen">
      <h2>Waiting for admin to start the game</h2>
      <p>Room ID: {roomId}</p>
      {gameOver ? <p className="reset-message">Game has been reset. Waiting for admin to start a new game.</p> : null}
      <div className="teams-overview">
        {Object.entries(teams).map(([teamName, teamData]) => (
          <div key={teamName} className={`team-card ${teamName.toLowerCase().replace(' ', '-')}`}>
            <h3>{teamName}</h3>
            <p>{teamData.players.length} players</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderQuestion = () => (
    <div className="question-container">
      <div className="question-header">
        <h2>Question {currentQuestion?.questionNumber || 1} of {currentQuestion?.totalQuestions || 10}</h2>
      </div>
      
      <div className="question-content">
        <h3>{currentQuestion?.question}</h3>
        {currentQuestion?.image && (
          <div className="question-image">
            <img src={currentQuestion.image} alt="Question" />
          </div>
        )}
      </div>
      
      <div className="answers-grid">
        {currentQuestion?.answers.map((answer, index) => (
          <div key={index} className="answer-option">
            <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
            <span className="answer-text">{answer}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="results-container">
      <h2>Round Results</h2>
      
      <div className="correct-answer">
        <h3>Correct Answer: {roundResults?.answers?.correct}</h3>
      </div>
      
      <div className="team-scores">
        <h3>Team Scores</h3>
        <div className="scores-grid">
          {roundResults?.scores.map((team, index) => (
            <div key={index} className={`team-score ${team.name.toLowerCase().replace(' ', '-')}`}>
              <h4>{team.name}</h4>
              <p className="score">{team.score}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="player-answers">
        <div className="correct-players">
          <h3>Correct Answers</h3>
          <ul>
            {roundResults?.answers?.correctAnswers?.map((answer, index) => (
              <li key={index}>{answer.playerName} ({answer.team})</li>
            ))}
          </ul>
        </div>
        
        <div className="incorrect-players">
          <h3>Incorrect Answers</h3>
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
      <h2>Game Over!</h2>
      <div className="winner">
        <h3>{winner} Wins!</h3>
      </div>
      
      <div className="final-scores">
        <h3>Final Scores</h3>
        <div className="scores-grid">
          {roundResults?.scores.map((team, index) => (
            <div key={index} className={`team-score ${team.name.toLowerCase().replace(' ', '-')}`}>
              <h4>{team.name}</h4>
              <p className="score">{team.score}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="scoreboard">
      <header>
        <h1>Quiz Game Scoreboard</h1>
        <div className="room-info">Room: {roomId}</div>
      </header>
      
      <main>
        {waitingForAdmin && renderWaitingScreen()}
        {gameStarted && !showingResults && !gameOver && currentQuestion && renderQuestion()}
        {showingResults && !gameOver && renderResults()}
        {gameOver && renderGameOver()}
      </main>
    </div>
  );
};

export default Scoreboard;