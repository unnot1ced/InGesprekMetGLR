const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const app = express();

const server = http.createServer(app);
app.use(cors());
const io = socketIo(server, {
   cors: {
     origin: "http://localhost:5173",
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

const TEAMS = ['Red Team', 'Blue Team', 'Green Team', 'Yellow Team', 'Purple Team'];

const rooms = {};

function getTotalPlayers(room) {
  return Object.values(rooms[room].teams)
    .reduce((sum, team) => sum + team.players.length, 0);
}

function initializeRoom() {
  return {
    teams: TEAMS.reduce((acc, teamName) => {
      acc[teamName] = { score: 0, players: [] };
      return acc;
    }, {}),
    currentQuestion: null,
    correctAnswer: null,
    questionTimeout: null,
    shouldAskNewQuestion: true,
    answers: new Map(),
    usedQuestions: new Set(), // Track used questions
  };
}

io.on("connection", (socket) => {
  console.log("A user connected");

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
      io.to(room).emit("message", `${name} has joined ${team}!`);

      // Start game if this is the first player
      if (getTotalPlayers(room) === 1) {
        askNewQuestion(room);
      }
    } catch (error) {
      console.error('Error in joinRoom:', error);
    }
  });

  socket.on("submitAnswer", (room, answerIndex) => {
    const gameRoom = rooms[room];
    if (!gameRoom) return;

    // Find player's team
    let playerTeam = null;
    for (const [teamName, team] of Object.entries(gameRoom.teams)) {
      if (team.players.some(p => p.id === socket.id)) {
        playerTeam = teamName;
        break;
      }
    }

    if (playerTeam && !gameRoom.answers.has(socket.id)) {
      const isCorrect = gameRoom.correctAnswer === answerIndex;
      gameRoom.teams[playerTeam].score += isCorrect ? 1 : -1;

      const player = gameRoom.teams[playerTeam].players.find(p => p.id === socket.id);
      gameRoom.answers.set(socket.id, { 
        isCorrect, 
        playerName: player.name,
        team: playerTeam,
        answer: answerIndex
      });

      // Check if all players have answered
      const totalPlayers = Object.values(gameRoom.teams)
        .reduce((sum, team) => sum + team.players.length, 0);
      
      if (gameRoom.answers.size === totalPlayers) {
        handleAllAnswersSubmitted(room);
      }
    }
  });

  socket.on("quitGame", (room) => {
    try {
      if (!rooms[room]) {
        socket.leave(room);
        return;
      }

      const player = rooms[room].players.find(p => p.id === socket.id);
      if (player) {
        io.to(room).emit("playerLeft", `${player.name} has left the game`);
        rooms[room].players = rooms[room].players.filter(p => p.id !== socket.id);
        
        // Clear any existing timeouts for the room
        if (rooms[room].questionTimeout) {
          clearTimeout(rooms[room].questionTimeout);
        }
        
        // If room is empty or only one player left, clean it up
        if (rooms[room].players.length <= 1) {
          io.to(room).emit("gameOver", { winner: "Game ended - not enough players" });
          delete rooms[room];
        } else {
          // Recalculate scores for remaining players
          const sortedScores = rooms[room].players
            .map(player => ({
              name: player.name,
              score: player.score || 0
            }))
            .sort((a, b) => b.score - a.score);
            
          io.to(room).emit("showResults", {
            scores: sortedScores,
            nextQuestionIn: 5,
            duration: 5000
          });
        }
      }
      socket.leave(room);
    } catch (error) {
      console.error('Error in quitGame:', error);
      socket.leave(room);
    }
  });

  socket.on("disconnect", () => {
    try {
      for (const room in rooms) {
        // Remove player from their team
        for (const team of Object.values(rooms[room].teams)) {
          team.players = team.players.filter(p => p.id !== socket.id);
        }
        
        // Clean up empty room
        if (getTotalPlayers(room) === 0) {
          delete rooms[room];
        }
      }
      console.log("A user disconnected");
    } catch (error) {
      console.error('Error in disconnect:', error);
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
});

function handleAllAnswersSubmitted(room) {
  try {
    if (!rooms[room]) return;
    
    const gameRoom = rooms[room];
    clearTimeout(gameRoom.questionTimeout);

    // Get top 5 teams sorted by score
    const sortedTeams = Object.entries(gameRoom.teams)
      .map(([name, data]) => ({
        name,
        score: data.score
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Collect answers and separate them by correct/incorrect
    const allAnswers = Array.from(gameRoom.answers.values());
    const correctAnswer = gameRoom.currentQuestion.answers[gameRoom.correctAnswer].text;
    const correctAnswers = allAnswers.filter(a => a.isCorrect);
    const incorrectAnswers = allAnswers.filter(a => !a.isCorrect);

    io.to(room).emit("roundResults", {
      scores: sortedTeams,
      answers: {
        correct: correctAnswer,
        correctAnswers,
        incorrectAnswers
      }
    });

    const winningTeam = sortedTeams[0];
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
      // Filter out used questions
      const availableQuestions = questions.filter(
        (_, index) => !rooms[room].usedQuestions.has(index)
      );

      if (availableQuestions.length === 0) {
        rooms[room].usedQuestions.clear();
        availableQuestions.push(...questions);
      }

      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const actualIndex = questions.indexOf(availableQuestions[randomIndex]);
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

     
    }, resultScreenDuration);
  } catch (error) {
    console.error('Error in askNewQuestion:', error);
  }
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

