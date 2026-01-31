# Voclio API - Makefile
# Voice Notes and Task Management System

.PHONY: help install dev start stop restart test clean db-setup db-migrate db-reset db-seed logs status

# Colors for output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

## help: Show this help message
help:
	@echo "$(GREEN)Voclio API - Available Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Setup & Installation:$(NC)"
	@echo "  make install          - Install all dependencies"
	@echo "  make setup            - Complete project setup (install + db-setup)"
	@echo ""
	@echo "$(YELLOW)Development:$(NC)"
	@echo "  make dev              - Start development server with hot reload"
	@echo "  make start            - Start production server"
	@echo "  make stop             - Stop the server"
	@echo "  make restart          - Restart the server"
	@echo "  make logs             - Show server logs"
	@echo ""
	@echo "$(YELLOW)Database:$(NC)"
	@echo "  make db-setup         - Initialize database and run migrations"
	@echo "  make db-migrate       - Run database migrations"
	@echo "  make db-reset         - Reset database (drop and recreate)"
	@echo "  make db-seed          - Seed database with sample data"
	@echo "  make db-backup        - Backup database"
	@echo "  make db-restore       - Restore database from backup"
	@echo ""
	@echo "$(YELLOW)Testing:$(NC)"
	@echo "  make test             - Run all tests"
	@echo "  make test-unit        - Run unit tests"
	@echo "  make test-integration - Run integration tests"
	@echo "  make test-coverage    - Run tests with coverage report"
	@echo ""
	@echo "$(YELLOW)Code Quality:$(NC)"
	@echo "  make lint             - Run ESLint"
	@echo "  make lint-fix         - Fix ESLint issues automatically"
	@echo "  make format           - Format code with Prettier"
	@echo ""
	@echo "$(YELLOW)Maintenance:$(NC)"
	@echo "  make clean            - Clean temporary files and caches"
	@echo "  make clean-all        - Clean everything including node_modules"
	@echo "  make update           - Update all dependencies"
	@echo "  make status           - Show project status"
	@echo ""
	@echo "$(YELLOW)Docker:$(NC)"
	@echo "  make docker-build     - Build Docker image"
	@echo "  make docker-up        - Start Docker containers"
	@echo "  make docker-down      - Stop Docker containers"
	@echo "  make docker-logs      - Show Docker logs"
	@echo ""

## install: Install all dependencies
install:
	@echo "$(GREEN)Installing dependencies...$(NC)"
	npm install
	@echo "$(GREEN)✓ Dependencies installed successfully$(NC)"

## setup: Complete project setup
setup: install
	@echo "$(GREEN)Setting up project...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file from .env.example...$(NC)"; \
		cp .env.example .env; \
		echo "$(YELLOW)⚠ Please update .env file with your configuration$(NC)"; \
	fi
	@echo "$(GREEN)Running database setup...$(NC)"
	@$(MAKE) db-setup
	@echo "$(GREEN)✓ Project setup completed$(NC)"

## dev: Start development server
dev:
	@echo "$(GREEN)Starting development server...$(NC)"
	npm run dev

## start: Start production server
start:
	@echo "$(GREEN)Starting production server...$(NC)"
	npm start

## stop: Stop the server
stop:
	@echo "$(YELLOW)Stopping server...$(NC)"
	@pkill -f "node.*server.js" || echo "No server process found"
	@echo "$(GREEN)✓ Server stopped$(NC)"

## restart: Restart the server
restart: stop start

## logs: Show server logs
logs:
	@echo "$(GREEN)Showing logs...$(NC)"
	@tail -f logs/*.log 2>/dev/null || echo "No log files found"

## db-setup: Initialize database
db-setup:
	@echo "$(GREEN)Setting up database...$(NC)"
	node scripts/initDatabase.js
	@echo "$(GREEN)✓ Database setup completed$(NC)"

## db-migrate: Run database migrations
db-migrate:
	@echo "$(GREEN)Running database migrations...$(NC)"
	@for file in database/migrations/*.sql; do \
		echo "Running $$file..."; \
		psql -h $(DB_HOST) -U $(DB_USER) -d $(DB_NAME) -f $$file; \
	done
	@echo "$(GREEN)✓ Migrations completed$(NC)"

## db-reset: Reset database
db-reset:
	@echo "$(RED)⚠ WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		echo "$(YELLOW)Resetting database...$(NC)"; \
		dropdb -h $(DB_HOST) -U $(DB_USER) $(DB_NAME) --if-exists; \
		createdb -h $(DB_HOST) -U $(DB_USER) $(DB_NAME); \
		$(MAKE) db-setup; \
		echo "$(GREEN)✓ Database reset completed$(NC)"; \
	else \
		echo "$(YELLOW)Database reset cancelled$(NC)"; \
	fi

## db-seed: Seed database with sample data
db-seed:
	@echo "$(GREEN)Seeding database...$(NC)"
	node database/create_admin.sql
	@echo "$(GREEN)✓ Database seeded$(NC)"

## db-backup: Backup database
db-backup:
	@echo "$(GREEN)Creating database backup...$(NC)"
	@mkdir -p backups
	@BACKUP_FILE="backups/voclio_backup_$$(date +%Y%m%d_%H%M%S).sql"; \
	pg_dump -h $(DB_HOST) -U $(DB_USER) $(DB_NAME) > $$BACKUP_FILE; \
	echo "$(GREEN)✓ Backup created: $$BACKUP_FILE$(NC)"

## db-restore: Restore database from backup
db-restore:
	@echo "$(YELLOW)Available backups:$(NC)"
	@ls -1 backups/*.sql 2>/dev/null || echo "No backups found"
	@read -p "Enter backup filename: " backup; \
	if [ -f "$$backup" ]; then \
		echo "$(GREEN)Restoring from $$backup...$(NC)"; \
		psql -h $(DB_HOST) -U $(DB_USER) -d $(DB_NAME) < $$backup; \
		echo "$(GREEN)✓ Database restored$(NC)"; \
	else \
		echo "$(RED)✗ Backup file not found$(NC)"; \
	fi

## test: Run all tests
test:
	@echo "$(GREEN)Running tests...$(NC)"
	npm test

## test-unit: Run unit tests
test-unit:
	@echo "$(GREEN)Running unit tests...$(NC)"
	npm run test:unit

## test-integration: Run integration tests
test-integration:
	@echo "$(GREEN)Running integration tests...$(NC)"
	npm run test:integration

## test-coverage: Run tests with coverage
test-coverage:
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	npm run test:coverage

## lint: Run ESLint
lint:
	@echo "$(GREEN)Running ESLint...$(NC)"
	npm run lint

## lint-fix: Fix ESLint issues
lint-fix:
	@echo "$(GREEN)Fixing ESLint issues...$(NC)"
	npm run lint:fix

## format: Format code with Prettier
format:
	@echo "$(GREEN)Formatting code...$(NC)"
	npm run format

## clean: Clean temporary files
clean:
	@echo "$(YELLOW)Cleaning temporary files...$(NC)"
	rm -rf uploads/voice/*
	rm -rf logs/*.log
	rm -rf .cache
	@echo "$(GREEN)✓ Cleanup completed$(NC)"

## clean-all: Clean everything
clean-all: clean
	@echo "$(RED)Removing node_modules...$(NC)"
	rm -rf node_modules
	rm -rf package-lock.json
	@echo "$(GREEN)✓ Full cleanup completed$(NC)"

## update: Update dependencies
update:
	@echo "$(GREEN)Updating dependencies...$(NC)"
	npm update
	npm audit fix
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

## status: Show project status
status:
	@echo "$(GREEN)Project Status:$(NC)"
	@echo ""
	@echo "$(YELLOW)Node Version:$(NC)"
	@node --version
	@echo ""
	@echo "$(YELLOW)NPM Version:$(NC)"
	@npm --version
	@echo ""
	@echo "$(YELLOW)Dependencies:$(NC)"
	@npm list --depth=0 2>/dev/null | head -20
	@echo ""
	@echo "$(YELLOW)Database Connection:$(NC)"
	@node test-connection.js 2>/dev/null || echo "$(RED)✗ Database connection failed$(NC)"
	@echo ""
	@echo "$(YELLOW)Server Status:$(NC)"
	@pgrep -f "node.*server.js" > /dev/null && echo "$(GREEN)✓ Server is running$(NC)" || echo "$(RED)✗ Server is not running$(NC)"

## docker-build: Build Docker image
docker-build:
	@echo "$(GREEN)Building Docker image...$(NC)"
	docker build -t voclio-api .
	@echo "$(GREEN)✓ Docker image built$(NC)"

## docker-up: Start Docker containers
docker-up:
	@echo "$(GREEN)Starting Docker containers...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Containers started$(NC)"

## docker-down: Stop Docker containers
docker-down:
	@echo "$(YELLOW)Stopping Docker containers...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Containers stopped$(NC)"

## docker-logs: Show Docker logs
docker-logs:
	@echo "$(GREEN)Showing Docker logs...$(NC)"
	docker-compose logs -f

# Load environment variables
ifneq (,$(wildcard ./.env))
    include .env
    export
endif
