#!/bin/bash

# OTEA-Server Docker Deployment Script
# Usage: ./deploy-docker.sh [start|stop|restart|logs|clean]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="otea-server"
COMPOSE_FILE="${SCRIPT_DIR}/deployment/docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed. Please install docker-compose first."
        exit 1
    fi
    
    print_success "Docker and docker-compose are installed"
}

# Setup environment
setup_env() {
    print_header "Setting up environment"
    
    # Check if .env exists
    if [ ! -f "${SCRIPT_DIR}/.env" ]; then
        print_warning ".env file not found. Creating from .env.example"
        cp "${SCRIPT_DIR}/.env.example" "${SCRIPT_DIR}/.env"
        print_warning "Please edit .env file with your configuration"
        return 1
    fi
    
    # Create required directories
    mkdir -p "${SCRIPT_DIR}/data"
    mkdir -p "${SCRIPT_DIR}/deployment/logs/nginx"
    mkdir -p "${SCRIPT_DIR}/deployment/logs/app"
    mkdir -p "${SCRIPT_DIR}/presets"
    
    print_success "Environment setup completed"
}

# Build Docker image
build_image() {
    print_header "Building Docker image"
    
    docker-compose -f "${COMPOSE_FILE}" build --no-cache
    
    print_success "Docker image built successfully"
}

# Start containers
start_containers() {
    print_header "Starting Docker containers"
    
    docker-compose -f "${COMPOSE_FILE}" up -d
    
    print_success "Containers started"
    sleep 3
    
    # Show status
    docker-compose -f "${COMPOSE_FILE}" ps
}

# Stop containers
stop_containers() {
    print_header "Stopping Docker containers"
    
    docker-compose -f "${COMPOSE_FILE}" down
    
    print_success "Containers stopped"
}

# Restart containers
restart_containers() {
    print_header "Restarting Docker containers"
    
    docker-compose -f "${COMPOSE_FILE}" restart
    
    print_success "Containers restarted"
}

# Show logs
show_logs() {
    print_header "Container logs (backend)"
    
    docker-compose -f "${COMPOSE_FILE}" logs -f backend
}

# Show nginx logs
show_nginx_logs() {
    print_header "Container logs (nginx)"
    
    docker-compose -f "${COMPOSE_FILE}" logs -f nginx
}

# Clean up
clean_all() {
    print_header "Cleaning up Docker resources"
    
    print_warning "This will remove containers, volumes, and networks!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        docker-compose -f "${COMPOSE_FILE}" down -v
        print_success "Cleanup completed"
    else
        print_warning "Cleanup cancelled"
    fi
}

# Health check
health_check() {
    print_header "Health check"
    
    if curl -s http://localhost:3000/api/health | grep -q "success"; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
    fi
    
    # Show container status
    echo ""
    echo "Container status:"
    docker-compose -f "${COMPOSE_FILE}" ps
}

# Deploy (full flow)
deploy() {
    print_header "OTEA-Server Docker Deployment"
    
    check_docker
    
    if ! setup_env; then
        print_error "Environment setup failed. Please configure .env file."
        exit 1
    fi
    
    build_image
    
    stop_containers 2>/dev/null || true
    
    start_containers
    
    health_check
    
    print_success "OTEA-Server deployed successfully!"
    echo ""
    echo "Access your application:"
    echo "  - Backend API: http://localhost:3000"
    echo "  - Health check: http://localhost:3000/api/health"
    echo "  - Admin UI: http://localhost:3000/"
    echo ""
    echo "Default credentials:"
    echo "  - Username: admin"
    echo "  - Password: admin1234 (CHANGE THIS!)"
    echo ""
    echo "Useful commands:"
    echo "  - View logs: $0 logs"
    echo "  - Restart: $0 restart"
    echo "  - Stop: $0 stop"
    echo "  - Health: $0 health"
}

# Main
case "${1:-deploy}" in
    start)
        check_docker
        start_containers
        ;;
    stop)
        check_docker
        stop_containers
        ;;
    restart)
        check_docker
        restart_containers
        ;;
    logs)
        check_docker
        show_logs
        ;;
    nginx-logs)
        check_docker
        show_nginx_logs
        ;;
    health)
        check_docker
        health_check
        ;;
    clean)
        check_docker
        clean_all
        ;;
    deploy)
        deploy
        ;;
    *)
        echo "Usage: $0 {deploy|start|stop|restart|logs|nginx-logs|health|clean}"
        exit 1
        ;;
esac
