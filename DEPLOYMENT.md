# Deployment Guide - Agrarian BNPL Risk Scoring System

Complete deployment guide for local development, Docker, and production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Testing Deployment](#testing-deployment)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- Python 3.9 or higher
- Docker 20.10+ (for containerized deployment)
- Docker Compose 2.0+ (for multi-service orchestration)
- Git (for version control)

### System Requirements

**Development:**
- RAM: 2GB minimum
- Disk: 1GB free space
- CPU: 2 cores recommended

**Production:**
- RAM: 4GB minimum (8GB recommended)
- Disk: 10GB free space
- CPU: 4 cores recommended
- Network: Static IP or load balancer

---

## Local Development

### 1. Clone Repository

```bash
cd /path/to/your/workspace
git clone <repository-url>
cd BNPL_scoring
```

### 2. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Generate Synthetic Data

```bash
python generator.py
# Output: synthetic_agrarian_bnpl_data.csv
```

### 5. Run Tests

```bash
# Run all tests
pytest test_suite.py -v

# Run with coverage report
pytest test_suite.py -v --cov=. --cov-report=html

# Check product match accuracy
pytest test_suite.py::test_product_match_accuracy_target -v -s
```

### 6. Generate Dashboards

```bash
python dashboard.py
# Output: charts/01_late_payment_probability_distribution.png
#         charts/02_farm_size_vs_payment_risk.png
#         charts/03_product_distribution.png
```

### 7. Start API Server

```bash
# Development mode (auto-reload)
uvicorn api:app --reload --port 8000

# Production mode (4 workers)
uvicorn api:app --host 0.0.0.0 --port 8000 --workers 4
```

### 8. Access API Documentation

Open browser to:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

---

## Docker Deployment

### 1. Build Docker Image

```bash
# Build the image
docker build -t agrarian-bnpl-api:latest .

# Verify build
docker images | grep agrarian-bnpl-api
```

### 2. Run Single Container (API Only)

```bash
# Run in foreground (for testing)
docker run -p 8000:8000 agrarian-bnpl-api:latest

# Run in background (detached)
docker run -d -p 8000:8000 --name bnpl-api agrarian-bnpl-api:latest

# View logs
docker logs -f bnpl-api

# Stop container
docker stop bnpl-api
docker rm bnpl-api
```

### 3. Run with Docker Compose (Full Stack)

```bash
# Start all services (API + Redis + PostgreSQL)
docker-compose up -d

# View logs
docker-compose logs -f api

# Check service health
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### 4. Docker Compose Services

The `docker-compose.yml` includes:

| Service | Port | Purpose |
|---------|------|---------|
| **api** | 8000 | FastAPI REST API |
| **redis** | 6379 | Feature caching (optional) |
| **postgres** | 5432 | Transaction logging (optional) |
| **prometheus** | 9090 | Metrics collection (monitoring profile) |
| **grafana** | 3000 | Dashboards (monitoring profile) |

### 5. Docker Compose Profiles

```bash
# Run with monitoring stack
docker-compose --profile monitoring up -d

# Run API only (minimal)
docker-compose up -d api
```

### 6. Docker Health Checks

```bash
# Check container health
docker inspect bnpl-api | grep -A 10 Health

# Manual health check
curl http://localhost:8000/health
```

---

## Production Deployment

### Architecture Options

#### Option A: Single Server (Small Scale)

```
┌─────────────────────────────────────┐
│     Load Balancer (Nginx/Traefik)  │
└────────────┬────────────────────────┘
             │
      ┌──────┴──────┐
      │  Docker     │
      │  Host       │
      │  ┌────────┐ │
      │  │ API x4 │ │ (4 workers)
      │  ├────────┤ │
      │  │ Redis  │ │
      │  ├────────┤ │
      │  │Postgres│ │
      │  └────────┘ │
      └─────────────┘
```

**Deploy Commands:**

```bash
# 1. SSH to server
ssh user@production-server

# 2. Clone repository
git clone <repo-url>
cd BNPL_scoring

# 3. Set environment variables
cp .env.example .env
nano .env  # Edit with production values

# 4. Start services
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify deployment
curl https://api.your-domain.com/health
```

#### Option B: Kubernetes (Large Scale)

```yaml
# k8s-deployment.yaml (example)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bnpl-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bnpl-api
  template:
    metadata:
      labels:
        app: bnpl-api
    spec:
      containers:
      - name: api
        image: agrarian-bnpl-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 30
```

Deploy to Kubernetes:

```bash
# Build and push to registry
docker build -t your-registry.com/bnpl-api:v1.0.0 .
docker push your-registry.com/bnpl-api:v1.0.0

# Deploy to cluster
kubectl apply -f k8s-deployment.yaml
kubectl apply -f k8s-service.yaml
kubectl apply -f k8s-ingress.yaml

# Check status
kubectl get pods -l app=bnpl-api
kubectl logs -l app=bnpl-api --tail=100
```

### Production Configuration

Create `.env` file:

```bash
# API Configuration
ENVIRONMENT=production
LOG_LEVEL=info
API_PORT=8000
WORKERS=4

# Redis Configuration
REDIS_URL=redis://redis:6379/0
REDIS_MAX_CONNECTIONS=100

# PostgreSQL Configuration
DATABASE_URL=postgresql://bnpl_user:CHANGE_ME@postgres:5432/bnpl_db

# Security
SECRET_KEY=CHANGE_ME_TO_RANDOM_STRING
JWT_EXPIRY_HOURS=1
API_KEY_ROTATION_DAYS=90

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_BATCH_PER_MINUTE=10

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
```

### SSL/TLS Configuration (Nginx)

```nginx
# /etc/nginx/sites-available/bnpl-api
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;
    ssl_protocols TLSv1.3;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Testing Deployment

### 1. Health Check

```bash
curl -X GET http://localhost:8000/health
```

**Expected Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "checks": {
    "scoring_engine": "ready",
    "product_matcher": "ready",
    "bnpl_policy": "ready"
  }
}
```

### 2. Score Endpoint Test

```bash
curl -X POST http://localhost:8000/score \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "TEST_001",
    "region": "North",
    "farm_type": "smallholder",
    "crop_type": "maize",
    "farm_size_ha": 3.5,
    "years_experience": 8,
    "monthly_income_est": 45000,
    "recent_cash_inflows": 120000,
    "avg_order_value": 18000,
    "device_trust_score": 78,
    "identity_consistency": 85,
    "prior_defaults": 0
  }'
```

### 3. Product Recommendation Test

```bash
curl -X POST http://localhost:8000/recommend_product \
  -H "Content-Type: application/json" \
  -d @test_payload.json
```

### 4. Load Testing

```bash
# Install Apache Bench
apt-get install apache2-utils  # Ubuntu/Debian
brew install httpd  # macOS

# Run load test (100 requests, 10 concurrent)
ab -n 100 -c 10 -p test_payload.json -T application/json \
   http://localhost:8000/score

# Expected results:
# - Success rate: 100%
# - p95 latency: < 200ms
# - No errors
```

---

## Monitoring & Health Checks

### Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **API Uptime** | 99.9% | < 99.5% |
| **p95 Latency** | < 200ms | > 500ms |
| **Error Rate** | < 0.1% | > 1% |
| **Approval Rate** | 65-75% | < 60% or > 80% |
| **30-Day Default Rate** | < 8% | > 12% |
| **Memory Usage** | < 80% | > 90% |
| **CPU Usage** | < 70% | > 85% |

### Prometheus Metrics

Access Prometheus at http://localhost:9090

**Key Queries:**

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# Latency p95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Grafana Dashboards

Access Grafana at http://localhost:3000 (default: admin/admin)

Import dashboard from `grafana-dashboard.json`

---

## Troubleshooting

### Common Issues

#### 1. Docker Build Fails

**Problem:** `ERROR: failed to solve: process "/bin/sh -c pip install..."`

**Solution:**
```bash
# Clear Docker cache
docker builder prune -a

# Rebuild with no cache
docker build --no-cache -t agrarian-bnpl-api:latest .
```

#### 2. API Returns 500 Error

**Problem:** Internal server error

**Diagnosis:**
```bash
# Check logs
docker logs bnpl-api --tail=100

# Common causes:
# - Missing environment variables
# - Redis/Postgres not accessible
# - Invalid data format
```

#### 3. Slow API Response

**Problem:** p95 latency > 500ms

**Solution:**
```bash
# Increase workers
uvicorn api:app --workers 8

# Enable Redis caching
# Check database query performance
# Profile code with cProfile
```

#### 4. Port Already in Use

**Problem:** `Error: bind: address already in use`

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn api:app --port 8001
```

#### 5. Out of Memory

**Problem:** Container OOM (Out of Memory)

**Solution:**
```bash
# Increase Docker memory limit
docker run -m 4g -p 8000:8000 agrarian-bnpl-api:latest

# In docker-compose.yml:
services:
  api:
    mem_limit: 4g
```

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop new deployment
docker-compose down

# 2. Revert to previous version
git checkout <previous-commit>

# 3. Rebuild and redeploy
docker-compose build
docker-compose up -d

# 4. Verify health
curl http://localhost:8000/health
```

---

## Security Checklist

- [ ] Change default passwords in `.env`
- [ ] Enable TLS/HTTPS (production)
- [ ] Set up firewall rules (allow only ports 80, 443)
- [ ] Enable Redis authentication
- [ ] Enable PostgreSQL SSL
- [ ] Rotate API keys monthly
- [ ] Set up log retention (90 days)
- [ ] Enable rate limiting
- [ ] Scan Docker images for vulnerabilities (`docker scan`)
- [ ] Set up backup for PostgreSQL (daily)

---

## Backup & Disaster Recovery

### Database Backup

```bash
# Backup PostgreSQL
docker exec bnpl-postgres pg_dump -U bnpl_user bnpl_db > backup_$(date +%Y%m%d).sql

# Restore from backup
cat backup_20260103.sql | docker exec -i bnpl-postgres psql -U bnpl_user bnpl_db
```

### Redis Backup

```bash
# Backup Redis (RDB snapshot)
docker exec bnpl-redis redis-cli SAVE
docker cp bnpl-redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb

# Restore
docker cp redis_backup_20260103.rdb bnpl-redis:/data/dump.rdb
docker restart bnpl-redis
```

---

## Support & Contact

- Technical Issues: dev-support@agrarian-bnpl.example.com
- Security Issues: security@agrarian-bnpl.example.com
- Documentation: https://docs.agrarian-bnpl.example.com

---

**Last Updated:** 2026-01-03
**Version:** 1.0.0
