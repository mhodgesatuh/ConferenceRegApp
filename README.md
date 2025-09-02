# Local Development for ConferenceReg

<!-- TOC -->
* [Local Development for ConferenceReg](#local-development-for-conferencereg)
  * [Overview](#overview)
  * [Technologies Used in This Project](#technologies-used-in-this-project)
  * [Requirements for macOS](#requirements-for-macos)
  * [Developer Notes](#developer-notes)
* [Setup for macOS](#setup-for-macos)
  * [1. Install Docker Desktop](#1-install-docker-desktop)
  * [2. Clone the Repository](#2-clone-the-repository)
  * [3. Install Required Tools](#3-install-required-tools)
  * [4. Configure Environment Variables](#4-configure-environment-variables)
  * [5. Install Project Dependencies](#5-install-project-dependencies)
    * [/etc/hosts](#etchosts)
    * [Backend (Express, Drizzle ORM)](#backend-express-drizzle-orm)
    * [Frontend (React, Vite)](#frontend-react-vite)
    * [One-Time Setup for shadcn/ui (run from `frontend`)](#one-time-setup-for-shadcnui-run-from-frontend)
  * [6. Install dotenv-cli](#6-install-dotenv-cli)
  * [7. Install Drizzle ORM CLI](#7-install-drizzle-orm-cli)
  * [8. Initialize the Database](#8-initialize-the-database)
  * [makefile](#makefile)
* [Docker Desktop Bug Workaround](#docker-desktop-bug-workaround)
* [You're Ready!](#youre-ready)
* [Future work](#future-work)
<!-- TOC -->

## Overview

This README presents the technical overview for the developer. See the docs
folder for application information.

## Technologies Used in This Project

- Docker & Docker Compose – Containerization and orchestration 
- Drizzle ORM – Database schema & query management 
- Express – Backend web framework
- MariaDB – Relational database 
- Nginx – Reverse proxy and static file serving
- Node.js – Server-side runtime
- React – Frontend UI library 
- Tailwind CSS – Utility‑first CSS framework 
- TanStack Query – Data fetching & state synchronization for React 
- TypeScript – Static typing for both backend and frontend code 
- Vite – Frontend build tool and dev server 
- Vitest – Testing framework 

## Requirements for macOS

- [Docker](https://www.docker.com/) with Docker Compose
- `git` and `make`

## Developer Notes

- Frontend: <https://localhost:8080/>
- Makefile commands honor the `ENV_PROFILE` variable. Set `ENV_PROFILE=prod` to run against the production profile.
- Command `make ensure-drizzle-deps` updates Drizzle.
- TLS certificates are stored in `backend/certs` and are mounted into the backend container.

# Setup for macOS
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

## 2. Clone the Repository

From the command line cd to the directory into which the project will be 
downloaded. This will be your project directory.

```bash
git clone https://github.com/mhodgesatuh/ConferenceRegApp.git
cd ConferenceRegApp
```

For the rest of this installation process you will be working in the root 
`ConferenceRegApp` or else the `frontend` or `backend` child directories.

---

## 3. Install Required Tools

These macOS tools are installed via [Homebrew](https://brew.sh/). If Homebrew 
is not yet installed:

```bash
# Download
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# Update
brew update
# Node
brew install node
# Verify installation
node -v
npm -v
```

If you already had Node.js installed with Homebrew and upgraded it, you may 
need to relink:

```bash
brew link --overwrite node
```

Install the project development tools

- Ensure `ConferenceRegApp` is the current working directory.

```bash
brew install git node npm docker
brew install mkcert nss
mkcert -install  # creates & trusts a local root CA
mkdir -p backend/certs
# Generate the self-signed cert so that we can use https.
mkcert -key-file backend/certs/localhost-key.pem \
       -cert-file backend/certs/localhost.pem \
       localhost 127.0.0.1 ::1
```

---

## 4. Configure Environment Variables

Copy the example environment file and adjust the values for your local setup.

- Ensure `ConferenceRegApp` is the current working directory.

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
When Drizzle executes on the host, it cannot resolve `conference-db`, producing 
the `ENOTFOUND` error. To resolve this, add the following entry for development  
in the localhost environment.

    127.0.0.1 conference-db

### Backend (Express, Drizzle ORM)

NPM (Node Package Manager) is the default package manager that comes bundled with 
Node.js.  It is used to manage code packages (or libraries) for  Node.js projects.

Ensure `ConferenceRegApp/backend` is the current working directory.

```bash
npm install
npm install compression
npm install -D @types/compression
npm i module-alias
npm i -D tsconfig-paths
```

### Frontend (React, Vite)

NPM must also be installed on the frontend since it is will be running in its own
container.

Ensure `ConferenceRegApp/frontend` is the current working directory.

```bash
npm install
```

### One-Time Setup for shadcn/ui (run from `frontend`)

Shadcn is a collection of reusable React components that are copied directly into
the project.

- Ensure `ConferenceRegApp/frontend` is the current working directory.

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

- Ensure `ConferenceRegApp` is the current working directory.

```bash
npm install -D dotenv-cli
```

---

## 7. Install Drizzle ORM CLI

The Drizzle CLI is used for schema management and DB schema updates such that
data can be preserved.

- Ensure `ConferenceRegApp/backend` is the current working directory.

```bash
npm install -D drizzle-kit
```

Recommended: `cd` back to `ConferenceRegApp`.

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

## makefile

The following will provide a full list of the makefile commands available for
working on this project.

```bash
make
```
---

# Docker Desktop Bug Workaround

The mounting of the log file fails due to docker security, and there is a bug
that prevents adding the following from Docker Desktop directly. So this is the
workaround.

```bash
# This is the file to be edited.
ls -al "Library/Group Containers/group.com.docker/settings.json"
```

Update the section of the file that appears as follows, where the last line is
the new one in the macOS example. Replace `user` and `project_path` accordingly.

    "filesharingDirectories": [
    "/Users",
    "/Volumes",
    "/private",
    "/tmp",
    "/var/folders",
    "/Users/user/project_path/ConferenceRegApp/logs"
],

---

# You're Ready!

Your environment is now set up to develop and test the **ConferenceRegApp** 
project locally on macOS.

Make sure Docker Desktop remains running while you develop.

To confirm everything is working, try:

```bash
make init
```

Then visit: [https://localhost:8080](https://localhost:8080)

---
# Future work

If you’re using a single npm install and haven’t forced production mode, devDependencies (including rimraf) will already be pulled in.

If you have NODE_ENV=production set in your Dockerfile or CI, switch to a two-stage build so that the builder stage sees devDependencies and the runtime stage only gets production deps:

dockerfile
Copy
Edit

---




