// Add this to your QuizGame component's socket event handlers

newSocket.on('gameReset', () => {
  console.log('Game reset received');
  // Reset the game state without disconnecting
  setGameStarted(false);
  setWaitingForAdmin(true);
  setCurrentQuestion(null);
  setSelectedAnswer(null);
  setHasAnswered(false);
  setShowingResults(false);
  setRoundResults(null);
  setGameOver(false);
  setWinner(null);
  
  // Re-join the room to ensure we're still connected
  if (playerName && teamName && roomId) {
    newSocket.emit('joinRoom', roomId, playerName, teamName);
  }
});