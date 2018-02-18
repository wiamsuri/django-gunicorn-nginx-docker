# Ready-To-Deploy Django, gunicorn, NGINX, Docker Application
Getting a Django 2.0 app up in no time. In this project, gunicorn is used as a WSGI. NGINX is used as a reverse proxy server.

## Getting Started
Here is a script to install docker and docker-compose. After running these commands, exit from ssh and reconnect to the instance. This can be used in AWS Launch Config
```
#!/bin/bash
sudo yum -y update
sudo yum install -y docker
sudo usermod -a -G docker ec2-user
sudo service docker start
sudo pip install docker-compose
```

In the root level of this repository, create a file named `production.env` and add environment variables. For example:
```
MYSITE_SECRET_KEY= put your django app secret key here
DEBUG=False
```

Run docker compose commands
```
docker-compose build
```

Run the built container
```
docker-compose up -d
```
