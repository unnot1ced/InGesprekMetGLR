const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const app = express();

const server = http.createServer(app);
app.use(cors());

// Update CORS to allow connections from the SD-LAB domain
const io = socketIo(server, {
   cors: {
     origin: ["https://ingesprekmet.stu.sd-lab.nl", "https://web03.sd-lab.nl"],
     methods: ["GET", "POST"],
     credentials: true
   },
});

// Use environment variable for port or default to 3000
const PORT = process.env.PORT || 3000;

// Serve static files from materials folder
app.use('/materials', express.static(path.join(__dirname, '../materials'), {
  setHeaders: (res, filePath) => {
    // Set appropriate content types for media files
    if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
    // Add caching headers to improve performance
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  }
}));

// Add specific route for serving images
app.use('/images', express.static(path.join(__dirname, '../images'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.JPG')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png') || filePath.endsWith('.PNG')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}));

// Add a specific route just for the KOFFIE folder to handle case sensitivity
app.use('/images/KOFFIE', express.static(path.join(__dirname, '../images/KOFFIE'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.JPG')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    res.setHeader('Cache-Control', 'public, max-age=0'); // No caching for these images
  }
}));

// Default questions that will be used if no custom questions are found
const defaultQuestions = [
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

// Function to load questions from external files
function loadCustomQuestions() {
  try {
    const questionsFilePath = path.join(__dirname, '../materials/questions/questions.json');
    
    if (fs.existsSync(questionsFilePath)) {
      const data = fs.readFileSync(questionsFilePath, 'utf8');
      const parsedData = JSON.parse(data);
      
      // Validate the loaded questions
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        console.log(`Loaded ${parsedData.length} custom questions from file`);
        // Sort questions by round and order
        return parsedData.sort((a, b) => {
          if (a.round !== b.round) {
            return a.round - b.round;
          }
          return (a.order || 0) - (b.order || 0);
        });
      }
    }
    
    // If no valid questions file is found, use the default questions
    console.log('Using default questions');
    return defaultQuestions;
  } catch (error) {
    console.error('Error loading custom questions:', error);
    return defaultQuestions;
  }
}

// Load questions when the server starts
const questions = loadCustomQuestions();

const TEAMS = ['Fotografie', 'Mediamanagement', 'Redactie', 'Software', 'AV', 'PET', 'Mediavormgeven', 'ICT & mediatechnologie', 'Sign', 'Mediamaker'];

const rooms = {};

function getTotalPlayers(room) {
  return Object.values(rooms[room].teams)
    .reduce((sum, team) => sum + team.players.length, 0);
}

function initializeRoom() {
  return {
    players: {},
    teams: TEAMS.reduce((acc, teamName) => {
      acc[teamName] = { score: 0, players: [] };
      return acc;
    }, {}),
    questionIndex: 0,
    scores: {},
    teamScores: {},
    answersSubmitted: 0,
    questionStats: {},
    timerDuration: 8,
    questionStartTime: null,
    currentRound: 1,
    viewers: {},
    viewerAnswers: {},
    viewerStats: {},
    currentQuestion: null,
    correctAnswer: null,
    questionTimeout: null,
    shouldAskNewQuestion: true,
    answers: new Map(),
    usedQuestions: new Set(),
    totalRounds: 1,
    roundQuestions: 0,
    questionsPerRound: 19,
    isActivityRound: true,
    activityInProgress: true,
    activityDescription: "Ballen gooien – punten worden handmatig ingevoerd.​",
    activityIndex: 0,
    roundUsedQuestions: { 1: new Set() },
    questionsAsked: 0,
    totalQuestions: 19,
    activityOptions: [
      "Ballen gooien – punten worden handmatig ingevoerd.​",
      "Wie eet als eerst het bord toekomsteten leeg. HANDMATIG PUNTEN INVOEREN VOOR DE EERSTE DRIE LEGE BORDEN. 3 voor eerste team, 2 voor tweede team, 1 voor derde team."
    ],
    currentActivityOption: 0
  };
}

// Add a new function to handle starting an activity round
function startActivityRound(room) {
  try {
    if (!rooms[room]) return;
    
    const gameRoom = rooms[room];
    gameRoom.isActivityRound = true;
    gameRoom.activityInProgress = true;
    gameRoom.roundQuestions = 0; // Reset the question counter for the round
    
    // Use the current activity option that was already set
    gameRoom.activityDescription = gameRoom.activityOptions[gameRoom.currentActivityOption];
    
    // Emit event to client with activity description
    io.to(room).emit("activityRoundStarting", {
      roundNumber: gameRoom.currentRound,
      totalRounds: gameRoom.totalRounds,
      description: gameRoom.activityDescription
    });
    
    // Also emit to the scoreboard
    io.to(room).emit("activityRoundForScoreboard", {
      roundNumber: gameRoom.currentRound,
      totalRounds: gameRoom.totalRounds,
      description: gameRoom.activityDescription
    });
  } catch (error) {
    console.error('Error in startActivityRound:', error);
  }
}

// Add these function definitions before they're used
function handleAllAnswersSubmitted(room) {
  try {
    if (!rooms[room]) return;
    
    const gameRoom = rooms[room];
    if (gameRoom.questionTimeout) {
      clearTimeout(gameRoom.questionTimeout);
    }

    // Get teams with scores
    const teamScores = Object.entries(gameRoom.teams)
      .map(([name, data]) => {
        // Calculate team score by summing up player scores
        return {
          name,
          score: data.score,
          players: data.players.map(p => ({
            name: p.name,
            id: p.id,
            score: data.score / data.players.length // Distribute team score evenly for display
          }))
        };
      })
      .sort((a, b) => b.score - a.score);

    // Collect answers and separate them by correct/incorrect
    const allAnswers = Array.from(gameRoom.answers.values());
    const correctAnswer = gameRoom.currentQuestion.answers ? 
                         gameRoom.currentQuestion.answers[gameRoom.correctAnswer]?.text : 
                         '';
    const correctAnswers = allAnswers.filter(a => a.isCorrect);
    const incorrectAnswers = allAnswers.filter(a => !a.isCorrect);

    // Store last answers for scoreboard that joins later
    gameRoom.lastAnswers = {
      correct: correctAnswer,
      correctAnswers,
      incorrectAnswers
    };

    // Increment the questions asked counter
    gameRoom.questionsAsked++;
    
    // Check if this was the last question
    const isLastQuestion = gameRoom.questionsAsked >= 19;
    
    io.to(room).emit("roundResults", {
      scores: teamScores,
      answers: gameRoom.lastAnswers,
      currentRound: gameRoom.currentRound,
      questionsAsked: gameRoom.questionsAsked,
      totalQuestions: gameRoom.totalQuestions,
      isRoundComplete: false,
      isLastQuestion: isLastQuestion
    });

    // If this was the last question, send the final game over event with top 3 teams
    if (isLastQuestion) {
      // Get top 3 teams (or fewer if there aren't 3 teams)
      const topThreeTeams = teamScores.slice(0, Math.min(3, teamScores.length));
      
      io.to(room).emit("gameOver", { 
        winner: teamScores[0].name,
        topThree: topThreeTeams
      });
      
      // Don't delete the room yet to allow viewing the final scores
    } else {
      // Wait for admin to go to next question
      gameRoom.shouldAskNewQuestion = true;
    }

    // Calculate viewer statistics
    gameRoom.viewerStats = calculateViewerStats(room);

    // Include viewer stats in the response
    io.to(room).emit("questionEnded", {
      stats: gameRoom.questionStats,
      scores: gameRoom.scores,
      teamScores: gameRoom.teamScores,
      viewerStats: gameRoom.viewerStats,
    });
  } catch (error) {
    console.error('Error in handleAllAnswersSubmitted:', error);
  }
}

function askNewQuestion(room) {
  try {
    if (!rooms[room]) return;
    
    const gameRoom = rooms[room];
    
    // Check if we've reached the end of the quiz (question 23)
    if (gameRoom.questionsAsked >= 23) {
      // Game is over, show final results with top 3 teams
      const teamScores = Object.entries(gameRoom.teams)
        .map(([name, data]) => ({
          name,
          score: data.score,
          players: data.players
        }))
        .sort((a, b) => b.score - a.score);
      
      // Get top 3 teams
      const topThree = teamScores.slice(0, Math.min(3, teamScores.length));
      
      console.log("Game over! Showing final results with top 3 teams:", topThree);
      
      // Send game over event to all clients
      io.to(room).emit("gameOver", {
        winner: teamScores[0]?.name || "No winner",
        topThree: topThree
      });
      
      return;
    }
    
    // First question should be ballen gooien activity
    if (gameRoom.questionsAsked === 0 && !gameRoom.isActivityRound) {
      gameRoom.currentActivityOption = 0; // Ballen gooien
      startActivityRound(room);
      return;
    }
    
    // After question 16, switch to toekomsteten activity
    if (gameRoom.questionsAsked === 16 && !gameRoom.isActivityRound) {
      gameRoom.currentActivityOption = 1; // Toekomsteten
      startActivityRound(room);
      return;
    }
    
    // If we're in an activity round, don't ask questions
    if (gameRoom.isActivityRound) {
      io.to(room).emit("activityRoundInProgress", {
        roundNumber: gameRoom.currentRound,
        description: gameRoom.activityDescription
      });
      return;
    }
    
    // Continue with normal question logic
    const totalPlayers = getTotalPlayers(room);
    if (totalPlayers === 0) {
      if (gameRoom.questionTimeout) {
        clearTimeout(gameRoom.questionTimeout);
      }
      delete rooms[room];
      return;
    }

    const sortedTeams = Object.entries(gameRoom.teams)
      .map(([name, data]) => ({
        name,
        score: data.score
      }))
      .sort((a, b) => b.score - a.score);

    // Reset answers for the new question
    gameRoom.answers = new Map();
    
    // Reset team answered state
    Object.keys(gameRoom.teams).forEach(teamName => {
      gameRoom.teams[teamName].hasAnswered = false;
    });
    
    // Find a question that hasn't been used yet in this round
    let questionToUse = null;
    let questionIndex = -1;
    
    // Initialize the set for the current round if it doesn't exist
    if (!gameRoom.roundUsedQuestions[1]) {
      gameRoom.roundUsedQuestions[1] = new Set();
    }
    
    // Get questions for the current round
    const roundQuestions = questions.filter(q => !gameRoom.roundUsedQuestions[1].has(q.order));
    
    if (roundQuestions.length > 0) {
      // Find an unused question
      for (let i = 0; i < roundQuestions.length; i++) {
        // Get questions ordered by their "order" field
        questionIndex = roundQuestions[i].order;
        if (!gameRoom.roundUsedQuestions[1].has(questionIndex)) {
          questionToUse = roundQuestions[i];
          break;
        }
      }
      
      // If no unused question was found, reset and use the first one
      if (!questionToUse && roundQuestions.length > 0) {
        gameRoom.roundUsedQuestions[1].clear();
        questionToUse = roundQuestions[0];
        questionIndex = questionToUse.order;
      }
      
      if (questionToUse) {
        // Mark as used
        gameRoom.roundUsedQuestions[1].add(questionIndex);
        gameRoom.currentQuestion = questionToUse;
        
        // Check if answers array exists and then find the correct one
        if (questionToUse.answers && Array.isArray(questionToUse.answers)) {
          gameRoom.correctAnswer = questionToUse.answers.findIndex(answer => answer.correct);
        } else {
          // This might be an activity question without answers
          gameRoom.correctAnswer = -1;
        }
      }
    } else {
      // Fallback to default questions if no specific round questions
      console.log(`No questions found. Using default.`);
      
      // Use any available questions
      const availableIndices = [...Array(questions.length).keys()].filter(
        idx => !gameRoom.usedQuestions.has(idx)
      );
      
      if (availableIndices.length === 0) {
        // If all questions have been used, reset
        gameRoom.usedQuestions.clear();
        // Now all indices are available
        questionIndex = 0;
        questionToUse = questions[0];
      } else {
        // Use a random available question
        questionIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        questionToUse = questions[questionIndex];
      }
      
      // Mark as used
      gameRoom.usedQuestions.add(questionIndex);
      gameRoom.currentQuestion = questionToUse;
      
      // Check if answers array exists and then find the correct one
      if (questionToUse.answers && Array.isArray(questionToUse.answers)) {
        gameRoom.correctAnswer = questionToUse.answers.findIndex(answer => answer.correct);
      } else {
        // This might be an activity question without answers
        gameRoom.correctAnswer = -1;
      }
    }
    
    gameRoom.answers = new Map();
    gameRoom.questionNumber = (gameRoom.questionNumber || 0) + 1;

    // Set up the timer
    const questionDuration = gameRoom.timerDuration * 1000; // Convert seconds to milliseconds
    gameRoom.questionStartTime = Date.now();
    gameRoom.questionDuration = questionDuration;

    io.to(room).emit("newQuestion", {
      question: gameRoom.currentQuestion.question,
      image: gameRoom.currentQuestion.image,
      image1: gameRoom.currentQuestion.image1,
      image2: gameRoom.currentQuestion.image2,
      video: gameRoom.currentQuestion.video,
      type: gameRoom.currentQuestion.type || "multiple_choice",
      answers: gameRoom.currentQuestion.answers ? 
              gameRoom.currentQuestion.answers.map((answer) => answer.text) : 
              [],
      questionNumber: gameRoom.questionNumber,
      totalQuestions: gameRoom.questionsPerRound,
      currentRound: gameRoom.currentRound,
      totalRounds: gameRoom.totalRounds,
      duration: gameRoom.timerDuration // Send duration in seconds to clients
    });
    
    // Set a timeout to automatically proceed after time is up
    if (gameRoom.questionTimeout) {
      clearTimeout(gameRoom.questionTimeout);
    }
    
    gameRoom.questionTimeout = setTimeout(() => {
      console.log(`Time's up for question in room ${room}`);
      // Only proceed if we haven't already moved on
      if (rooms[room] && rooms[room].currentQuestion === gameRoom.currentQuestion) {
        io.to(room).emit("timeUp");
        handleAllAnswersSubmitted(room);
      }
    }, questionDuration);
    
    // Start sending timer updates to clients
    let timeRemaining = questionDuration;
    const timerInterval = 1000; // Update every second
    
    const timerIntervalId = setInterval(() => {
      timeRemaining -= timerInterval;
      
      // Only send updates if the room and question still exist
      if (rooms[room] && rooms[room].currentQuestion === gameRoom.currentQuestion && timeRemaining > 0) {
        io.to(room).emit("timerUpdate", { timeRemaining: timeRemaining });
      } else {
        clearInterval(timerIntervalId);
      }
    }, timerInterval);
    
    // Mark that we've asked a new question
    gameRoom.shouldAskNewQuestion = false;
  } catch (error) {
    console.error('Error in askNewQuestion:', error);
  }
}

// Now continue with your socket connection code
io.on("connection", (socket) => {
  console.log("New client connected");
  
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
      
      // Set the flag to indicate admin is starting the game/round
      rooms[room].adminStartedRound = true;
      
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
    try {
      if (!rooms[room]) return;
      
      // Just ask a new question
      askNewQuestion(room);
    } catch (error) {
      console.error('Error in adminNextQuestion:', error);
    }
  });

  // Presenter next question
  socket.on("nextQuestion", (room) => {
    try {
      if (!rooms[room]) return;
      
      // Allow admins to skip questions at any time, even during countdown
      // Clear any existing timers
      if (rooms[room].questionTimeout) {
        clearTimeout(rooms[room].questionTimeout);
      }
      
      // Reset game state for next question
      rooms[room].answers = new Map();
      rooms[room].answersSubmitted = 0;
      rooms[room].shouldAskNewQuestion = true;
      
      // If we were in the middle of a question, handle all answers submitted
      if (rooms[room].currentQuestion && !rooms[room].shouldAskNewQuestion) {
        handleAllAnswersSubmitted(room);
      } else {
        // Otherwise, just ask a new question
        askNewQuestion(room);
      }
    } catch (error) {
      console.error('Error in nextQuestion:', error);
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

  // Add a special handler for presenter connection
  socket.on('joinPresenter', (roomId) => {
    socket.join(roomId);
    console.log(`Presenter joined room: ${roomId}`);
    
    // Create room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = initializeRoom();
    }
    
    // Send current state to the presenter
    
    // If game is in progress, send game state
    if (rooms[roomId].currentQuestion) {
      socket.emit('gameStarted');
      
      socket.emit('newQuestion', {
        question: rooms[roomId].currentQuestion.question,
        answers: rooms[roomId].currentQuestion.answers,
        image: rooms[roomId].currentQuestion.image,
        questionNumber: rooms[roomId].questionIndex + 1,
        totalQuestions: rooms[roomId].questionsPerRound,
        currentRound: rooms[roomId].currentRound,
        totalRounds: rooms[roomId].totalRounds,
        timerDuration: rooms[roomId].timerDuration
      });
    }
    
    // Send viewer count
    if (rooms[roomId].viewers) {
      const viewerCount = Object.keys(rooms[roomId].viewers).length;
      socket.emit('viewerUpdate', viewerCount);
    }
    
    // Send round info if in round complete state
    if (rooms[roomId].roundQuestions >= rooms[roomId].questionsPerRound) {
      const teamScores = Object.entries(rooms[roomId].teams)
        .map(([name, data]) => ({
          name,
          score: data.score,
          players: data.players
        }))
        .sort((a, b) => b.score - a.score);
        
      socket.emit('roundComplete', {
        nextRound: rooms[roomId].currentRound,
        scores: teamScores
      });
    }
  });

  // Admin can manually add points to a team
  socket.on("adminAddPoints", (room, teamName, points) => {
    try {
      if (!rooms[room] || !rooms[room].teams[teamName]) return;
      
      // Add points to the team
      rooms[room].teams[teamName].score += points;
      
      // Get updated team scores
      const teamScores = Object.entries(rooms[room].teams)
        .map(([name, data]) => ({
          name,
          score: data.score
        }))
        .sort((a, b) => b.score - a.score);
      
      // Notify all clients of the updated scores
      io.to(room).emit("scoresUpdate", {
        scores: teamScores,
        teamUpdated: teamName,
        pointsAdded: points
      });
      
      io.to(room).emit("message", `Admin added ${points} points to ${teamName}`);
    } catch (error) {
      console.error('Error in adminAddPoints:', error);
    }
  });
  
  // Add handler for starting an activity round
  socket.on("startActivityRound", (room, activityType = 0) => {
    try {
      if (!rooms[room]) return;
      
      // Set the activity type based on the parameter
      rooms[room].currentActivityOption = activityType;
      
      // Start the activity round
      startActivityRound(room);
      
    } catch (error) {
      console.error('Error in startActivityRound:', error);
    }
  });
  
  // End activity round
  socket.on("endActivityRound", (room) => {
    try {
      if (!rooms[room]) return;
      
      const gameRoom = rooms[room];
      if (!gameRoom.isActivityRound) return;
      
      gameRoom.isActivityRound = false;
      gameRoom.activityInProgress = false;
      
      // Increment the questions asked counter to indicate we've completed the activity
      gameRoom.questionsAsked++;
      
      // Notify all clients that the activity round has ended
      io.to(room).emit("activityRoundEnded", {
        roundNumber: gameRoom.currentRound,
        questionsAsked: gameRoom.questionsAsked,
        totalQuestions: gameRoom.totalQuestions
      });
      
      // Get team scores for sending with the complete event
      const teamScores = Object.entries(gameRoom.teams)
        .map(([name, data]) => ({
          name,
          score: data.score
        }))
        .sort((a, b) => b.score - a.score);
      
      // Ready for the next question
      gameRoom.shouldAskNewQuestion = true;
      
      // If we've just finished the first activity (ballen gooien), continue with questions
      // If we've just finished the second activity (toekomsteten), continue with remaining questions
      askNewQuestion(room);
    } catch (error) {
      console.error('Error in endActivityRound:', error);
    }
  });
  
  // Admin can manually remove points from a team
  socket.on("adminRemovePoints", (room, teamName, points) => {
    try {
      if (!rooms[room] || !rooms[room].teams[teamName]) return;
      
      // Remove points from the team (ensure score doesn't go below 0)
      rooms[room].teams[teamName].score = Math.max(0, rooms[room].teams[teamName].score - points);
      
      // Get updated team scores
      const teamScores = Object.entries(rooms[room].teams)
        .map(([name, data]) => ({
          name,
          score: data.score
        }))
        .sort((a, b) => b.score - a.score);
      
      // Notify all clients of the updated scores
      io.to(room).emit("scoresUpdate", {
        scores: teamScores,
        teamUpdated: teamName,
        pointsRemoved: points
      });
      
      io.to(room).emit("message", `Admin removed ${points} points from ${teamName}`);
    } catch (error) {
      console.error('Error in adminRemovePoints:', error);
    }
  });
  
  // Admin manually starts the game
  socket.on("adminStartGame", (room) => {
    try {
      if (!rooms[room]) return;
      
      // Reset everything for a fresh start
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
        rooms[room].teams[teamName] = {
          ...rooms[room].teams[teamName],
          players: teamData.players,
          score: 0
        };
      });
      
      // Notify all clients that the game has started
      io.to(room).emit("gameStarted");
      
      // Immediately notify about the activity round
      io.to(room).emit("activityRoundStarting", {
        roundNumber: rooms[room].currentRound,
        totalRounds: rooms[room].totalRounds,
        description: rooms[room].activityDescription
      });
      
      // Also send a specific message to the scoreboard for displaying the activity
      io.to(room).emit("activityRoundForScoreboard", {
        roundNumber: rooms[room].currentRound,
        totalRounds: rooms[room].totalRounds,
        description: rooms[room].activityDescription
      });
    } catch (error) {
      console.error('Error in adminStartGame:', error);
    }
  });

  // Admin starts a new round
  socket.on("adminStartRound", (room) => {
    try {
      if (!rooms[room]) return;
      
      // Call directly to ask a new question without round logic
      rooms[room].adminStartedRound = true;
      askNewQuestion(room);
      
      // Notify all clients that a new question is starting
      io.to(room).emit("roundStarting", {
        roundNumber: rooms[room].currentRound,
        questionsAsked: rooms[room].questionsAsked,
        totalQuestions: rooms[room].totalQuestions
      });
    } catch (error) {
      console.error('Error in adminStartRound:', error);
    }
  });

  // Power-ups have been removed

  // Updated submitAnswer handler without power-ups
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
      
      const isCorrect = answerIndex === rooms[room].correctAnswer;
      
      // Add points to team if correct (no double points anymore)
      if (isCorrect) {
        rooms[room].teams[playerTeam].score += 1;
      }
      
      // Record the answer
      rooms[room].answers.set(socket.id, {
        playerId: socket.id,
        playerName,
        team: playerTeam,
        answerIndex,
        isCorrect,
        pointsEarned: isCorrect ? 1 : 0
      });
      
      // Notify admin that a player has answered
      io.to(room).emit("playerAnswered", {
        playerName,
        team: playerTeam
      });
      
      // Check if all players have answered
      const totalPlayers = getTotalPlayers(room);
      const totalAnswers = rooms[room].answers.size;
      
      if (totalAnswers >= totalPlayers) {
        // Notify admin that all players have answered
        io.to(room).emit("allPlayersAnswered");
        // Don't automatically proceed to next question - wait for admin
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
      
      // Set activity round as first question
      rooms[room].isActivityRound = true;
      rooms[room].activityInProgress = true;
      rooms[room].activityDescription = "Ballen gooien – punten worden handmatig ingevoerd.​";
      rooms[room].questionsAsked = 0;
      
      // Notify all clients that the game has been reset
      io.to(room).emit('gameReset');
      io.to(room).emit('teamPlayersUpdate', rooms[room].teams);
      
      // Immediately notify about the activity round
      io.to(room).emit("activityRoundStarting", {
        roundNumber: rooms[room].currentRound,
        totalRounds: rooms[room].totalRounds,
        description: rooms[room].activityDescription
      });
      
      // Also send a specific message to the scoreboard for displaying the activity
      io.to(room).emit("activityRoundForScoreboard", {
        roundNumber: rooms[room].currentRound,
        totalRounds: rooms[room].totalRounds,
        description: rooms[room].activityDescription
      });
    } catch (error) {
      console.error('Error in resetGame:', error);
    }
  });

  // Viewer joins the room
  socket.on("joinViewerRoom", (room, name) => {
    // Check if the room exists
    if (!rooms[room]) {
      socket.emit("message", `Room ${room} doesn't exist`);
      return;
    }
    
    // Add viewer to the room
    socket.join(room);
    
    // Track the viewer in the room
    rooms[room].viewers[socket.id] = { name };
    
    // Notify the viewer joined
    socket.emit("message", `Welcome to room ${room}, ${name}!`);
    socket.to(room).emit("message", `${name} joined as a viewer!`);
    
    // Update viewer count
    const viewerCount = Object.keys(rooms[room].viewers).length;
    io.to(room).emit("viewerUpdate", viewerCount);
    
    // Send current question if one is active
    if (rooms[room].currentQuestion) {
      socket.emit("newQuestion", {
        question: rooms[room].currentQuestion.question,
        answers: rooms[room].currentQuestion.answers,
        questionNumber: rooms[room].questionNumber,
        totalQuestions: rooms[room].questionsPerRound,
        image: rooms[room].currentQuestion.image,
        duration: rooms[room].questionDuration / 1000, // Convert to seconds
        currentRound: rooms[room].currentRound,
        totalRounds: rooms[room].totalRounds
      });
      
      // If we're already showing results for this question, send those too
      if (rooms[room].viewerStats && Object.keys(rooms[room].viewerStats).length > 0) {
        socket.emit("questionEnded", {
          viewerStats: rooms[room].viewerStats
        });
      }
    }
  });
  
  // Viewer submits an answer
  socket.on("submitViewerAnswer", (room, answerIndex) => {
    if (!rooms[room] || !rooms[room].viewers[socket.id]) return;
    
    // Store the viewer's answer
    rooms[room].viewerAnswers[socket.id] = answerIndex;
    
    const viewerName = rooms[room].viewers[socket.id].name;
    socket.emit("message", "Answer submitted!");
    
    // Check if all players and teams have submitted their answers
    const playerCount = Object.keys(rooms[room].players).length;
    const teamAnswersSubmitted = Object.values(rooms[room].teams).filter(
      (team) => team.hasAnswered
    ).length;
    
    // If all teams have answered, process the results
    if (teamAnswersSubmitted === Object.keys(rooms[room].teams).length && playerCount > 0) {
      handleAllAnswersSubmitted(room);
    }
  });
  
  // Viewer leaves the room
  socket.on("leaveViewerRoom", (room, name) => {
    if (!rooms[room] || !rooms[room].viewers[socket.id]) return;
    
    // Remove viewer from the room
    socket.leave(room);
    
    // Remove viewer from tracking
    delete rooms[room].viewers[socket.id];
    
    // Clean up viewer's answer if they submitted one
    if (rooms[room].viewerAnswers[socket.id]) {
      delete rooms[room].viewerAnswers[socket.id];
    }
    
    // Notify others
    socket.to(room).emit("message", `${name} left as a viewer`);
    
    // Update viewer count
    const viewerCount = Object.keys(rooms[room].viewers).length;
    io.to(room).emit("viewerUpdate", viewerCount);
  });

  // Handle disconnects
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    
    // Handle player disconnect
    // ... existing player disconnect code ...
    
    // Handle viewer disconnect
    for (const roomName in rooms) {
      const room = rooms[roomName];
      
      if (room.viewers && room.viewers[socket.id]) {
        const viewerName = room.viewers[socket.id].name;
        
        // Remove viewer from tracking
        delete room.viewers[socket.id];
        
        // Clean up viewer's answer if they submitted one
        if (room.viewerAnswers[socket.id]) {
          delete room.viewerAnswers[socket.id];
        }
        
        // Notify others
        socket.to(roomName).emit("message", `${viewerName} disconnected`);
        
        // Update viewer count
        const viewerCount = Object.keys(room.viewers).length;
        io.to(roomName).emit("viewerUpdate", viewerCount);
      }
    }
  });

  // Add a handler for switching activity types
  socket.on("switchActivityType", (room, activityIndex) => {
    try {
      if (!rooms[room]) return;
      
      const gameRoom = rooms[room];
      
      // Validate the activity index
      if (activityIndex >= 0 && activityIndex < gameRoom.activityOptions.length) {
        gameRoom.currentActivityOption = activityIndex;
        gameRoom.activityDescription = gameRoom.activityOptions[activityIndex];
        
        // Notify all clients about the new activity description
        io.to(room).emit("activityTypeChanged", {
          activityIndex: activityIndex,
          description: gameRoom.activityDescription
        });
        
        // Also update the activity display if we're in an activity round
        if (gameRoom.isActivityRound) {
          io.to(room).emit("activityRoundStarting", {
            roundNumber: gameRoom.currentRound,
            totalRounds: gameRoom.totalRounds,
            description: gameRoom.activityDescription
          });
          
          io.to(room).emit("activityRoundForScoreboard", {
            roundNumber: gameRoom.currentRound,
            totalRounds: gameRoom.totalRounds,
            description: gameRoom.activityDescription
          });
        }
      }
    } catch (error) {
      console.error('Error in switchActivityType:', error);
    }
  });

  // Admin can end the quiz at any time
  socket.on("adminEndQuiz", (room) => {
    try {
      if (!rooms[room]) return;
      
      const gameRoom = rooms[room];
      
      // Get team scores for the final results
      const teamScores = Object.entries(gameRoom.teams)
        .map(([name, data]) => ({
          name,
          score: data.score,
          players: data.players
        }))
        .sort((a, b) => b.score - a.score);
      
      // Get top 3 teams
      const topThree = teamScores.slice(0, Math.min(3, teamScores.length));
      
      console.log("Admin ended quiz! Showing final results with top teams:", topThree);
      
      // Send game over event to all clients
      io.to(room).emit("gameOver", {
        winner: teamScores[0]?.name || "No winner",
        topThree: topThree
      });
      
      // Don't delete the room so people can still see the final results
    } catch (error) {
      console.error('Error in adminEndQuiz:', error);
    }
  });
}); // End of io.on("connection") block

// Remove these duplicate handlers that are outside the connection block
// socket.on('checkRoom', (roomId, callback) => { ... });
// socket.on('createRoom', (roomId) => { ... });

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Function to calculate viewer statistics
function calculateViewerStats(room) {
  const gameRoom = rooms[room];
  if (!gameRoom) return {};
  
  const totalAnswers = Object.keys(gameRoom.viewerAnswers).length;
  if (totalAnswers === 0) return {};
  
  const answerCounts = {};
  
  // Count answers for each option
  Object.values(gameRoom.viewerAnswers).forEach(answerIndex => {
    answerCounts[answerIndex] = (answerCounts[answerIndex] || 0) + 1;
  });
  
  // Calculate percentages
  const stats = {};
  Object.entries(answerCounts).forEach(([answerIndex, count]) => {
    stats[answerIndex] = Math.round((count / totalAnswers) * 100);
  });
  
  return stats;
}

