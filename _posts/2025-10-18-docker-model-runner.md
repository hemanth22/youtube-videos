---

layout: post
title: "I Built a Local AI App with Docker Model Runner - Here’s How"
date: 2025-10-18 08:00:00 -0500
categories: ai self-hosted dev
tags: docker model-runner ai llm self-hosted docker-compose nextjs
image:
 path: /assets/img/headers/docker-model-runner-hero.webp
 lqip: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAUACgMBEQACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/AP5XP2m/iNpfhXVPgZ4q034V/CgWN38OfiPp+p+FbnwbY6xoviIX/g/w9cQ3/iQ+Jf7eurnWrW6vbO7i1vRJvD2q2N9Z3OqeHbvw9rGpS6lCnt81+LQH5eTa7eTzSzNb6PG00skpSHQdFhhQyOXKRQx2CxxRKTiONFCIgCqAoApgf//Z
---

Run powerful AI models **locally** with almost zero setup - and wire them into your apps using Docker tools you already know.

{% include embed/youtube.html id='4YA1n2zs6XA' %}
📺 [Watch the video](https://www.youtube.com/watch?v=4YA1n2zs6XA)

---

## What Is Docker Model Runner?

**Docker Model Runner** is a standardized way to run AI models with Docker. Instead of juggling Python versions, CUDA, and random system packages, you pull and run a **model** much like you’d pull and run an **image**. You can use it from the CLI, in Docker Desktop, and inside your Compose files.

Highlights:

* **One command to run models** (pulls on-demand)
* **OpenAI-compatible endpoints** exposed locally
* **Works with Docker Compose** alongside your app/database/cache
* **Local-first**: low latency, easy iteration, real dev/prod parity

---

## Prerequisites

* [Docker Desktop](https://dockr.ly/4nQHOYq) (Mac/Windows) **or** Docker CE (Linux)
* (Optional) GPU drivers/toolkit if you plan to use GPU acceleration

> If you’re on Docker Desktop and don’t see the model commands, update to the latest version and enable **Docker Model** in *Settings*.
{: .prompt-info }

---

## Getting Started (CLI)

Pull models just like images - but use the new `model` keyword.

```shell
# Pull OpenAI’s open-weight model hosted by Docker
docker model pull ai/gpt-oss

# Pull something smaller
docker model pull ai/llama3.2

# See what’s local
docker model list
```

You can also **run without pre-pulling**:

```shell
docker model run ai/gpt-oss
```

This will pull the model if needed and start an interactive CLI where you can chat immediately. First response may take a moment while the model warms up.

> Not a CLI person? The **Models** section in Docker Desktop lets you pull, run, and chat with models via the UI in just a couple clicks.
{: .prompt-info }

---

## Using Docker Model Runner with Compose

Anywhere you can run Docker Compose, you can run models too. Here’s a real example pairing **Open WebUI** with **Docker Model Runner**:

```yaml
services:
  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    ports:
      - "3000:8080"
    environment:
      - OPENAI_API_BASE_URL=http://model-runner.docker.internal/engines/v1
      - OPENAI_API_KEY=''
      - WEBUI_NAME=Open-WebUI with Docker Model Runner
    volumes:
      - open-webui:/app/backend/data
    depends_on:
      - docker-model-runner

  docker-model-runner:
    provider:
      type: model
      options:
        model: ai/gpt-oss

volumes:
  open-webui:
```

Bring it up:

```shell
docker compose up
```

Open WebUI will be on **[http://localhost:3000](http://localhost:3000)**, and it will talk to the model via the OpenAI-compatible URL set in `OPENAI_API_BASE_URL`. Swapping models later is just a one-line change to `options.model`.

---

## Develop Locally with `techno-boto-chat`

I built a small Next.js chat app that speaks to any OpenAI-compatible backend - including Docker Model Runner - so you can prototype quickly with local models.

Check out [`techno-boto-chat` on GitHub](https://github.com/timothystewart6/techno-boto-chat)

```shell
# Clone and set up
git clone https://github.com/timothystewart6/techno-boto-chat.git
cd techno-boto-chat
yarn install  # or npm / pnpm

# Configure environment
cp .env.example .env.local
```

Set your API base + model in `.env.local`:

```env
LLM_API_BASE_URL=http://localhost:12434/engines/v1
MODEL_NAME=ai/gpt-oss
OPENAI_API_KEY=   # optional for local models
```

Run app + model:

```shell
# Terminal A - start a local model or use Docker Desktop to start
docker model run ai/gpt-oss 

# Terminal B - run the web app
yarn dev
# then open http://localhost:3000
```

Type a prompt and you’ll see responses come back from your **local** model via Docker Model Runner. Want to try a different model? Change `MODEL_NAME` and restart.

> Prefer everything in containers? Add the app as a Compose service and point it to `model-runner.docker.internal` just like the Open WebUI example.
> {: .prompt-tip }

## Running with Docker Compose

The application is containerized for easy deployment:

```bash
# Build and deploy with Docker Compose
docker compose up --build -d

# Access your chat interface at http://localhost:3000
# Don't forget to switch your LLM_API_BASE_URL variable to http://model-runner.docker.internal/engines/v1 if you aren't exposing it on localhost:12434
```

---

## Docker Desktop vs Docker CE Endpoints

* **Docker Desktop:** `http://model-runner.docker.internal/engines/v1`
* **Docker CE (Linux):** `http://localhost:12434/engines/v1`

Inside other containers, you may need to call the host at its bridge IP (e.g., `172.17.0.1:12434`) if not using the Desktop hostname.

---

## Troubleshooting

* **Model commands missing** → update Docker Desktop and enable *Docker Model* in Settings
* **Slow first response** → initial warm-up/load is expected; subsequent prompts are faster
* **App can’t reach model** → verify `OPENAI_API_BASE_URL` (Desktop vs CE), port exposure, and network
* **Compose service ordering** → ensure your app `depends_on` the model service
* **Can't connect to localhost:12434** → ensure `Enable host-side TCP support` is enabled in Docker Desktop and you are not running inside of a container (that uses `http://model-runner.docker.internal/engines/v1`)

## Join the conversation

<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><p lang="en" dir="ltr">What is Docker Model Runner - and why should you care? I show how I use <a href="https://twitter.com/Docker?ref_src=twsrc%5Etfw">@Docker</a> Model Runner to run models locally and build a Next.js chat app.<a href="https://t.co/5iiGbf21F1">https://t.co/5iiGbf21F1</a></p>&mdash; Techno Tim (@TechnoTimLive) <a href="https://twitter.com/TechnoTimLive/status/1979571128264982767?ref_src=twsrc%5Etfw">October 18, 2025</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

---

## Links

🛍️ Check out the new Merch Shop at <https://l.technotim.com/shop>

⚙️ See all the hardware I recommend at <https://l.technotim.com/gear>

🚀 Don't forget to check out the [🚀Launchpad repo](https://l.technotim.com/quick-start) with all of the quick start source files

🤝 Support me and [help keep this site ad-free!](/sponsor)
