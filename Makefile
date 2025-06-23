# Makefile - Build, deploy, and manage Drizzle ORM for ConferenceRegApp

# -----------------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------------
DRIZZLE := npx drizzle-kit
BACKEND_DIR := backend
FRONTEND_DIR := frontend
SET_ENV := set -a && . ./.env && set +a &&

##–––––– Quick Start –––––––––––––––––––––––––––––––––––––––––––––––––––––––––

init: ## Initialize dev environment: install deps, reset DB, and apply schema
	@echo "Docker Desktop must be running before proceeding."
	@echo "WARNING: this will wipe out all existing data."
	ifndef CI
	  @read -p "Press 'return' when ready or [Ctrl+C] to quit: "
	endif

	$(MAKE) reset-db
	@echo "Wait for database: "
	@until docker compose exec conference-db mysqladmin ping -h"127.0.0.1" --silent; do \
		sleep 1; \
	done

	$(MAKE) drop-tables
	$(MAKE) schema

init-backend: ## Rebuild and restart the backend container only
	docker compose build --no-cache conference-backend
	docker compose up -d conference-backend

##–––––– Drizzle ORM: Schema Management –––––––––––––––––––––––––––––––––––––

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

schema: ## Incrementally apply only new migrations to the database
	@echo "Applying **pending** migrations to the database..."
	docker compose build --no-cache drizzle-runner
	docker compose run --rm drizzle-runner node_modules/.bin/drizzle-kit migrate

generate: ## Diff schema locally → write SQL + journal (then run `make commit-migrations`)
	$(SET_ENV) \
	cd $(BACKEND_DIR) && $(DRIZZLE) generate && \
  	echo "Migration files written to backend/drizzle/migrations/"

commit-migration: ## Stage & commit new Drizzle migration files
	@git add $(BACKEND_DIR)/drizzle/migrations
	@git commit -m "chore: add new Drizzle migration files"

studio: ## Launch Drizzle Studio (visual schema browser, optional)
	docker compose run --rm drizzle-runner studio

##–––––– Docker: Container Lifecycle –––––––––––––––––––––––––––––––––––––––

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

##–––––– Frontend Development –––––––––––––––––––––––––––––––––––––––––––––

frontend-dev: ## Run the frontend dev server (Vite)
	cd $(FRONTEND_DIR) && npm install && npm run dev

frontend-install: ## Install frontend dependencies
	cd $(FRONTEND_DIR) && npm install

frontend-build: ## Build the frontend (for production)
	cd $(FRONTEND_DIR) && npm run build

frontend-clean: ## Remove frontend dist build
	cd $(FRONTEND_DIR) && rm -rf dist

##–––––– High-Level Composites –––––––––––––––––––––––––––––––––––––––––––––

deploy: build schema up ## Build images, apply only new migrations, and start the stack

update-schema: generate schema ## Generate new migrations and apply them

# -----------------------------------------------------------------------------
# DEFAULT TARGET
# -----------------------------------------------------------------------------

.DEFAULT_GOAL := help

help: ## Show available targets grouped by section
	@echo "Available targets:"; \
	awk '/^##––––––/ { \
	    hdr = $$0; \
	    sub(/^##––––––[ \t]*/,   "", hdr); \
	    sub(/[ \t]*––––––.*$$/,   "", hdr); \
	    print "\n" hdr; \
	} /^[A-Za-z0-9_%-]+:.*##/ { \
	    split($$0, parts, "##"); \
	    target = parts[1]; desc = parts[2]; \
	    sub(/[ \t]*$$/, "", target); \
	    printf "  %-15s %s\n", target, desc; \
	}' $(MAKEFILE_LIST)

# -----------------------------------------------------------------------------
# Prevent conflicts with any files named the same as your targets.
# -----------------------------------------------------------------------------

.PHONY: init init-backend reset-db drop-tables schema generate studio \
        commit-migrations build up down restart tail-logs clean \
        frontend-dev frontend-install frontend-build frontend-clean \
        deploy update-schema help
