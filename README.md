# Ready-To-Deploy Django, gunicorn, NGINX, Docker Application
Getting a Django 2.0 app up in no time. In this project, gunicorn is used as a WSGI. NGINX is used as a reverse proxy server.

## Getting Started
In the root level of this repository, create a file named `production.env` and add environment variables. For example:
```
MYSITE_SECRET_KEY= put your django app secret key here
DEBUG=False
```
