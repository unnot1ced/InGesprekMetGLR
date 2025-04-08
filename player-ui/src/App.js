import React, { useState } from 'react';

// Add at the top with other state variables
const [topThree, setTopThree] = useState([]);

// Find and update the socket.on("gameOver") event handler
socket.on("gameOver", (data) => {
  setWinner(data.winner);
  setTopThree(data.topThree || []);
  setGameOver(true);
  setShowRoundScreen(false);
}); 

// Update the game over screen in the JSX
{gameOver && (
  <div className="game-over">
    <h1>Game Over!</h1>
    <h2>Winner: {winner}</h2>
    
    {topThree.length > 0 && (
      <div className="podium">
        <h3>Top Teams:</h3>
        <div className="top-three">
          {topThree.map((team, index) => (
            <div key={team.name} className={`podium-position position-${index + 1}`}>
              <div className="position-number">{index + 1}</div>
              <div className="team-name">{team.name}</div>
              <div className="team-score">{team.score} points</div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)} 