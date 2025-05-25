# Dockerfile
#

FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy backend source and install dependencies
COPY ./backend /app/backend
WORKDIR /app/backend
RUN npm install

# Copy frontend source and install dependencies
COPY ./frontend /app/frontend
WORKDIR /app/frontend
RUN npm install react-router-dom

# Copy startup script and make it executable
COPY ./start.sh /app/start.sh
WORKDIR /app
RUN chmod +x start.sh

# Run the unified start script
CMD ["/bin/sh", "start.sh"]
