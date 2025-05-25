#!/bin/sh
# start.sh – Runs backend and frontend concurrently

set -e

echo "Starting backend..."
cd /app/backend
npm start &
BACKEND_PID=$!

echo "Starting frontend..."
cd /app/frontend
npm run dev &
FRONTEND_PID=$!

trap "echo 'Stopping...'; kill ${BACKEND_PID} ${FRONTEND_PID}; exit 0" SIGINT

echo "Both services started:"
echo " - Backend: http://localhost:5000"
echo " - Frontend: http://localhost:3000"

wait $BACKEND_PID $FRONTEND_PID
