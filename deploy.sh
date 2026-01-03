#!/bin/bash
# deploy.sh - One-click deployment script for Agrarian BNPL Risk Scoring System

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Agrarian BNPL Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found. Please install Python 3.9+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 found:$(python3 --version)${NC}"

# Check pip
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    echo -e "${RED}✗ pip not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ pip found${NC}"

# Optional: Check Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"
    DOCKER_AVAILABLE=true
else
    echo -e "${YELLOW}⚠ Docker not found. Docker deployment will be skipped.${NC}"
    DOCKER_AVAILABLE=false
fi

echo ""

# Ask deployment mode
echo -e "${YELLOW}Select deployment mode:${NC}"
echo "1) Local development (Python venv)"
echo "2) Docker (containerized)"
echo "3) Full setup (run tests + generate charts)"
read -p "Enter choice [1-3]: " DEPLOY_MODE

case $DEPLOY_MODE in
    1)
        echo -e "\n${GREEN}=== Local Development Deployment ===${NC}\n"

        # Create virtual environment
        echo -e "${YELLOW}Creating virtual environment...${NC}"
        python3 -m venv venv
        echo -e "${GREEN}✓ Virtual environment created${NC}"

        # Activate and install dependencies
        echo -e "${YELLOW}Installing dependencies...${NC}"
        source venv/bin/activate
        pip install --upgrade pip --quiet
        pip install -r requirements.txt --quiet
        echo -e "${GREEN}✓ Dependencies installed${NC}"

        # Generate data
        echo -e "${YELLOW}Generating synthetic data...${NC}"
        python generator.py
        echo -e "${GREEN}✓ Synthetic data generated${NC}"

        # Start server
        echo -e "\n${GREEN}=== Starting API Server ===${NC}"
        echo -e "${YELLOW}API will be available at: http://localhost:8000${NC}"
        echo -e "${YELLOW}API docs at: http://localhost:8000/docs${NC}"
        echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"

        uvicorn api:app --reload --port 8000
        ;;

    2)
        if [ "$DOCKER_AVAILABLE" = false ]; then
            echo -e "${RED}✗ Docker not available. Please install Docker first.${NC}"
            exit 1
        fi

        echo -e "\n${GREEN}=== Docker Deployment ===${NC}\n"

        # Build image
        echo -e "${YELLOW}Building Docker image...${NC}"
        docker build -t agrarian-bnpl-api:latest . --quiet
        echo -e "${GREEN}✓ Docker image built${NC}"

        # Start with Docker Compose
        echo -e "${YELLOW}Starting services with Docker Compose...${NC}"
        docker-compose up -d
        echo -e "${GREEN}✓ Services started${NC}"

        # Wait for services to be healthy
        echo -e "${YELLOW}Waiting for services to be ready...${NC}"
        sleep 5

        # Check health
        if curl -s http://localhost:8000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ API is healthy${NC}"
        else
            echo -e "${RED}✗ API health check failed${NC}"
            docker-compose logs api
            exit 1
        fi

        echo -e "\n${GREEN}=== Deployment Complete ===${NC}"
        echo -e "${YELLOW}API: http://localhost:8000${NC}"
        echo -e "${YELLOW}Docs: http://localhost:8000/docs${NC}"
        echo -e "${YELLOW}Redis: localhost:6379${NC}"
        echo -e "${YELLOW}PostgreSQL: localhost:5432${NC}\n"
        echo -e "${YELLOW}View logs: docker-compose logs -f api${NC}"
        echo -e "${YELLOW}Stop services: docker-compose down${NC}"
        ;;

    3)
        echo -e "\n${GREEN}=== Full Setup (Tests + Charts) ===${NC}\n"

        # Create venv if not exists
        if [ ! -d "venv" ]; then
            echo -e "${YELLOW}Creating virtual environment...${NC}"
            python3 -m venv venv
            echo -e "${GREEN}✓ Virtual environment created${NC}"
        fi

        # Activate and install
        source venv/bin/activate
        echo -e "${YELLOW}Installing dependencies...${NC}"
        pip install --upgrade pip --quiet
        pip install -r requirements.txt --quiet
        echo -e "${GREEN}✓ Dependencies installed${NC}"

        # Generate data
        echo -e "${YELLOW}Generating synthetic data...${NC}"
        python generator.py > /dev/null
        echo -e "${GREEN}✓ Synthetic data generated (1000 rows)${NC}"

        # Run tests
        echo -e "${YELLOW}Running test suite...${NC}"
        pytest test_suite.py -v --tb=short | tail -10

        if [ ${PIPESTATUS[0]} -eq 0 ]; then
            echo -e "${GREEN}✓ All tests passed${NC}"
        else
            echo -e "${RED}✗ Some tests failed${NC}"
            exit 1
        fi

        # Generate dashboards
        echo -e "${YELLOW}Generating dashboard charts...${NC}"
        python dashboard.py > /dev/null
        echo -e "${GREEN}✓ Charts generated in charts/ directory${NC}"

        echo -e "\n${GREEN}=== Setup Complete ===${NC}"
        echo -e "${YELLOW}Generated files:${NC}"
        echo -e "  • synthetic_agrarian_bnpl_data.csv"
        echo -e "  • charts/01_late_payment_probability_distribution.png"
        echo -e "  • charts/02_farm_size_vs_payment_risk.png"
        echo -e "  • charts/03_product_distribution.png"

        echo -e "\n${YELLOW}Start API server:${NC}"
        echo -e "  source venv/bin/activate"
        echo -e "  uvicorn api:app --reload --port 8000"
        ;;

    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}Deployment script completed successfully!${NC}"
