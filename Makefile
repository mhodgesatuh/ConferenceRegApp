# Makefile - Build, deploy, and manage Drizzle ORM for ConferenceRegApp

# -----------------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------------
DRIZZLE := npx drizzle-kit
BACKEND_DIR := backend
FRONTEND_DIR := frontend

# -----------------------------------------------------------------------------
# QUICK START
# -----------------------------------------------------------------------------

init: ## Initialize dev environment: install deps, reset DB, and apply schema
	@echo "Docker Desktop must be running before proceeding."
	@echo "WARNING: this will wipe out all existing data."
	@read -p "Press 'return' when ready or [Ctrl+C] to quit: "

	$(MAKE) reset-db
	@echo "Waiting for database to become available..."
	@until docker compose exec conference-db mysqladmin ping -h"127.0.0.1" --silent; do \
		echo " - waiting for db..."; \
		sleep 2; \
	done

	$(MAKE) drop-tables
	$(MAKE) schema

# -----------------------------------------------------------------------------
# DRIZZLE ORM: DATABASE SCHEMA MANAGEMENT
# -----------------------------------------------------------------------------

drop-tables: ## Drop all existing tables in the database
	@echo "Dropping all tables from the database..."
	docker compose exec conference-db \
	sh -c 'mysql -u$$DB_USER -p$$DB_PASSWORD $$DB_NAME -Nse \
	"SET FOREIGN_KEY_CHECKS = 0; \
	SELECT CONCAT(\"DROP TABLE IF EXISTS \", table_name, \";\") \
	FROM information_schema.tables WHERE table_schema = \"$$DB_NAME\";" \
	| mysql -u$$DB_USER -p$$DB_PASSWORD $$DB_NAME'

reset-db: ## Completely remove and recreate the database from .env
	@echo "Removing database container and volume 'mariadb_data'..."
	docker compose down --volumes --remove-orphans
	@echo "Force-removing mariadb_data volume just in case..."
	docker volume rm mariadb_data || true
	@echo "Recreating fresh database from .env..."
	docker compose up -d conference-db
	@echo "Database reset complete. Next step: make schema"

schema: ## Push current schema to the database (live migration)
	@echo "Applying current schema to the database..."
	docker compose build --no-cache drizzle-runner
	docker compose run --rm --entrypoint node drizzle-runner node_modules/.bin/drizzle-kit push

generate: ## Generate SQL migration script (does NOT apply it)
	docker compose build --no-cache drizzle-runner
	docker compose run --rm --entrypoint node drizzle-runner node_modules/.bin/drizzle-kit generate
	cat backend/drizzle/migrations/*.sql

studio: ## Launch Drizzle Studio (visual schema browser, optional)
	docker compose run --rm drizzle-runner studio

# -----------------------------------------------------------------------------
# DOCKER: CONTAINER LIFECYCLE
# -----------------------------------------------------------------------------

build: ## Build Docker images for frontend and backend
	docker compose build --no-cache

up: ## Start containers in detached mode
	docker compose up -d

down: ## Stop and remove containers
	docker compose down

restart: ## Restart all containers
	$(MAKE) down
	$(MAKE) up

tail-logs: ## Tail logs from all containers
	docker compose logs -f

clean: ## Stop and remove all containers, volumes, and images
	docker compose down --volumes --rmi all

# -----------------------------------------------------------------------------
# FRONTEND DEVELOPMENT
# -----------------------------------------------------------------------------

frontend-dev: ## Run the frontend dev server (Vite)
	cd $(FRONTEND_DIR) && npm install && npm run dev

frontend-install: ## Install frontend dependencies
	cd $(FRONTEND_DIR) && npm install

frontend-build: ## Build the frontend (for production)
	cd $(FRONTEND_DIR) && npm run build

frontend-clean: ## Remove frontend dist build
	cd $(FRONTEND_DIR) && rm -rf dist

# -----------------------------------------------------------------------------
# HIGH-LEVEL COMPOSITES
# -----------------------------------------------------------------------------

deploy-container: build schema up ## Build images, apply schema, and launch the stack

update-schema: generate schema ## Run full schema lifecycle: generate -> push

# -----------------------------------------------------------------------------
# DEFAULT TARGET
# -----------------------------------------------------------------------------

.DEFAULT_GOAL := help

help: ## Show available targets
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
