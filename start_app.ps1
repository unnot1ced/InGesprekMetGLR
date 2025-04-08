# PowerShell script to start all components of the application
# This script will create separate terminal windows for each component

# Get the absolute path of the project directory
$PROJECT_DIR = $PSScriptRoot

# Function to check if directory exists
function Check-Directory {
    param($dir)
    if (-not (Test-Path $dir -PathType Container)) {
        Write-Error "Error: Directory $dir does not exist"
        exit 1
    }
}

# Check if all required directories exist
Check-Directory "$PROJECT_DIR\backend"
Check-Directory "$PROJECT_DIR\vite-project"
Check-Directory "$PROJECT_DIR\admin-panel"
Check-Directory "$PROJECT_DIR\scoreboard"
Check-Directory "$PROJECT_DIR\viewer-interface"
Check-Directory "$PROJECT_DIR\presenter-interface"

# Function to start a component in a new terminal
function Start-Component {
    param($componentName, $directory, $command)
    
    Write-Host "Starting $componentName..."
    
    # Start in a new window
    Start-Process powershell.exe -ArgumentList "-NoExit -Command cd '$directory'; $command"
}

# Start the backend first
Start-Component "backend" "$PROJECT_DIR\backend" "npm start"

# Wait to ensure backend starts first
Start-Sleep -Seconds 2

# Start other components with explicit port settings
Start-Component "player interface" "$PROJECT_DIR\vite-project" "npm run dev"
Start-Component "admin panel" "$PROJECT_DIR\admin-panel" "set PORT=3000 && npm start"
Start-Component "scoreboard" "$PROJECT_DIR\scoreboard" "set PORT=3001 && npm start"
Start-Component "viewer interface" "$PROJECT_DIR\viewer-interface" "set PORT=3002 && npm start"
Start-Component "presenter interface" "$PROJECT_DIR\presenter-interface" "set PORT=3003 && npm start"

Write-Host "All components started on their dedicated ports:"
Write-Host "Backend: http://localhost:5000"
Write-Host "Player Interface: http://localhost:5173"
Write-Host "Admin Panel: http://localhost:3000" 
Write-Host "Scoreboard: http://localhost:3001"
Write-Host "Viewer Interface: http://localhost:3002"
Write-Host "Presenter Interface: http://localhost:3003" 