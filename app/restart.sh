#! /bin/sh
watchmedo shell-command --patterns='&quot;*.py;*.html;*.css;*.js&quot;' --recursive --command='echo &quot;${watch_src_path}&quot; && kill -HUP `cat gunicorn.pid`' & gunicorn --reload --workers=2 --bind=0.0.0.0:8000 mysite.wsgi:application
