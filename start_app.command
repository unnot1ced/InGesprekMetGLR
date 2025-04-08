#!/bin/bash

# Script to start all components of the application
# This script will open separate terminal tabs for each component

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

# Function to open a new terminal tab and run a command
open_terminal_tab() {
  osascript -e "tell application \"Terminal\"" \
           -e "tell application \"System Events\" to keystroke \"t\" using {command down}" \
           -e "do script \"cd $1 && $2\" in front window" \
           -e "end tell"
}

# Start backend
echo "Starting backend..."
open_terminal_tab "$PROJECT_DIR/backend" "npm start"

# Wait a moment to ensure backend starts first
sleep 2

# Start vite-project
echo "Starting vite-project..."
open_terminal_tab "$PROJECT_DIR/vite-project" "npm run dev"

# Start admin-panel
echo "Starting admin-panel..."
open_terminal_tab "$PROJECT_DIR/admin-panel" "npm start"

# Start scoreboard
echo "Starting scoreboard..."
open_terminal_tab "$PROJECT_DIR/scoreboard" "npm start"

# Start viewer interface
echo "Starting viewer interface..."
open_terminal_tab "$PROJECT_DIR/viewer-interface" "npm start"

echo "All components started. Check the terminal tabs for each component."