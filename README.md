# Local Development Setup for ConferenceRegApp (macOS)

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

## 4. Install Project Dependencies

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

### 🛠 One-Time Setup for shadcn/ui

If this is your first time working on the UI:

```bash
npx shadcn@latest
npx shadcn@latest init
npx shadcn@latest add checkbox
npx shadcn@latest add input
npx shadcn@latest add button
```

Return to project root:

```bash
cd ..
```

---

## 5. Install dotenv-cli

We use `dotenv-cli` to load `.env` variables into `make` and CLI tools.

Install it into the root project as a development dependency:

```bash
npm install -D dotenv-cli
```

Optionally, install it globally (not required):

```bash
npm install -g dotenv-cli
```

---

## 6. Drizzle ORM CLI

The Drizzle CLI is used for schema management and DB migrations.

It's already listed in `backend/devDependencies`, but you can reinstall it
explicitly:

```bash
cd backend
npm install -D drizzle-kit
cd ..
```

---

## 7. Initialize the Database

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

## 8. Start the Frontend (Vite Dev Server)

In a separate terminal tab or window:

```bash
make frontend
```

This will:

- Install frontend dependencies if needed
- Start the Vite dev server on `http://localhost:8080`

---

## 9. Useful Development Commands

| Command               | Description                                  |
|-----------------------|----------------------------------------------|
| `make init`           | Reset DB container, apply schema             |
| `make schema`         | Push current schema to the database          |
| `make build`          | Build Docker images                          |
| `make up`             | Start containers in detached mode            |
| `make down`           | Stop and remove containers                   |
| `make logs`           | View logs from running containers            |
| `make frontend`       | Start Vite dev server                        |
| `make frontend-build` | Build frontend for production                |
| `make clean`          | Remove all containers, volumes, and images   |
| `make studio`         | Launch Drizzle Studio (web UI for DB schema) |
| `make migrate`        | Generate and push a schema migration         |
| `make help`           | List all make targets                        |

---

## 10. Environment Configuration

Ensure you update the `.env` file in the project root:

These variables therein are used to:

- Configure MariaDB during container creation
- Set database credentials for Drizzle and the backend server
- Specify the frontend development server port

---

## You're Ready!

Your environment is now set up to develop and test the **ConferenceRegApp** project locally on macOS.

Make sure Docker Desktop remains running while you develop.

To confirm everything is working, try:

```bash
make init
```

Then visit: [http://localhost:3000](http://localhost:3000)

---

## Future work

If you’re using a single npm install and haven’t forced production mode, devDependencies (including rimraf) will already be pulled in.

If you have NODE_ENV=production set in your Dockerfile or CI, switch to a two-stage build so that the builder stage sees devDependencies and the runtime stage only gets production deps:

dockerfile
Copy
Edit
# ─── Builder Stage ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app/backend
COPY backend/package*.json tsconfig.base.json tsconfig.json ./
# installs both dependencies & devDependencies
RUN npm ci
COPY backend/ ./
RUN npm run build    # runs "npm run clean && tsc"

# ─── Runtime Stage ─────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app/backend
# only install production deps
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/backend/dist ./dist

EXPOSE 5000
CMD ["node", "dist/src/index.js"]
Builder: npm ci brings in rimraf, TypeScript, etc., so your npm run build can rimraf dist before compiling.

Runtime: npm ci --omit=dev installs only your "dependencies", keeping the final image lean.

Rebuild your image

bash
Copy
Edit
docker build -t conference-backend .
Verify

bash
Copy
Edit
docker run --rm conference-backend \
sh -c "ls node_modules/rimraf && node dist/src/index.js"
You should see the rimraf folder in node_modules in the builder stage (not in the final runtime), and your app should start without errors.

Why this works

Committing rimraf to devDependencies makes it available for any npm install that includes devDeps.

A multi-stage build lets you isolate dev tools (like rimraf) in the build image but strip them out of the runtime image.

That way, npm run clean (and npm run build) always succeed inside Docker, and your production container stays as small as possible.







