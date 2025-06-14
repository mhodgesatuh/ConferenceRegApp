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

	@echo "Installing all project dependencies..."
	cd $(FRONTEND_DIR) && npm install
	cd $(BACKEND_DIR) && npm install

	$(MAKE) reset-db
	$(MAKE) schema

# -----------------------------------------------------------------------------
# DRIZZLE ORM: DATABASE SCHEMA MANAGEMENT
# -----------------------------------------------------------------------------

reset-db: ## Completely remove and recreate the database from .env
	@echo "Removing database container and volume 'mariadb_data'..."
	docker compose down -v --remove-orphans
	@echo "Recreating fresh database from .env..."
	docker compose up -d conference-db
	@echo "Database reset complete. Next step: make schema"

schema: ## Push current schema to the database (live migration)
	@echo "Applying current schema to the database..."
	docker compose run --rm drizzle-runner

generate: ## Generate SQL migration script (does NOT apply it)
	docker compose run --rm drizzle-runner node node_modules/drizzle-kit/dist/index.js generate:mysql

studio: ## Launch Drizzle Studio (visual schema browser, optional)
	docker compose run --rm -p 3001:3001 drizzle-runner studio

# -----------------------------------------------------------------------------
# DOCKER: CONTAINER LIFECYCLE
# -----------------------------------------------------------------------------

build: ## Build Docker images for frontend and backend
	docker compose build

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
