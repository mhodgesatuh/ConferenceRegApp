# ConferenceRegApp

# Manual Build

    cd /...path.../ConferenceRegApp
    docker compose build
    docker compose up -d

# Terminal Prep for macOS

Given that Docker Desktop will provide docker support, rather than docker being
installed in the OS, the following are required.

First install Docker Desktop and login to Docker Hub.

Add to .zshrc:

    export DOCKER_HOST=unix:///Users/mhodges/.docker/run/docker.sock

Then:

    source ~/.zshrc
    sudo ln -s /Applications/Docker.app/Contents/Resources/bin/docker /usr/local/bin/docker
    sudo ln -s /Applications/Docker.app/Contents/Resources/bin/docker-credential-desktop /usr/local/bin/docker-credential-desktop

# Best Practice for Mixed CLI + IntelliJ Use + Docker Desktop

Set ~/.docker/config.json to

    { "credsStore": "desktop" }

In IntelliJ
- Add Docker Registry with your Docker Hub PAT (for registry browsing/push)
- Use Docker Desktop as the Docker API
- Do not use docker login manually unless necessary, and never with different credentials than the GUI

# Troubleshooting

Check that docker is available from terminal

    docker info

If docker reports a credential error, logout of docker

    % docker logout
    WARNING: error getting credentials - err: exit status 1, out: ``
    Removing login credentials for https://index.docker.io/v1/
    WARNING: could not erase credentials:
    https://index.docker.io/v1/: error erasing credentials - err: exit status 1, out: ``

And check that ~/.docker/config.json is set correctly (see above).
