#!/bin/bash

# Script to start all components of the application
# This script is designed to work cross-platform

# Get the absolute path of the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to check if directory exists
check_directory() {
  if [ ! -d "$1" ]; then
    echo "Error: Directory $1 does not exist"
    exit 1
  fi
}

# Check if all required directories exist
check_directory "$PROJECT_DIR/backend"
check_directory "$PROJECT_DIR/vite-project"
check_directory "$PROJECT_DIR/admin-panel"
check_directory "$PROJECT_DIR/scoreboard"
check_directory "$PROJECT_DIR/viewer-interface"

# Function to start a component in a new terminal
start_component() {
  component_name=$1
  directory=$2
  command=$3
  
  echo "Starting $component_name..."
  
  # Detect OS and start terminal accordingly
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e "tell app \"Terminal\" to do script \"cd '$directory' && $command\""
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v gnome-terminal &> /dev/null; then
      gnome-terminal -- bash -c "cd '$directory' && $command; exec bash"
    elif command -v xterm &> /dev/null; then
      xterm -e "cd '$directory' && $command; exec bash" &
    else
      echo "No supported terminal found. Please start manually: cd '$directory' && $command"
    fi
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows with Git Bash or similar
    start cmd.exe /k "cd /d $directory && $command"
  else
    echo "Unsupported OS. Please start manually: cd '$directory' && $command"
  fi
}

# Start the backend first
start_component "backend" "$PROJECT_DIR/backend" "npm start"

# Wait to ensure backend starts first
sleep 2

# Start other components
start_component "player interface" "$PROJECT_DIR/vite-project" "npm run dev"
start_component "admin panel" "$PROJECT_DIR/admin-panel" "npm start"
start_component "scoreboard" "$PROJECT_DIR/scoreboard" "npm start"
start_component "viewer interface" "$PROJECT_DIR/viewer-interface" "npm start"

echo "All components started. Check the terminal windows for each component."