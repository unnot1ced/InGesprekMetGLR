#!/bin/bash

# Script to start all components of the application
# This script will create separate terminal windows for each component

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

# Create command files for each component
echo "#!/bin/bash\ncd \"$PROJECT_DIR/backend\" && npm start" > "$PROJECT_DIR/tmp_backend.command"
echo "#!/bin/bash\ncd \"$PROJECT_DIR/vite-project\" && npm run dev" > "$PROJECT_DIR/tmp_vite.command"
echo "#!/bin/bash\ncd \"$PROJECT_DIR/admin-panel\" && npm start" > "$PROJECT_DIR/tmp_admin.command"
echo "#!/bin/bash\ncd \"$PROJECT_DIR/scoreboard\" && npm start" > "$PROJECT_DIR/tmp_scoreboard.command"
echo "#!/bin/bash\ncd \"$PROJECT_DIR/viewer-interface\" && npm start" > "$PROJECT_DIR/tmp_viewer.command"

# Make them executable
chmod +x "$PROJECT_DIR/tmp_backend.command"
chmod +x "$PROJECT_DIR/tmp_vite.command"
chmod +x "$PROJECT_DIR/tmp_admin.command"
chmod +x "$PROJECT_DIR/tmp_scoreboard.command"
chmod +x "$PROJECT_DIR/tmp_viewer.command"

# Start each component in its own terminal
echo "Starting backend..."
open "$PROJECT_DIR/tmp_backend.command"

# Wait a moment to ensure backend starts first
sleep 2

echo "Starting vite-project..."
open "$PROJECT_DIR/tmp_vite.command"

echo "Starting admin-panel..."
open "$PROJECT_DIR/tmp_admin.command"

echo "Starting scoreboard..."
open "$PROJECT_DIR/tmp_scoreboard.command"

echo "Starting viewer interface..."
open "$PROJECT_DIR/tmp_viewer.command"

# Wait a bit before cleaning up
sleep 5

# Clean up temporary files (will be deleted after they're executed)
rm "$PROJECT_DIR/tmp_backend.command"
rm "$PROJECT_DIR/tmp_vite.command"
rm "$PROJECT_DIR/tmp_admin.command"
rm "$PROJECT_DIR/tmp_scoreboard.command"
rm "$PROJECT_DIR/tmp_viewer.command"

echo "All components started. Check the terminal windows for each component."