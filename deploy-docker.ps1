# OTEA-Server Docker Deployment Script (Windows)
# Usage: .\deploy-docker.ps1 -Action start|stop|restart|logs|deploy|clean

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('deploy', 'start', 'stop', 'restart', 'logs', 'health', 'clean')]
    [string]$Action = 'deploy'
)

# Colors
$Colors = @{
    'Error'   = 'Red'
    'Success' = 'Green'
    'Warning' = 'Yellow'
    'Info'    = 'Cyan'
    'Header'  = 'Blue'
}

function Print-Header {
    param([string]$Message)
    Write-Host "========================================" -ForegroundColor $Colors['Header']
    Write-Host $Message -ForegroundColor $Colors['Header']
    Write-Host "========================================" -ForegroundColor $Colors['Header']
}

function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $Colors['Success']
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $Colors['Error']
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $Colors['Warning']
}

function Print-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor $Colors['Info']
}

# Check Docker installation
function Check-Docker {
    $docker = docker version 2>$null
    $compose = docker-compose version 2>$null
    
    if (-not $docker) {
        Print-Error "Docker is not installed. Please install Docker Desktop for Windows first."
        Print-Info "Download: https://www.docker.com/products/docker-desktop"
        exit 1
    }
    
    if (-not $compose) {
        Print-Error "docker-compose is not installed."
        exit 1
    }
    
    Print-Success "Docker and docker-compose are installed"
}

# Setup environment
function Setup-Environment {
    Print-Header "Setting up environment"
    
    $envFile = ".\.env"
    $envExampleFile = ".\.env.example"
    
    if (-not (Test-Path $envFile)) {
        if (Test-Path $envExampleFile) {
            Copy-Item $envExampleFile $envFile
            Print-Warning ".env file created from .env.example"
            Print-Warning "Please edit .env with your configuration before deploying"
            return $false
        }
        else {
            Print-Error ".env.example not found"
            return $false
        }
    }
    
    # Create required directories
    New-Item -ItemType Directory -Force -Path "data" | Out-Null
    New-Item -ItemType Directory -Force -Path "deployment/logs/nginx" | Out-Null
    New-Item -ItemType Directory -Force -Path "deployment/logs/app" | Out-Null
    New-Item -ItemType Directory -Force -Path "presets" | Out-Null
    
    Print-Success "Environment setup completed"
    return $true
}

# Build Docker image
function Build-Image {
    Print-Header "Building Docker image"
    
    docker-compose -f ".\deployment\docker-compose.yml" build --no-cache
    
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Docker image built successfully"
    }
    else {
        Print-Error "Docker image build failed"
        exit 1
    }
}

# Start containers
function Start-Containers {
    Print-Header "Starting Docker containers"
    
    docker-compose -f ".\deployment\docker-compose.yml" up -d
    
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Containers started"
        Start-Sleep -Seconds 3
        docker-compose -f ".\deployment\docker-compose.yml" ps
    }
    else {
        Print-Error "Failed to start containers"
        exit 1
    }
}

# Stop containers
function Stop-Containers {
    Print-Header "Stopping Docker containers"
    
    docker-compose -f ".\deployment\docker-compose.yml" down
    
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Containers stopped"
    }
}

# Restart containers
function Restart-Containers {
    Print-Header "Restarting Docker containers"
    
    docker-compose -f ".\deployment\docker-compose.yml" restart
    
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Containers restarted"
    }
}

# Show logs
function Show-Logs {
    Print-Header "Container logs (backend)"
    
    docker-compose -f ".\deployment\docker-compose.yml" logs -f backend
}

# Health check
function Health-Check {
    Print-Header "Health check"
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Print-Success "Backend is healthy"
        }
    }
    catch {
        Print-Error "Backend health check failed: $_"
    }
    
    Write-Host ""
    Write-Host "Container status:" -ForegroundColor $Colors['Info']
    docker-compose -f ".\deployment\docker-compose.yml" ps
}

# Clean up
function Clean-All {
    Print-Header "Cleaning up Docker resources"
    
    Print-Warning "This will remove containers, volumes, and networks!"
    $confirm = Read-Host "Are you sure? (yes/no)"
    
    if ($confirm -eq "yes") {
        docker-compose -f ".\deployment\docker-compose.yml" down -v
        Print-Success "Cleanup completed"
    }
    else {
        Print-Warning "Cleanup cancelled"
    }
}

# Full deployment
function Deploy-Full {
    Print-Header "OTEA-Server Docker Deployment (Windows)"
    
    Check-Docker
    
    if (-not (Setup-Environment)) {
        Print-Error "Environment setup failed. Please configure .env file."
        exit 1
    }
    
    Build-Image
    Stop-Containers 2>$null
    Start-Containers
    Start-Sleep -Seconds 2
    Health-Check
    
    Print-Success "OTEA-Server deployed successfully!"
    Write-Host ""
    Write-Host "Access your application:" -ForegroundColor $Colors['Info']
    Write-Host "  - Backend API: http://localhost:3000" -ForegroundColor $Colors['Header']
    Write-Host "  - Health check: http://localhost:3000/api/health" -ForegroundColor $Colors['Header']
    Write-Host "  - Admin UI: http://localhost:3000/" -ForegroundColor $Colors['Header']
    Write-Host ""
    Write-Host "Default credentials:" -ForegroundColor $Colors['Info']
    Write-Host "  - Username: admin" -ForegroundColor $Colors['Warning']
    Write-Host "  - Password: admin1234 (CHANGE THIS!)" -ForegroundColor $Colors['Warning']
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor $Colors['Info']
    Write-Host "  - View logs: .\deploy-docker.ps1 -Action logs"
    Write-Host "  - Restart: .\deploy-docker.ps1 -Action restart"
    Write-Host "  - Stop: .\deploy-docker.ps1 -Action stop"
    Write-Host "  - Health: .\deploy-docker.ps1 -Action health"
}

# Main execution
switch ($Action) {
    'deploy' { Deploy-Full }
    'start' { Check-Docker; Start-Containers }
    'stop' { Check-Docker; Stop-Containers }
    'restart' { Check-Docker; Restart-Containers }
    'logs' { Check-Docker; Show-Logs }
    'health' { Check-Docker; Health-Check }
    'clean' { Check-Docker; Clean-All }
    default { Write-Host "Unknown action: $Action" }
}
