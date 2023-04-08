FROM python:3.11-slim-buster

RUN apt-get update && apt-get upgrade -y

ENV APP_ROOT /app
WORKDIR ${APP_ROOT}

ARG POETRY_VERSION=1.4.2
RUN pip install poetry==$POETRY_VERSION
RUN poetry config virtualenvs.create false

COPY pyproject.toml poetry.lock ./
RUN poetry install --no-interaction --no-root --no-cache

COPY . ${APP_ROOT}

CMD ["gunicorn", "-c", "gunicorn.conf.py", "config.wsgi:application"]
