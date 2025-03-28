const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const app = express();

const server = http.createServer(app);
app.use(cors());
// Update the CORS configuration to allow both origins
// Update the CORS configuration to allow connections from port 3001 too
const io = socketIo(server, {
   cors: {
     origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"],
     methods: ["GET", "POST"],
   },
});

const PORT = process.env.PORT || 5000;

const questions = [
  {
    question: "What is the capital of France?",
    image: "/images/paris.jpg", 
    answers: [
      { text: "Paris", correct: true },
      { text: "Berlin", correct: false },
      { text: "London", correct: false },
    ],
  },
  {
    question: "What is the chemical symbol for water?",
    image: "/images/Chemical.jpg", 
    answers: [
      { text: "H2O", correct: true },
      { text: "CO2", correct: false },
      { text: "NaCl", correct: false },
    ],
  },
  {
    question: "What is the largest planet in our solar system?",
    image: "/images/solarsystem.gif", 
    answers: [
      { text: "Mercury", correct: false },
      { text: "Venus", correct: false },
      { text: "Mars", correct: false },
      { text: "Jupiter", correct: true },
    ],
  },
  {
    question: "What is the chemical symbol for iron?",
    answers: [
      { text: "Fe", correct: true },
      { text: "Ag", correct: false },
      { text: "Au", correct: false },
    ],
  },
  {
    question: "Which famous scientist is known for the theory of evolution?",
    answers: [
      { text: "Galileo Galilei", correct: false },
      { text: "Isaac Newton", correct: false },
      { text: "Charles Darwin", correct: true },
    ],
  },
  {
    question: "In which country was the game of chess invented?",
    answers: [
      { text: "China", correct: false },
      { text: "India", correct: true },
      { text: "Egypt", correct: false },
    ],
  },

  {
    question: "Which gas is responsible for the Earth's ozone layer?",
    answers: [
      { text: "Oxygen", correct: false },
      { text: "Carbon Dioxide", correct: false },
      { text: "Nitrogen", correct: false },
      { text: "Ozone", correct: true },
    ],
  },
  {
    question: "Which planet is known as the Red Planet?",
    answers: [
      { text: "Mars", correct: true },
      { text: "Venus", correct: false },
      { text: "Jupiter", correct: false },
      { text: "Saturn", correct: false },
    ],
  },
  {
    question: "Which gas do plants use for photosynthesis?",
    answers: [
      { text: "Oxygen", correct: false },
      { text: "Carbon Dioxide", correct: true },
      { text: "Nitrogen", correct: false },
      { text: "Helium", correct: false },
    ],
  },

  {
    question: "What is the capital of Japan?",
    answers: [
      { text: "Beijing", correct: false },
      { text: "Tokyo", correct: true },
      { text: "Seoul", correct: false },
      { text: "Bangkok", correct: false },
    ],
  },
  {
    question:
      "Which famous scientist developed the theory of general relativity?",
    answers: [
      { text: "Isaac Newton", correct: false },
      { text: "Albert Einstein", correct: true },
      { text: "Nikola Tesla", correct: false },
      { text: "Marie Curie", correct: false },
    ],
  },
  {
    question: "Which country is known as the 'Land of the Rising Sun'?",
    answers: [
      { text: "China", correct: false },
      { text: "Japan", correct: true },
      { text: "India", correct: false },
      { text: "Egypt", correct: false },
    ],
  },

  {
    question: "What is the chemical symbol for gold?",
    answers: [
      { text: "Ag", correct: false },
      { text: "Au", correct: true },
      { text: "Fe", correct: false },
      { text: "Hg", correct: false },
    ],
  },
  {
    question: "Which planet is known as the 'Morning Star' or 'Evening Star'?",
    answers: [
      { text: "Mars", correct: false },
      { text: "Venus", correct: true },
      { text: "Mercury", correct: false },
      { text: "Neptune", correct: false },
    ],
  },

  {
    question: "What is the smallest prime number?",
    answers: [
      { text: "1", correct: false },
      { text: "2", correct: true },
      { text: "3", correct: false },
      { text: "5", correct: false },
    ],
  },
  {
    question: "Which country is known as the 'Land of the Rising Sun'?",
    answers: [
      { text: "China", correct: false },
      { text: "South Korea", correct: false },
      { text: "Japan", correct: true },
      { text: "Thailand", correct: false },
    ],
  },
  {
    question: "What is the largest ocean on Earth?",
    answers: [
      { text: "Atlantic Ocean", correct: false },
      { text: "Indian Ocean", correct: false },
      { text: "Arctic Ocean", correct: false },
      { text: "Pacific Ocean", correct: true },
    ],
  },
  {
    question: "Which element has the chemical symbol 'K'?",
    answers: [
      { text: "Krypton", correct: false },
      { text: "Potassium", correct: true },
      { text: "Kryptonite", correct: false },
      { text: "Kallium", correct: false },
    ],
  },
  {
    question: "What is the capital city of India?",
    answers: [
      { text: "Mumbai", correct: false },
      { text: "New Delhi", correct: true },
      { text: "Bangalore", correct: false },
      { text: "Kolkata", correct: false },
    ],
  },
  {
    question: "True or False: The Earth is flat?",
    type: "truefalse",
    answers: [
      { text: "True", correct: false },
      { text: "False", correct: true }
    ]
  },
  {
    question: "True or False: Water boils at 100 degrees Celsius at sea level?",
    type: "truefalse",
    answers: [
      { text: "True", correct: true },
      { text: "False", correct: false }
    ]
  },
  {
    question: "True or False: The Great Wall of China is visible from space?",
    type: "truefalse",
    answers: [
      { text: "True", correct: false },
      { text: "False", correct: true }
    ]
  },
  {
    question: "True or False: Humans can see infrared light?",
    type: "truefalse",
    answers: [
      { text: "True", correct: false },
      { text: "False", correct: true }
    ]
  }
];

const TEAMS = [
  'Red Team', 'Orange Team', 'Yellow Team', 'Darkyellow Team', 
  'Pink Team', 'Lavender Team', 'Purple Team', 'Turqoise Team', 
  'Lightblue Team', 'Blue Team'
];

const rooms = {};

function getTotalPlayers(room) {
  return Object.values(rooms[room].teams)
    .reduce((sum, team) => sum + team.players.length, 0);
}

function initializeRoom() {
  return {
    teams: TEAMS.reduce((acc, teamName) => {
      acc[teamName] = { score: 0, players: [], powerups: {
        "50/50": 1,
        "doublePoints": 1,
        "skipQuestion": 1,
        "extraTime": 1
      } };
      return acc;
    }, {}),
    currentQuestion: null,
    correctAnswer: null,
    questionTimeout: null,
    shouldAskNewQuestion: true,
    answers: new Map(),
    usedQuestions: new Set(), // Track used questions
    powerupsEnabled: false, // Power-ups start disabled by default
  };
}

// Add these function definitions before they're used
function handleAllAnswersSubmitted(room) {
  try {
    if (!rooms[room]) return;
    
    const gameRoom = rooms[room];
    clearTimeout(gameRoom.questionTimeout);

    // Step 1: Organize answers by team
    const teamAnswers = {};
    
    // Initialize teamAnswers with empty arrays for each team
    Object.keys(gameRoom.teams).forEach(teamName => {
      teamAnswers[teamName] = [];
    });
    
    // Group answers by team
    Array.from(gameRoom.answers.values()).forEach(answer => {
      if (teamAnswers[answer.team]) {
        teamAnswers[answer.team].push(answer);
      }
    });
    
    // Step 2: Determine majority answer for each team
    const teamMajorityAnswers = {};
    const teamResults = {};
    
    Object.entries(teamAnswers).forEach(([teamName, answers]) => {
      // Skip teams with no players/answers
      if (answers.length === 0) return;
      
      // Count votes for each answer
      const answerCounts = {};
      answers.forEach(answer => {
        const { answerIndex } = answer;
        answerCounts[answerIndex] = (answerCounts[answerIndex] || 0) + 1;
      });
      
      // Find the most voted answer
      let majorityIndex = null;
      let maxVotes = 0;
      
      Object.entries(answerCounts).forEach(([index, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          majorityIndex = parseInt(index);
        }
      });
      
      // Handle edge case: ties go to the first answer in the list (deterministic)
      teamMajorityAnswers[teamName] = majorityIndex;
      
      // Determine if team's answer is correct and award points
      const isCorrect = majorityIndex === gameRoom.correctAnswer;
      teamResults[teamName] = {
        majorityIndex,
        isCorrect,
        totalAnswers: answers.length,
        answerDistribution: answerCounts
      };
      
      // Award points if the team's majority answer is correct
      if (isCorrect) {
        const pointsToAdd = gameRoom.teams[teamName].doublePointsActive ? 2 : 1;
        gameRoom.teams[teamName].score += pointsToAdd;
      }
    });
    
    // Get teams with scores
    const teamScores = Object.entries(gameRoom.teams)
      .map(([name, data]) => ({
        name,
        score: data.score,
        players: data.players.map(p => ({
          name: p.name,
          id: p.id,
          score: data.score / data.players.length // Distribute team score evenly for display
        }))
      }))
      .sort((a, b) => b.score - a.score);

    // Collect answers information for the results display
    const correctAnswer = gameRoom.currentQuestion.answers[gameRoom.correctAnswer].text;
    
    // Create a mapping of which teams got it right vs wrong
    const correctTeams = [];
    const incorrectTeams = [];
    
    Object.entries(teamResults).forEach(([teamName, result]) => {
      const answerText = gameRoom.currentQuestion.answers[result.majorityIndex]?.text || "No answer";
      const teamInfo = {
        team: teamName,
        majorityAnswer: answerText,
        distribution: result.answerDistribution,
        players: gameRoom.teams[teamName].players.map(p => p.name)
      };
      
      if (result.isCorrect) {
        correctTeams.push(teamInfo);
      } else {
        incorrectTeams.push(teamInfo);
      }
    });

    // Store last answers for scoreboard that joins later
    gameRoom.lastAnswers = {
      correct: correctAnswer,
      correctTeams,
      incorrectTeams,
      individualAnswers: Array.from(gameRoom.answers.values()),
      teamVotes: teamResults
    };

    io.to(room).emit("roundResults", {
      scores: teamScores,
      answers: gameRoom.lastAnswers
    });

    const winningTeam = teamScores[0];
    if (winningTeam.score >= 5) {
      io.to(room).emit("gameOver", { winner: winningTeam.name });
      delete rooms[room];
    } else {
      askNewQuestion(room);
    }
  } catch (error) {
    console.error('Error in handleAllAnswersSubmitted:', error);
  }
}

function askNewQuestion(room) {
  try {
    if (!rooms[room]) return;
    
    // Reset double points status for all teams
    Object.values(rooms[room].teams).forEach(team => {
      team.doublePointsActive = false;
    });
    
    const totalPlayers = getTotalPlayers(room);
    if (totalPlayers === 0) {
      clearTimeout(rooms[room]?.questionTimeout);
      delete rooms[room];
      return;
    }

    const resultScreenDuration = 5000; // 5 seconds

    const sortedTeams = Object.entries(rooms[room].teams)
      .map(([name, data]) => ({
        name,
        score: data.score
      }))
      .sort((a, b) => b.score - a.score);

    io.to(room).emit("showResults", {
      scores: sortedTeams,
      nextQuestionIn: resultScreenDuration / 1000,
      duration: resultScreenDuration
    });

    setTimeout(() => {
      // Add a check to ensure the room exists before accessing its properties
      if (rooms[room]) {
        const availableIndices = [...Array(questions.length).keys()].filter(
          (index) => !rooms[room].usedQuestions.has(index)
        );
        
        if (availableIndices.length === 0) {
          rooms[room].usedQuestions.clear();
          availableIndices.push(...[...Array(questions.length).keys()]);
        }

        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        const actualIndex = availableIndices[randomIndex];
        const question = questions[actualIndex];

        rooms[room].usedQuestions.add(actualIndex);
        rooms[room].currentQuestion = question;
        rooms[room].correctAnswer = question.answers.findIndex(
          (answer) => answer.correct
        );
        rooms[room].answers = new Map();
        rooms[room].questionNumber = (rooms[room].questionNumber || 0) + 1;

        const startTime = Date.now();
        io.to(room).emit("newQuestion", {
          question: question.question,
          image: question.image,
          answers: question.answers.map((answer) => answer.text),
          duration: null, // Remove duration to disable timer
          startTime: startTime,
          timer: null, // Remove timer
          questionNumber: rooms[room].questionNumber,
          totalQuestions: 10 // Set how many questions before game ends
        });
      }
    }, resultScreenDuration);
  } catch (error) {
    console.error('Error in askNewQuestion:', error);
  }
}

// Now continue with your socket connection code
io.on("connection", (socket) => {
  console.log("A user connected");
  
  // Place all socket event handlers inside this block

  socket.on('checkRoom', (roomId, callback) => {
    // Check if the room exists
    const roomExists = rooms[roomId] !== undefined;
    callback(roomExists);
  });

  socket.on('createRoom', (roomId) => {
    // Create a new room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = initializeRoom();
      console.log(`Admin created room: ${roomId}`);
    }
    
    // Join the room
    socket.join(roomId);
    
    // Add the admin to a special admin list if needed
    if (!rooms[roomId].admins) {
      rooms[roomId].admins = new Set();
    }
    rooms[roomId].admins.add(socket.id);
  });

  // Add after the socket.on("joinRoom"...) event handler
  
  socket.on("joinRoom", (room, name, team) => {
    try {
      socket.join(room);
      if (!rooms[room]) {
        rooms[room] = initializeRoom();
      }
  
      // Validate team exists
      if (!rooms[room].teams[team]) {
        console.error(`Invalid team: ${team}`);
        return;
      }
  
      // Add player to team
      rooms[room].teams[team].players.push({ id: socket.id, name });
      
      // Emit updated team players to all clients in the room
      io.to(room).emit("teamPlayersUpdate", rooms[room].teams);
      
      io.to(room).emit("message", `${name} has joined ${team}!`);
  
      // Don't start game automatically anymore - wait for admin to start it
      // We'll keep track of players in the waiting room instead
    } catch (error) {
      console.error('Error in joinRoom:', error);
    }
  });
  
  // Add a new event handler for starting the game
  socket.on("startGame", (room) => {
    try {
      if (!rooms[room]) return;
      
      // Notify all clients that the game has started
      io.to(room).emit("gameStarted");
      
      // Start the first question
      askNewQuestion(room);
    } catch (error) {
      console.error('Error in startGame:', error);
    }
  });
  
  socket.on("quitGame", (room) => {
    try {
      if (!rooms[room]) {
        socket.leave(room);
        return;
      }
  
      let playerLeft = false;
      let playerName = "";
      
      // Find which team the player is in and remove them
      for (const teamName of Object.keys(rooms[room].teams)) {
        const team = rooms[room].teams[teamName];
        const player = team.players.find(p => p.id === socket.id);
        
        if (player) {
          playerName = player.name;
          team.players = team.players.filter(p => p.id !== socket.id);
          playerLeft = true;
        }
      }
      
      if (playerLeft) {
        io.to(room).emit("playerLeft", `${playerName} has left the game`);
        io.to(room).emit("teamPlayersUpdate", rooms[room].teams);
      }
      
      // Clear any existing timeouts for the room
      if (rooms[room].questionTimeout) {
        clearTimeout(rooms[room].questionTimeout);
      }
      
      // If room is empty, clean it up
      if (getTotalPlayers(room) === 0) {
        delete rooms[room];
      }
      
      socket.leave(room);
    } catch (error) {
      console.error('Error in quitGame:', error);
      socket.leave(room);
    }
  });
  
  socket.on("adminNextQuestion", (room) => {
    if (rooms[room]) {
      // Clear any existing timeout
      if (rooms[room].questionTimeout) {
        clearTimeout(rooms[room].questionTimeout);
      }
      handleAllAnswersSubmitted(room);
    }
  });

  // Add this new event handler inside the io.on("connection", (socket) => {...}) block
  
  socket.on('joinAdminPanel', (roomId) => {
    socket.join(roomId);
    console.log(`Admin/Scoreboard joined room: ${roomId}`);
    
    // Send current state to the admin panel or scoreboard
    const room = rooms[roomId];
    if (room) {
      // Send team players data
      socket.emit('teamPlayersUpdate', room.teams);
      
      // If game is already in progress, send current question and game state
      if (room.currentQuestion) {
        // Send game started event to ensure proper state
        socket.emit('gameStarted');
        
        socket.emit('newQuestion', {
          question: room.currentQuestion.question,
          answers: room.currentQuestion.answers.map(a => a.text),
          image: room.currentQuestion.image,
          questionNumber: room.questionNumber || 1,
          totalQuestions: 10
        });
        
        // Send current scores
        const teamScores = Object.entries(room.teams)
          .map(([name, data]) => ({
            name,
            score: data.score
          }))
          .sort((a, b) => b.score - a.score);
        
        socket.emit('roundResults', {
          scores: teamScores,
          answers: room.lastAnswers
        });
      }
    } else {
      // Create a new room if it doesn't exist
      rooms[roomId] = initializeRoom();
      socket.emit('teamPlayersUpdate', rooms[roomId].teams);
    }
  });

  // Add a special handler for scoreboard connection
  socket.on('joinScoreboard', (roomId) => {
    socket.join(roomId);
    console.log(`Scoreboard joined room: ${roomId}`);
    
    // Create room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = initializeRoom();
    }
    
    // Send current state to the scoreboard
    socket.emit('teamPlayersUpdate', rooms[roomId].teams);
    
    // If game is in progress, send game state
    if (rooms[roomId].currentQuestion) {
      socket.emit('gameStarted');
      
      socket.emit('newQuestion', {
        question: rooms[roomId].currentQuestion.question,
        answers: rooms[roomId].currentQuestion.answers.map(a => a.text),
        image: rooms[roomId].currentQuestion.image,
        questionNumber: rooms[roomId].questionNumber || 1,
        totalQuestions: 10
      });
    }
  });

  // Admin toggles power-ups for the entire game
  socket.on("adminTogglePowerups", (room, enabled) => {
    try {
      if (!rooms[room]) return;
      
      rooms[room].powerupsEnabled = enabled;
      io.to(room).emit("powerupsStatus", {
        enabled: rooms[room].powerupsEnabled
      });
      
      io.to(room).emit("message", `Power-ups have been ${enabled ? 'enabled' : 'disabled'} by the admin`);
    } catch (error) {
      console.error('Error in adminTogglePowerups:', error);
    }
  });

  // Power-ups handlers
  socket.on("usePowerup", (room, powerupType) => {
    try {
      if (!rooms[room] || !rooms[room].powerupsEnabled || !rooms[room].currentQuestion) return;
      
      // Find which team the player is in
      let playerTeam = null;
      
      for (const [teamName, team] of Object.entries(rooms[room].teams)) {
        const player = team.players.find(p => p.id === socket.id);
        if (player) {
          playerTeam = teamName;
          break;
        }
      }
      
      if (!playerTeam) return;
      
      // Check if team has this powerup available
      if (!rooms[room].teams[playerTeam].powerups[powerupType] || 
          rooms[room].teams[playerTeam].powerups[powerupType] <= 0) {
        socket.emit("message", `Your team doesn't have any ${powerupType} power-ups left!`);
        return;
      }
      
      // Decrement the powerup count
      rooms[room].teams[playerTeam].powerups[powerupType]--;
      
      // Handle different powerup types
      switch (powerupType) {
        case "50/50":
          // Find incorrect answers
          const incorrectIndices = rooms[room].currentQuestion.answers
            .map((answer, index) => ({ index, correct: answer.correct }))
            .filter(answer => !answer.correct)
            .map(answer => answer.index);
          
          // Randomly remove half of the incorrect answers (keep at least one)
          const toRemove = Math.floor(incorrectIndices.length / 2);
          const shuffled = [...incorrectIndices].sort(() => 0.5 - Math.random());
          const indicesToRemove = shuffled.slice(0, toRemove);
          
          // Send the indices to remove to the team
          io.to(room).emit("fiftyFifty", {
            team: playerTeam,
            indicesToRemove: indicesToRemove
          });
          break;
          
        case "doublePoints":
          // Mark that this team gets double points for this question
          rooms[room].teams[playerTeam].doublePointsActive = true;
          io.to(room).emit("doublePointsActivated", {
            team: playerTeam
          });
          break;
          
        case "skipQuestion":
          // Skip to the next question immediately
          if (rooms[room].questionTimeout) {
            clearTimeout(rooms[room].questionTimeout);
          }
          io.to(room).emit("questionSkipped", {
            team: playerTeam
          });
          handleAllAnswersSubmitted(room);
          break;
          
        case "extraTime":
          // Give extra time (not implemented since there's no timer in current code)
          io.to(room).emit("extraTimeAdded", {
            team: playerTeam,
            seconds: 10
          });
          break;
      }
      
      // Update all clients with the new powerup counts
      io.to(room).emit("powerupsUpdate", {
        teams: Object.entries(rooms[room].teams).reduce((acc, [name, data]) => {
          acc[name] = { powerups: data.powerups };
          return acc;
        }, {})
      });
      
    } catch (error) {
      console.error('Error in usePowerup:', error);
    }
  });

  // Fix the submitAnswer handler - keep only one version
  socket.on("submitAnswer", (room, answerIndex) => {
    try {
      if (!rooms[room] || !rooms[room].currentQuestion) return;
      
      // Find which team the player is in
      let playerTeam = null;
      let playerName = null;
      
      for (const [teamName, team] of Object.entries(rooms[room].teams)) {
        const player = team.players.find(p => p.id === socket.id);
        if (player) {
          playerTeam = teamName;
          playerName = player.name;
          break;
        }
      }
      
      if (!playerTeam) return;
      
      // Check if player already answered
      if (rooms[room].answers.has(socket.id)) return;
      
      // Record the answer (don't evaluate correctness or award points yet)
      rooms[room].answers.set(socket.id, {
        playerId: socket.id,
        playerName,
        team: playerTeam,
        answerIndex,
        isCorrect: answerIndex === rooms[room].correctAnswer // Still record if it's correct for reference
      });
      
      // Notify everyone that a player has answered (without revealing correctness)
      io.to(room).emit("playerAnswered", {
        playerName,
        team: playerTeam
      });
      
      // Check if all players have answered
      const totalPlayers = getTotalPlayers(room);
      const totalAnswers = rooms[room].answers.size;
      
      if (totalAnswers >= totalPlayers) {
        handleAllAnswersSubmitted(room);
      }
    } catch (error) {
      console.error('Error in submitAnswer:', error);
    }
  });
  
  // Add the resetGame handler inside the connection block - keep only one version
  socket.on('resetGame', (room) => {
    try {
      if (!rooms[room]) return;
      
      // Reset the room to initial state but keep players
      const players = {};
      Object.entries(rooms[room].teams).forEach(([teamName, teamData]) => {
        players[teamName] = {
          players: teamData.players,
          score: 0
        };
      });
      
      rooms[room] = initializeRoom();
      
      // Restore players
      Object.entries(players).forEach(([teamName, teamData]) => {
        rooms[room].teams[teamName].players = teamData.players;
      });
      
      // Notify all clients that the game has been reset
      io.to(room).emit('gameReset');
      io.to(room).emit('teamPlayersUpdate', rooms[room].teams);
    } catch (error) {
      console.error('Error in resetGame:', error);
    }
  });
}); // End of io.on("connection") block

// Remove these duplicate handlers that are outside the connection block
// socket.on('checkRoom', (roomId, callback) => { ... });
// socket.on('createRoom', (roomId) => { ... });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

