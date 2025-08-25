# Makefile - Build, deploy, and manage Drizzle ORM for ConferenceRegApp
#

# -----------------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------------
DRIZZLE := npx drizzle-kit
BACKEND_DIR := backend
FRONTEND_DIR := frontend
SERVICE_BACKEND := conference-backend
SERVICE_DB := conference-db

# Profile selection: default to dev unless ENV_PROFILE=prod
PROFILE := $(if $(filter $(ENV_PROFILE),prod),prod,dev)

# Use a single compose file; pick env file based on profile
COMPOSE_FILE := docker-compose.yml
ENV_FILE := $(if $(filter $(PROFILE),prod),.env.prod,.env)

# Compose command ensures both interpolation and container env_file use the same .env
COMPOSE := ENV_FILE=$(ENV_FILE) docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE)
ECHO_PROFILE := @echo "ENV_PROFILE=$(PROFILE)  ENV_FILE=$(ENV_FILE)"

# Source .env and cd backend for Drizzle CLI (kept for reference if needed)
SET_BACKEND_ENV := set -a && . $(CURDIR)/$(ENV_FILE) && set +a && cd $(BACKEND_DIR) &&

RUN_IN_BACKEND = $(COMPOSE) run --rm $(SERVICE_BACKEND) sh -lc

##–––––– Logs ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

logs: ## View logs (latest). If LOG_DIR=./logs in env file, show local dev logs; otherwise show container logs
	$(ECHO_PROFILE)
	@LOG_PREFIX=$$(grep -E '^LOG_PREFIX=' $(ENV_FILE) 2>/dev/null | cut -d= -f2 | tr -d '\r'); \
	[ -z "$$LOG_PREFIX" ] && LOG_PREFIX=app; \
	if [ "$$(grep -E '^LOG_DIR=\.\/logs' $(ENV_FILE) 2>/dev/null)" != "" ]; then \
	  FILE=$$(ls -1 ./logs/$$LOG_PREFIX-*.log 2>/dev/null | tail -n 1); \
	  if [ "$$FILE" != "" ]; then \
	    echo " - showing dev logs from $$FILE"; \
	    less $$FILE; \
	  else \
	    echo " - no dev log file found in ./logs"; \
	  fi; \
	else \
	  echo " - showing container logs from /var/log/conference"; \
	  $(COMPOSE) exec -it $(SERVICE_BACKEND) sh -c '\
	    LOG_PREFIX="'"$$LOG_PREFIX"'"; \
	    FILE=$$(ls -1 /var/log/conference/$$LOG_PREFIX-*.log 2>/dev/null | tail -n 1); \
	    if [ "$$FILE" != "" ]; then \
	      less $$FILE; \
	    else \
	      echo " - no log file found in /var/log/conference"; \
	    fi'; \
	fi

##–––––– Quick Start –––––––––––––––––––––––––––––––––––––––––––––––––––––––––

init: ## Initialize environment: reset DB and apply schema (DANGER: wipes data)
	$(ECHO_PROFILE)
	@echo "Docker Desktop must be running before proceeding."
	@echo "WARNING: this will wipe out all existing data."
ifndef CI
	@read -p "Press 'return' when ready or [Ctrl+C] to quit: "
endif
	$(MAKE) reset-db
	@echo " - database starting up..."
	@until $(COMPOSE) exec $(SERVICE_DB) mysqladmin ping -h"127.0.0.1" --silent; do \
		sleep 1; \
	done
	$(MAKE) drop-tables
	$(MAKE) schema

init-backend: ## Rebuild and restart the backend container only (current profile)
	$(ECHO_PROFILE)
	$(COMPOSE) build --no-cache $(SERVICE_BACKEND)
	$(COMPOSE) up -d $(SERVICE_BACKEND)

backend-shell: ## Open a shell in the backend container (current profile)
	$(ECHO_PROFILE)
	$(COMPOSE) exec $(SERVICE_BACKEND) sh

##–––––– Drizzle ORM: Schema Management –––––––––––––––––––––––––––––––––––––

# Helper: ensure drizzle deps exist in the container (no host npm needed)
ensure-drizzle-deps:
	$(ECHO_PROFILE)
	@$(COMPOSE) up -d $(SERVICE_BACKEND)
	@$(RUN_IN_BACKEND) 'cd /app/backend && \
	  npm ci && \
	  npm ls drizzle-kit >/dev/null 2>&1 || npm install --no-fund --no-audit -D drizzle-kit@latest tsx@latest; \
	  npm ls drizzle-orm >/dev/null 2>&1 || npm install --no-fund --no-audit drizzle-orm@latest'

generate: ensure-drizzle-deps ## Diff schema locally → write SQL + journal
	$(ECHO_PROFILE)
	@$(COMPOSE) up -d $(SERVICE_BACKEND)
	@$(RUN_IN_BACKEND) 'cd /app/backend && \
	  ./node_modules/.bin/drizzle-kit generate && \
	  echo " - migration files written to backend/drizzle/migrations/"'

schema: ensure-drizzle-deps ## Incrementally apply only new migrations
	$(ECHO_PROFILE)
	@$(COMPOSE) up -d $(SERVICE_BACKEND)
	@$(RUN_IN_BACKEND) 'cd /app/backend && \
	  ./node_modules/.bin/drizzle-kit migrate'

baseline: ensure-drizzle-deps ## Snapshot current schema into “init” migration
	$(ECHO_PROFILE)
	@$(COMPOSE) up -d $(SERVICE_BACKEND)
	@$(RUN_IN_BACKEND) 'cd /app/backend && \
	  ./node_modules/.bin/drizzle-kit generate --name init && \
	  echo " - baseline migration written to backend/drizzle/migrations/"'


drop-tables: ## Drop all existing tables in the database
	$(ECHO_PROFILE)
	@echo " - dropping all tables from the database..."
	$(COMPOSE) exec $(SERVICE_DB) \
	  sh -c 'mysql -u$$DB_USER -p$$DB_PASSWORD $$DB_NAME -Nse \
	    "SET FOREIGN_KEY_CHECKS = 0; \
	     SELECT CONCAT(\"DROP TABLE IF EXISTS \", table_name, \";\") \
	     FROM information_schema.tables WHERE table_schema = \"$$DB_NAME\";" \
	    | mysql -u$$DB_USER -p$$DB_PASSWORD $$DB_NAME'

reset-db: ## Completely remove and recreate the database (current profile/env)
	$(ECHO_PROFILE)
	@echo " - removing containers and volumes…"
	$(COMPOSE) down --volumes --remove-orphans || true
	@echo " - force-removing mariadb_data volume (if present)…"
	-@docker volume rm mariadb_data >/dev/null 2>&1 || true
	@echo " - recreating fresh database from $(ENV_FILE)…"
	$(COMPOSE) up -d $(SERVICE_DB)
	@echo " - database reset complete. next step: make schema"

commit-migration: ## Stage & commit new Drizzle migration files
	$(ECHO_PROFILE)
	@git add $(BACKEND_DIR)/drizzle/migrations
	@git commit -m "chore: add new Drizzle migration files"

studio-check: ## Verify certs & hosts entry for Drizzle Studio
	$(ECHO_PROFILE)
	@echo "🔍 checking Drizzle Studio prerequisites…"
	@if [ ! -f $(BACKEND_DIR)/certs/local.drizzle.studio.pem ] || [ ! -f $(BACKEND_DIR)/certs/local.drizzle.studio-key.pem ]; then \
	  echo "Missing cert files in '$(BACKEND_DIR)/certs/'."; \
	  echo " - Run 'make studio-cert' to generate and install them."; \
	  exit 1; \
	fi
	@if ! grep -q '^127\.0\.0\.1[[:space:]]*local\.drizzle\.studio' /etc/hosts; then \
	  echo "Missing hosts entry in /etc/hosts."; \
	  echo " - Add the following line to /etc/hosts (with sudo):"; \
	  echo "   127.0.0.1 local.drizzle.studio"; \
	  exit 1; \
	fi
	@echo " - all Drizzle Studio prerequisites are in place."

studio-cert: ## Generate & install dev certs for Drizzle Studio (requires mkcert)
	$(ECHO_PROFILE)
	@echo " - generating mkcert certificates for local.drizzle.studio…"
	@if ! command -v mkcert >/dev/null 2>&1; then \
	  echo "Error: mkcert is not installed. Install via 'brew install mkcert nss' and run 'mkcert -install'."; \
	  exit 1; \
	fi
	@mkcert local.drizzle.studio
	@mkdir -p $(BACKEND_DIR)/certs
	@mv local.drizzle.studio*.pem $(BACKEND_DIR)/certs
	@echo " - certificates created and moved to $(BACKEND_DIR)/certs"

# Run Drizzle Studio inside the backend container on HTTP
studio: ## Launch Drizzle Studio
	$(ECHO_PROFILE)
	@echo " - starting Drizzle Studio → https://local.drizzle.studio/?port=3337&host=127.0.0.1 (use Firefox)"
	@$(COMPOSE) run --rm -p 127.0.0.1:3337:3337 $(SERVICE_BACKEND) sh -lc '\
	  cd /app/backend && \
	  npm ci && \
	  npx drizzle-kit studio --host=0.0.0.0 --port=3337 \
	'

##–––––– Docker: Container Lifecycle –––––––––––––––––––––––––––––––––––––––

build: ## Build Docker images (current profile/env)
	$(ECHO_PROFILE)
	$(COMPOSE) build --no-cache

up: ## Start containers in detached mode (current profile/env)
	$(ECHO_PROFILE)
	$(COMPOSE) up -d
	@echo "Running: https://localhost:8080/"

down: ## Stop and remove containers (current profile/env)
	$(ECHO_PROFILE)
	$(COMPOSE) down
	@echo " - stopping/removing manually started conference_ui (if running)..."
	-@docker stop conference_ui >/dev/null 2>&1 || true
	-@docker rm conference_ui >/dev/null 2>&1 || true

restart: ## Restart all containers (current profile/env)
	$(ECHO_PROFILE)
	$(MAKE) down
	$(MAKE) up

tail-logs: ## Tail logs from all containers (current profile/env)
	$(ECHO_PROFILE)
	$(COMPOSE) logs -f

clean: ## Stop and remove all containers, volumes, and images (current profile/env)
	$(ECHO_PROFILE)
	$(COMPOSE) down --volumes --rmi all || true
	@echo " - stopping/removing manually started conference_ui (if running)..."
	-@docker stop conference_ui >/dev/null 2>&1 || true
	-@docker rm conference_ui >/dev/null 2>&1 || true
	@echo " - removing conference-reg-app:dev image (if present)..."
	-@docker rmi conference-reg-app:dev >/dev/null 2>&1 || true

##–––––– High-Level Composites –––––––––––––––––––––––––––––––––––––––––––––

rebuild: ## Redeploy a new set of containers (current profile/env)
	$(ECHO_PROFILE)
	$(MAKE) down
	$(MAKE) build
	$(MAKE) up

deploy: ## Build images, apply pending migrations, and start the stack (current profile/env)
	$(ECHO_PROFILE)
	$(MAKE) build
	$(MAKE) schema
	$(MAKE) up

update-schema: ## Generate new migrations and apply them (current profile/env)
	$(ECHO_PROFILE)
	$(MAKE) generate
	$(MAKE) schema

##–––––– Profile Shortcuts ––––––––––––––––––––––––––––––––––––––––––––––––––

prod-build: ## Build images using .env.prod
	ENV_PROFILE=prod $(MAKE) build

prod-up: ## Start stack using .env.prod
	ENV_PROFILE=prod $(MAKE) up

prod-down: ## Stop stack using .env.prod
	ENV_PROFILE=prod $(MAKE) down

prod-deploy: ## Build, migrate, start using .env.prod
	ENV_PROFILE=prod $(MAKE) deploy

# -----------------------------------------------------------------------------
# DEFAULT TARGET
# -----------------------------------------------------------------------------

.DEFAULT_GOAL := help

help: ## Show available targets grouped by section (honors ENV_PROFILE=prod)
	@echo "ENV_PROFILE=$(PROFILE)  ENV_FILE=$(ENV_FILE)"
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
	    printf "  %-18s %s\n", target, desc; \
	}' $(MAKEFILE_LIST)

# -----------------------------------------------------------------------------
# Prevent conflicts with any files named the same as your targets.
# -----------------------------------------------------------------------------

.PHONY: build clean commit-migration deploy down drop-tables generate \
        help init init-backend backend-shell restart reset-db schema \
        studio studio-cert studio-check tail-logs update-schema up \
        rebuild logs prod-build prod-up prod-down prod-deploy
