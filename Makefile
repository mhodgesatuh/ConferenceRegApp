# Makefile - Build, deploy, and manage Drizzle ORM for ConferenceRegApp
#

# -----------------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------------
DRIZZLE := npx drizzle-kit
BACKEND_DIR := backend
FRONTEND_DIR := frontend
SET_BACKEND_ENV := set -a && . $(CURDIR)/.env && set +a && cd $(BACKEND_DIR) &&

##–––––– Logs ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

logs: ## View logs for current environment (dev if LOG_DIR is set to ./logs, else prod)
	@LOG_PREFIX=$$(grep -E '^LOG_PREFIX=' .env 2>/dev/null | cut -d= -f2 | tr -d '\r'); \
	[ -z "$$LOG_PREFIX" ] && LOG_PREFIX=app; \
	if [ "$$(grep -E '^LOG_DIR=\.\/logs' .env 2>/dev/null)" != "" ]; then \
	  FILE=$$(ls -1 ./logs/$$LOG_PREFIX-*.log 2>/dev/null | tail -n 1); \
	  if [ "$$FILE" != "" ]; then \
	    echo " - showing dev logs from $$FILE"; \
	    less $$FILE; \
	  else \
	    echo " - no dev log file found in ./logs"; \
	  fi; \
	else \
	  echo " - showing prod logs from /var/log/conference inside container"; \
	  docker compose exec -it conference-backend sh -c '\
	    LOG_PREFIX="'"$$LOG_PREFIX"'"; \
	    FILE=$$(ls -1 /var/log/conference/$$LOG_PREFIX-*.log 2>/dev/null | tail -n 1); \
	    if [ "$$FILE" != "" ]; then \
	      less $$FILE; \
	    else \
	      echo " - no prod log file found in /var/log/conference"; \
	    fi'; \
	fi


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

baseline: ## Snapshot current schema into a new “init” migration
	@echo "Creating a baseline 'init' migration from your current schema…"
	$(SET_BACKEND_ENV) npm ci && \
	$(DRIZZLE) generate --name init && \
	echo " → baseline migration written to backend/drizzle/migrations/"

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
	$(SET_BACKEND_ENV) npm ci && $(DRIZZLE) migrate
	@echo "When you want to browse/migrate via Drizzle Studio, run:"
	@echo " make studio"

generate: ## Diff schema locally → write SQL + journal (then run `make commit-migrations`)
	$(SET_BACKEND_ENV) npm ci && $(DRIZZLE) generate && \
  	echo "Migration files written to backend/drizzle/migrations/"

commit-migration: ## Stage & commit new Drizzle migration files
	@git add $(BACKEND_DIR)/drizzle/migrations
	@git commit -m "chore: add new Drizzle migration files"

studio-check: ## Verify certs & hosts entry for Drizzle Studio
	@echo "🔍 Checking Drizzle Studio prerequisites…"
	@if [ ! -f $(BACKEND_DIR)/local.drizzle.studio.pem ] || [ ! -f $(BACKEND_DIR)/local.drizzle.studio-key.pem ]; then \
	  echo "Missing cert files in '$(BACKEND_DIR)/'."; \
	  echo " - Run 'make studio-cert' to generate and install them."; \
	  exit 1; \
	fi
	@if ! grep -q '^127\.0\.0\.1[[:space:]]*local\.drizzle\.studio' /etc/hosts; then \
	  echo "Missing hosts entry in /etc/hosts."; \
	  echo " - Add the following line to /etc/hosts (with sudo):"; \
	  echo "   127.0.0.1 local.drizzle.studio"; \
	  exit 1; \
	fi
	@echo " - All Drizzle Studio prerequisites are in place."

studio-cert: ## Generate & install dev certs for Drizzle Studio (requires mkcert)
	@echo "Generating mkcert certificates for local.drizzle.studio…"
	@if ! command -v mkcert >/dev/null 2>&1; then \
	  echo "Error: mkcert is not installed. Install via 'brew install mkcert nss' and run 'mkcert -install'."; \
	  exit 1; \
	fi
	@mkcert local.drizzle.studio
	@mv local.drizzle.studio*.pem $(BACKEND_DIR)/
	@echo "Certificates created and moved to $(BACKEND_DIR)/"

studio: ## Launch Drizzle Studio
	@echo "Starting Drizzle Studio → https://local.drizzle.studio/?port=3337&host=local.drizzle.studio"
	$(SET_BACKEND_ENV) npm ci && npm run studio

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

init-frontend: ## Rebuild and restart the frontend container only
	docker compose build --no-cache conference-frontend
	docker compose up -d conference-frontend

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

.PHONY: build clean commit-migration deploy down drop-tables generate \
        frontend-build frontend-clean frontend-dev frontend-install \
        help init init-backend init-frontend restart reset-db schema \
        studio studio-cert studio-check tail-logs update-schema up
