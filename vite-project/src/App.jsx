import React, { useState, useEffect } from 'react';
import './App.css'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


import io from 'socket.io-client';

const socket = io("ws://localhost:5000", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

function App() {
  const [name, setName] = useState(null);
  const [room, setRoom] = useState(null);
  const [info, setInfo] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [seconds, setSeconds] = useState(); // Set the initial duration in seconds
  const [scores, setScores] = useState([]);
  const [winner, setWinner] = useState();
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [showingResults, setShowingResults] = useState(false);
  const [nextQuestionTimer, setNextQuestionTimer] = useState(0);
  const [progress, setProgress] = useState(100);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [team, setTeam] = useState(null);
  const [answers, setAnswers] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [questionImage, setQuestionImage] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showAdminInput, setShowAdminInput] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (name && room && team) {
      setInfo(true);
      socket.emit('joinRoom', room, name, team);
    }
  };

  const handleAdminAccess = (e) => {
    e.preventDefault();
    if (adminCode === 'IGM2024') { // You can change this admin code
      setIsAdmin(true);
      setShowAdminInput(false);
      toast.success('Admin access granted!');
    } else {
      toast.error('Invalid admin code');
    }
  };

  const handleNextQuestion = () => {
    socket.emit('adminNextQuestion', room);
  };

  const handleQuit = () => {
    if (room) {
      setIsExiting(true);
      setTimeout(() => {
        socket.emit('quitGame', room);
        setInfo(false);
        setName(null);
        setRoom(null);
        setQuestion('');
        setOptions([]);
        setScores([]);
        setWinner(null);
        setIsExiting(false);
      }, 400); // Match the pageExit animation duration
    }
  };

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
        theme: "dark",
      });
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
    };
  }, []);

  useEffect(() => {
    // Exit the effect when the timer reaches 0
    if (seconds === 0) return;

    // Create an interval to decrement the time every second
    const timerInterval = setInterval(() => {
      setSeconds(prevTime => prevTime - 1);
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(timerInterval);
    };
  }, [seconds]);

  useEffect(() => {
    if (name) {
      socket.emit('joinRoom', room, name);
    }
  }, [info]);

  useEffect(() => {
    socket.on('message', (message) => {
      toast(`${message} joined`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    });
    return () => {
      socket.off('message');
    };
  }, []);

  useEffect(() => {
    socket.on('newQuestion', (data) => {
      setShowingResults(false);
      setQuestion(data.question);
      setQuestionImage(data.image);
      setOptions(data.answers);
      setAnswered(false);
      setSeconds(data.timer);
      setSelectedAnswerIndex();
      setStartTime(data.startTime);
      setDuration(data.duration);
      setProgress(100);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
    });

    socket.on('answerResult', (data) => {
      if (data.isCorrect) {
        toast(`Correct! ${data.playerName} Heeft het goed!`, {
          position: "bottom-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
      setScores(data.scores);
    });

    socket.on('gameOver', (data) => {
      setWinner(data.winner);
    });

    socket.on('showResults', (data) => {
      setShowingResults(true);
      setScores(data.scores);
      setNextQuestionTimer(data.nextQuestionIn);
      setQuestion('');
      setOptions([]);
      setDuration(data.duration);
      setStartTime(Date.now());
    });

    socket.on('playerLeft', (message) => {
      toast(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    });

    socket.on('roundResults', (data) => {
      setShowingResults(true);
      setScores(data.scores);
      setAnswers(data.answers);
      setQuestion('');
      setOptions([]);
      setDuration(5000);
      setStartTime(Date.now());
    });

    return () => {
      socket.off('newQuestion');
      socket.off('answerResult');
      socket.off('gameOver');
      socket.off('showResults');
      socket.off('playerLeft');
      socket.off('roundResults');
    };
  }, []);

  useEffect(() => {
    if (!showingResults) return;

    if (nextQuestionTimer === 0) return;

    const timer = setInterval(() => {
      setNextQuestionTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showingResults, nextQuestionTimer]);

  // Timer effect
  useEffect(() => {
    if (!startTime || !duration) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (duration - elapsed) / duration * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [startTime, duration]);

  const handleAnswer = (answerIndex) => {
    if (!answered) {
      setSelectedAnswerIndex(answerIndex);

      socket.emit('submitAnswer', room, answerIndex);
      setAnswered(true);
    }
  };

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
      ) : (
        <div className={isExiting ? 'page-exit' : ''}>
          <button className="quit-button" onClick={handleQuit}>
            Quit Game
          </button>
          <h1>In Gesprek met</h1>
          <p className='room-id'>Join Id: {room}</p>
          <ToastContainer />

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
              <ul>
                {options.map((answer, index) => (
                  <li key={index}>
                    <button className={`options ${selectedAnswerIndex === index ? 'selected' : ''}`}
                      onClick={() => handleAnswer(index)} disabled={answered}>
                      {answer}
                    </button>
                  </li>
                ))}
              </ul>
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

export default App;


