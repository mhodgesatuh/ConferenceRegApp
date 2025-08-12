# Local Development Setup for ConferenceReg

<!-- TOC -->
* [Setup](#setup)
  * [1. Install Docker Desktop](#1-install-docker-desktop)
  * [2. Install Required Tools](#2-install-required-tools)
  * [3. Clone the Repository](#3-clone-the-repository)
  * [4. Configure Environment Variables](#4-configure-environment-variables)
  * [5. Install Project Dependencies](#5-install-project-dependencies)
    * [/etc/hosts](#etchosts)
    * [Backend (Express, Drizzle ORM)](#backend-express-drizzle-orm)
    * [Frontend (React, Vite)](#frontend-react-vite)
    * [One-Time Setup for shadcn/ui (run from `frontend`)](#one-time-setup-for-shadcnui-run-from-frontend)
  * [6. Install dotenv-cli](#6-install-dotenv-cli)
  * [7. Drizzle ORM CLI](#7-drizzle-orm-cli)
  * [8. Initialize the Database](#8-initialize-the-database)
  * [9. Start the Frontend (Vite Dev Server)](#9-start-the-frontend-vite-dev-server)
  * [10. Useful Development Commands](#10-useful-development-commands)
* [Makefile Commands](#makefile-commands)
  * [**Logs**](#logs)
  * [**Quick Start**](#quick-start)
  * [**Drizzle ORM: Schema Management**](#drizzle-orm-schema-management)
  * [**Docker: Container Lifecycle**](#docker-container-lifecycle)
  * [**Frontend Development**](#frontend-development)
  * [**High-Level Composites**](#high-level-composites)
* [You're Ready!](#youre-ready)
* [Future work](#future-work)
<!-- TOC -->

# Setup
This guide walks you through setting up your local development environment on
macOS for the **ConferenceRegApp** project. It covers required tools, project
dependencies, containerization, and workflow setup.

---

## 1. Install Docker Desktop

Docker is required for managing the MariaDB database in containers.

- Download and install Docker Desktop for Mac:  
  https://www.docker.com/products/docker-desktop

- After installation, **launch Docker Desktop** and ensure it's running before proceeding.

---

## 2. Install Required Tools

These tools are installed via [Homebrew](https://brew.sh/). If Homebrew is not
yet installed:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Install the project tools:

```bash
brew install git node npm docker
```

---

## 3. Clone the Repository

```bash
git clone https://github.com/mhodgesatuh/ConferenceRegApp.git
cd ConferenceRegApp
```

---

## 4. Configure Environment Variables

Copy the example environment file and adjust the values for your local setup:

```bash
cp .env.sample .env
```

These variables configure MariaDB, the backend server, and the frontend port.

The backend uses a logger that writes files to the directory specified by the
`LOG_DIR` environment variable. For development you can set `LOG_DIR=./logs` to
store logs in a local `logs` folder. In production, point `LOG_DIR` to a
persistent location such as `/var/log/conference-reg` and mount that path as a
volume so the logs survive container restarts.

---

## 5. Install Project Dependencies

### /etc/hosts
When Drizzle executes on the host, it cannot resolve conference-db, producing 
the ENOTFOUND error. To resolve that add the following entry for development in 
the localhost environment.

    127.0.0.1 conference-db

### Backend (Express, Drizzle ORM)

```bash
cd backend
npm install
```

### Frontend (React, Vite)

```bash
cd ../frontend
npm install
```

### One-Time Setup for shadcn/ui (run from `frontend`)

```bash
npx shadcn@latest
npx shadcn@latest init
npx shadcn@latest add checkbox
npx shadcn@latest add input
npx shadcn@latest add button
```

---

## 6. Install dotenv-cli

Use `dotenv-cli` to load `.env` variables into `make` and CLI tools.

Install it into the root project as a development dependency:

```bash
npm install -D dotenv-cli
```

Optionally, install it globally (not required):

```bash
npm install -g dotenv-cli
```

---

## 7. Drizzle ORM CLI

The Drizzle CLI is used for schema management and DB migrations.

It's already listed in `backend/devDependencies` and can be reinstalled:

```bash
cd backend
npm install -D drizzle-kit
cd ..
```

---

## 8. Initialize the Database

To reset the MariaDB container and apply the schema:

```bash
make init
```

This command:

- Confirms Docker is running
- Removes the existing DB container and volume (`mariadb_data`)
- Starts a new MariaDB container using `.env` settings
- Pushes the current schema using Drizzle

---

## 9. Start the Frontend (Vite Dev Server)

In a separate terminal tab or window:

```bash
make frontend-dev
```

This will:

- Install frontend dependencies if needed
- Start the Vite dev server on `http://localhost:3000`

---

## 10. Useful Development Commands

# Makefile Commands

## **Logs**
| Command | Description |
|---------|-------------|
| `logs` | View logs for current environment (dev if `LOG_DIR` is set to `./logs`, else prod) |

## **Quick Start**
| Command | Description |
|---------|-------------|
| `init` | Initialize dev environment: install deps, reset DB, and apply schema |
| `init-backend` | Rebuild and restart the backend container only |

## **Drizzle ORM: Schema Management**
| Command | Description |
|---------|-------------|
| `baseline` | Snapshot current schema into a new “init” migration |
| `drop-tables` | Drop all existing tables in the database |
| `reset-db` | Completely remove and recreate the database from `.env` |
| `schema` | Incrementally apply only new migrations to the database |
| `generate` | Diff schema locally → write SQL + journal (then run `make commit-migrations`) |
| `commit-migration` | Stage & commit new Drizzle migration files |
| `studio-check` | Verify certs & hosts entry for Drizzle Studio |
| `studio-cert` | Generate & install dev certs for Drizzle Studio (requires mkcert) |
| `studio` | Launch Drizzle Studio |

## **Docker: Container Lifecycle**
| Command | Description |
|---------|-------------|
| `build` | Build Docker images for frontend and backend |
| `up` | Start containers in detached mode |
| `down` | Stop and remove containers |
| `restart` | Restart all containers |
| `tail-logs` | Tail logs from all containers |
| `clean` | Stop and remove all containers, volumes, and images |

## **Frontend Development**
| Command | Description |
|---------|-------------|
| `init-frontend` | Rebuild and restart the frontend container only |
| `frontend-dev` | Run the frontend dev server (Vite) |
| `frontend-install` | Install frontend dependencies |
| `frontend-build` | Build the frontend (for production) |
| `frontend-clean` | Remove frontend dist build |

## **High-Level Composites**
| Command | Description |
|---------|-------------|
| `deploy` | Build images, apply only new migrations, and start the stack |
| `update-schema` | Generate new migrations and apply them |
| `help` | Show available targets grouped by section |

---

# You're Ready!

Your environment is now set up to develop and test the **ConferenceRegApp** project locally on macOS.

Make sure Docker Desktop remains running while you develop.

To confirm everything is working, try:

```bash
make init
```

Then visit: [http://localhost:3000](http://localhost:3000)

---
# Future work

If you’re using a single npm install and haven’t forced production mode, devDependencies (including rimraf) will already be pulled in.

If you have NODE_ENV=production set in your Dockerfile or CI, switch to a two-stage build so that the builder stage sees devDependencies and the runtime stage only gets production deps:

dockerfile
Copy
Edit

---




