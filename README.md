# Ready-To-Deploy Django, gunicorn, NGINX, Docker Application
Getting a Django 3.1 app up in no time. In this project, gunicorn is used as a WSGI. NGINX is used as a reverse proxy server.

## Premise
I have seen one too many Dockerfile with unreadable code. Many code base out there have Docker setup so elaborately that it is unmodifiable. Here, I try to simplify Dockerfile and Docker Compose file as much as possible, so that more than one developer in a team will understand how it works.

## Getting Started
Here is a script to install docker and docker-compose. After running these commands, exit from ssh and reconnect to the instance. This can be used in AWS Launch Config
```
#!/bin/bash
sudo yum -y update
sudo yum install -y docker
sudo usermod -a -G docker $(whoami)
sudo service docker start
sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```
For Ubuntu
```
sudo apt update
sudo apt install -y docker.io
sudo usermod -a -G docker $(whoami)
sudo service docker start
sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

In the root level of this repository, copy the file named `django.env.example` to `django.env` and adjust file variables

```
cp django.env.example django.env
```

Build code with docker compose
```
docker-compose build
```

Run the built container
```
docker-compose up -d
```
