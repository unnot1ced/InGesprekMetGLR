import React, { useState, useEffect } from 'react';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

// Initialize socket connection
const socket = io("ws://localhost:5000", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Helper function to normalize image paths
const normalizeImagePath = (path) => {
  if (!path) return null;
  
  // If the path already starts with http:// or https://, leave it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove any leading slash to ensure proper concatenation
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Return the full URL with the base
  return `http://localhost:5000/${normalizedPath}`;
};

function App() {
  // State for joining the game
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [joinError, setJoinError] = useState('');
  
  // Game state
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [showingResults, setShowingResults] = useState(false);
  const [answerStats, setAnswerStats] = useState({});
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [progress, setProgress] = useState(100);
  const [questionImage, setQuestionImage] = useState(null);
  const [totalViewers, setTotalViewers] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(4);
  const [mediaError, setMediaError] = useState(null);

  // Handle form submission to join the game
  const handleSubmit = (e) => {
    e.preventDefault();

    if (name && room) {
      // Reset any previous errors
      setJoinError('');
      
      // Check if the room exists
      socket.emit('checkRoom', room, (exists) => {
        if (exists) {
          // Join as a viewer
          socket.emit('joinViewerRoom', room, name);
          setJoined(true);
          toast.success(`Joined room ${room} as a viewer!`);
        } else {
          setJoinError(`Room ${room} doesn't exist. Please check the room code.`);
          toast.error(`Room ${room} doesn't exist. Please check the room code.`);
        }
      });
    } else {
      setJoinError('Please enter your name and the room code.');
    }
  };

  // Handle answer selection
  const handleAnswer = (index) => {
    if (answered) return;
    
    setSelectedAnswerIndex(index);
    setAnswered(true);
    
    // Submit answer to the server as a viewer
    socket.emit('submitViewerAnswer', room, index);
    
    toast.info('Answer submitted!');
  };

  // Handle quitting the game
  const handleQuit = () => {
    socket.emit('leaveViewerRoom', room, name);
    setJoined(false);
    setName('');
    setRoom('');
    setQuestion('');
    setOptions([]);
    setAnswered(false);
    setSelectedAnswerIndex(null);
    setShowingResults(false);
    toast.info('You left the game.');
  };

  // Connect to socket.io events
  useEffect(() => {
    // Connection status
    socket.on('connect', () => {
      setConnectionError(false);
    });

    socket.on('connect_error', () => {
      setConnectionError(true);
      toast.error('Cannot connect to server! Please make sure the server is running.', {
        toastId: 'connection-error',
        autoClose: false,
      });
    });

    // Game events
    socket.on('newQuestion', (data) => {
      setQuestion(data.question);
      // Handle the answers array correctly, ensuring we have the text property
      const formattedAnswers = Array.isArray(data.answers) 
        ? data.answers.map(answer => {
            // If answer is an object with text property, use it directly
            if (typeof answer === 'object' && answer.text) {
              return answer;
            }
            // If answer is a string, create an object with text property
            return { text: answer };
          })
        : [];
      
      setOptions(formattedAnswers);
      setAnswered(false);
      setSelectedAnswerIndex(null);
      setShowingResults(false);
      setQuestionImage(data.image || null);
      setQuestionNumber(data.questionNumber || 1);
      setTotalQuestions(data.totalQuestions || 10);
      setCurrentRound(data.currentRound || 1);
      setTotalRounds(data.totalRounds || 4);
      
      // If timer is enabled
      if (data.duration) {
        setSeconds(data.duration);
        setProgress(100);
        
        const interval = setInterval(() => {
          setSeconds((prevSeconds) => {
            if (prevSeconds <= 1) {
              clearInterval(interval);
              return 0;
            }
            
            setProgress((prevSeconds - 1) / data.duration * 100);
            return prevSeconds - 1;
          });
        }, 1000);
        
        return () => clearInterval(interval);
      }
    });

    socket.on('questionEnded', (data) => {
      setShowingResults(true);
      if (data.viewerStats) {
        setAnswerStats(data.viewerStats);
      }
    });

    socket.on('viewerUpdate', (count) => {
      setTotalViewers(count);
    });

    socket.on('timeUp', () => {
      setSeconds(0);
      setProgress(0);
    });

    socket.on('roundScreen', () => {
      // Reset question-related states when showing round screen
      setQuestion('');
      setOptions([]);
      setAnswered(false);
      setSelectedAnswerIndex(null);
      setShowingResults(false);
    });

    socket.on('gameOver', () => {
      toast.info('The game has ended!');
      // Keep connected but clear game state
      setQuestion('');
      setOptions([]);
      setAnswered(false);
      setSelectedAnswerIndex(null);
      setShowingResults(false);
    });

    // Clean up the socket connection on unmount
    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('newQuestion');
      socket.off('questionEnded');
      socket.off('viewerUpdate');
      socket.off('timeUp');
      socket.off('roundScreen');
      socket.off('gameOver');
    };
  }, []);

  // Add this useEffect to reset media errors when the question changes
  useEffect(() => {
    if (questionImage) {
      setMediaError(null);
    }
  }, [questionImage]);

  // Render the join screen
  if (!joined) {
    return (
      <div className="join-container">
        <ToastContainer />
        {connectionError && (
          <div className="connection-error">
            Cannot connect to the server. Please check if the server is running.
          </div>
        )}
        <div className="join-form">
          <h1>Join as Viewer</h1>
          <p>Participate in the quiz and see how your answers compare to others!</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="room">Room Code</label>
              <input
                type="text"
                id="room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Enter the room code"
                required
              />
            </div>
            
            {joinError && <div className="error-message">{joinError}</div>}
            
            <button type="submit" className="btn btn-primary">
              Join Game
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render the game screen
  return (
    <div className="app">
      <ToastContainer />
      <div className="container">
        <div className="header">
          <div>Room: {room}</div>
          <div>Viewers: {totalViewers}</div>
          <button onClick={handleQuit} className="btn">
            Leave
          </button>
        </div>
        
        <div className="quiz-container">
          {question ? (
            <>
              <div className="question-info">
                <div className="question-progress">
                  Question {questionNumber} of {totalQuestions} | Round {currentRound} of {totalRounds}
                </div>
                
                {seconds > 0 && (
                  <div className="timer-container">
                    <div className="timer-bar" style={{ width: `${progress}%` }}></div>
                  </div>
                )}
              </div>
              
              <div className="question-container">
                {questionImage && (
                  <div className="question-image">
                    {mediaError ? (
                      <div className="media-error">{mediaError}</div>
                    ) : questionImage.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video 
                        src={normalizeImagePath(questionImage)} 
                        alt="Question Video" 
                        controls
                        autoPlay
                        muted
                        loop
                        playsInline
                        onError={() => {
                          console.error("Video failed to load:", questionImage);
                          setMediaError(`Video failed to load: ${questionImage}`);
                        }}
                      />
                    ) : (
                      <img 
                        src={normalizeImagePath(questionImage)} 
                        alt="Question" 
                        onError={() => {
                          console.error("Image failed to load:", questionImage);
                          setMediaError(`Image failed to load: ${questionImage}`);
                        }}
                      />
                    )}
                  </div>
                )}
                
                <div className="question">{question}</div>
                
                <div className="options-container">
                  {options.map((option, index) => (
                    <div
                      key={index}
                      className={`option ${selectedAnswerIndex === index ? 'selected' : ''}`}
                      onClick={() => handleAnswer(index)}
                    >
                      <div className="option-text">{option.text}</div>
                      
                      {showingResults && (
                        <>
                          <div className="percentage-bar">
                            <div
                              className="percentage-fill"
                              style={{ width: `${answerStats[index] || 0}%` }}
                            ></div>
                          </div>
                          <div className="percentage-text">
                            {answerStats[index] || 0}%
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {showingResults && (
                <div className="results-container">
                  <div className="stats-header">
                    Viewer Results
                  </div>
                  <div className="answer-stats">
                    {Object.entries(answerStats).map(([index, percentage]) => (
                      <div key={index} className="stat-item">
                        {options[index]?.text}: {percentage}%
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="waiting-message">
              Waiting for the host to start a new question...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
