# Makefile - Build, deploy, and manage Drizzle ORM for ConferenceRegApp

# -----------------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------------
DOCKER_COMPOSE := docker-compose
DRIZZLE := npx drizzle-kit
BACKEND_DIR := backend
FRONTEND_DIR := frontend

# -----------------------------------------------------------------------------
# DRIZZLE ORM: DATABASE SCHEMA MANAGEMENT
# -----------------------------------------------------------------------------

generate: ## Generate SQL migration script (does NOT apply it)
	cd $(BACKEND_DIR) && $(DRIZZLE) generate:mysql

schema: ## Push current schema to the database (live migration)
	cd $(BACKEND_DIR) && $(DRIZZLE) push:mysql

studio: ## Launch Drizzle Studio (visual schema browser, optional)
	cd $(BACKEND_DIR) && $(DRIZZLE) studio

# -----------------------------------------------------------------------------
# DOCKER: CONTAINER LIFECYCLE
# -----------------------------------------------------------------------------

build: ## Build Docker images for frontend and backend
	$(DOCKER_COMPOSE) build

up: ## Start containers in detached mode
	$(DOCKER_COMPOSE) up -d

down: ## Stop and remove containers
	$(DOCKER_COMPOSE) down

restart: down up ## Restart all containers

logs: ## Tail logs from all containers
	$(DOCKER_COMPOSE) logs -f

clean: ## Stop and remove all containers, volumes, and images
	$(DOCKER_COMPOSE) down --volumes --rmi all

# -----------------------------------------------------------------------------
# HIGH-LEVEL COMPOSITES
# -----------------------------------------------------------------------------

deploy: build schema up ## Build images, apply schema, and launch the stack

migrate: generate schema ## Run full schema lifecycle: generate -> push

# -----------------------------------------------------------------------------
# DEFAULT TARGET
# -----------------------------------------------------------------------------

.DEFAULT_GOAL := help

help: ## Show available targets
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
