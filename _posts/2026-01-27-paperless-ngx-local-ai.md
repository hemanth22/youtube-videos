---
layout: post
title: "Self-Hosted Paperless-ngx + Optional Local AI: Private Documents and Improves OCR & Search (Full Setup)"
date: 2026-01-27 08:00:00 -0500
categories: homelab
tags: paperless paperless-ngx docker self-hosted ollama open-webui paperless-ai paperless-gpt ocr ai privacy
image:
  path: /assets/img/headers/paperless-ngx-ai.webp
  lqip: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAUACgMBEQACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/AP52/Cvg/wAO/EXxl8K/Clx4W8G2U2v/AAts/HFzrUuj6rc3CSR3jaW9hJa6f4j0SDUjNHors11rB1CK2W9aPTbCw8ovNnVg6lOcI1J0XJWVSny+0h5x54zinbS7i7XurOzWOIpSr0KlGFerhpVI8qr0OT21P+9TdSFSClbS7g7Jtq0rNfPnifVfFWkeJPEOkw+IcQ6XrmradEINMtoIBHZX9xbIIYHe4eGILEBHE9xO0aYRppSC7fIZPm1LH5RlWOeDcHjctwOLcJ4urWnF4jDUqzjKrKMZVZRc7SqOMXNpycU3Y0nw9gcFOeD/AHtf6pKWG9vWqVZ1q3sG6Xtas5VHKdWpyc9SUm3Kbbbbdz//2Q==
---

Build a complete Paperless-ngx stack in Docker and take control of your documents. We’ll get Paperless running first (works great on its own), then optionally add local AI with Ollama + Open WebUI and upgrade OCR using Paperless-GPT and Paperless-AI for more accurate, searchable text and tags - no cloud required.

This post walks through a **complete, repeatable Docker Compose** for **Paperless-ngx**, plus an **optional local AI layer** that runs entirely on your own hardware.

Paperless-ngx works great **without AI**. The AI pieces are optional add-ons you can easily disable by commenting out those parts in the stack.

{% include embed/youtube.html id='NMAwHjleqHg' %}
[Watch the video](https://www.youtube.com/watch?v=NMAwHjleqHg)

---

## What Paperless-ngx Is

**Paperless-ngx** is a self-hosted document inbox that:

* Ingests scans and PDFs (via upload, a "consume" folder, or even apps)
* Runs **OCR** so documents become searchable
* Organizes using **tags**, **correspondents**, and **document types**
* Lets you search your archive like a personal document index

If you want to keep personal paperwork (tax docs, medical, contracts, receipts) under **your control**, Paperless is the way to go.

---

## What We’re Building

This stack is intentionally "batteries included" and breaks up parts of the backend into their own services, yet still easy to run.

### Core services

* **Paperless-ngx** – the document scanning and index system
* **Postgres** – database backend
* **Redis** – queue/cache
* **Gotenberg** – document conversion (Office/Excel → PDF, etc.)
* **Tika** – text extraction helpers

### Optional local AI services

* **Ollama** – local model runtime
* **Open WebUI** – model management + testing UI + chat
* **Paperless-AI** – metadata suggestions (tags/titles/etc.)
* **Paperless-GPT** – vision-model OCR + metadata suggestions

### Optional utility

* **Dozzle** – lightweight log viewer, highly recommended for container troubelshooting

---

## Document flow

Data flow (no AI):

Documents → Paperless-ngx → OCR/index/search

Data flow (optional AI):

Paperless-ngx ↔ (Paperless-AI / Paperless-GPT) ↔ Ollama

* Paperless stores and indexes your docs.
* Ollama runs the LLMs locally.
* Paperless-AI / Paperless-GPT are add-ons that call Ollama and write results back to Paperless.
* AI can enhance correspondents, tags, and text recognition (OCR)

---

## Prerequisites

* A **Linux server** (VM, mini PC, NAS — really anything that can run Docker)
* **Docker + Docker Compose**
* Optional but recommended for vision OCR: *(*an **NVIDIA GPU***)*
* If using an NVIDIA GPU, be sure you have the [proper drivers and NVIDIA Container Toolkit installed](https://docs.docker.com/engine/containers/resource_constraints/#gpu)
* You can run Docker with a GPU other than NVIDIA, though some [extra configuration is needed](https://docs.docker.com/compose/how-tos/gpu-support/)

---

## Ports Used in This Guide

This is the exact port map used in the stack below:

| Service       | Port | URL                       |
| ------------- | ---- | ------------------------- |
| Paperless-ngx | 8000 | `http://<server-ip>:8000` |
| Paperless-AI  | 3000 | `http://<server-ip>:3000` |
| Open WebUI    | 3001 | `http://<server-ip>:3001` |
| Paperless-GPT | 3002 | `http://<server-ip>:3002` |
| Dozzle (logs) | 8080 | `http://<server-ip>:8080` |

---

## Docker Compose Stack

Everything runs from a single Compose file. I keep a **separate `.env` per service** so secrets stay scoped to only services that need them.

I’m not going to paste every `.env` file inline here (it gets long fast). Instead, the repository includes copy/paste-ready .env files for each service.

**Complete configuration + files:** [https://github.com/timothystewart6/paperless-stack](https://github.com/timothystewart6/paperless-stack)

### Compose file

Create a `compose.yaml` file in a folder like `paperless-stack` and place the contents of the compose file:

```yaml
services:
  # paperless-ngx main service
  paperless:
    image: ghcr.io/paperless-ngx/paperless-ngx:latest
    container_name: paperless-ngx
    restart: unless-stopped
    env_file: 
      - ./paperless/.env
    depends_on:
      - postgres
      - redis
      - gotenberg
      - tika
    ports:
      - "8000:8000"
    volumes:
      - ./paperless/data:/usr/src/paperless/data
      - ./paperless/media:/usr/src/paperless/media
      - ./paperless/export:/usr/src/paperless/export
      - ./paperless/consume:/usr/src/paperless/consume
  
  # postgres database for paperless-ngx
  postgres:
    image: postgres:18
    restart: unless-stopped
    container_name: postgres
    env_file: 
      - ./postgres/.env
    volumes:
      - ./postgres/data:/var/lib/postgresql
  
  # redis database for paperless-ngx
  redis:
    image: docker.io/library/redis:8
    container_name: redis
    restart: unless-stopped
    env_file: 
      - ./redis/.env
    volumes:
      - ./redis/data:/data
  
  # gotenberg service that paperless uses for document conversion
  gotenberg:
    image: docker.io/gotenberg/gotenberg:8.25
    container_name: gotenberg
    env_file: 
      - ./gotenberg/.env
    restart: unless-stopped
    command:
      - "gotenberg"
      - "--chromium-disable-javascript=true"
      - "--chromium-allow-list=file:///tmp/.*"
  
  # tika service that paperless uses for document text extraction
  tika:
    image: docker.io/apache/tika:latest
    container_name: tika
    restart: unless-stopped
    env_file: ./tika/.env
  

    # open-webui service for LLM interaction
  open-webui:
    image: ghcr.io/open-webui/open-webui:latest
    container_name: open-webui
    restart: unless-stopped
    env_file:
      - ./open-webui/.env
    depends_on:
      - ollama
    ports:
      - "3001:8080"
    volumes:
      - ./open-webui/data:/app/backend/data

  # ollama service for local LLMs
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    env_file:
      - ./ollama/.env
    volumes:
      - ./ollama/data/:/root/.ollama
      - ./ollama/models:/ollama-models
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

  # paperless-ai service
  paperless-ai:
    image: clusterzx/paperless-ai:latest
    container_name: paperless-ai
    restart: unless-stopped
    depends_on:
      - ollama
      - paperless
    ports:
      - "3000:3000"
    env_file:
      - ./paperless-ai/.env
    volumes:
      - ./paperless-ai/data:/app/data
  

  # paperless-gpt service
  paperless-gpt:
    image: icereed/paperless-gpt:latest
    container_name: paperless-gpt
    restart: unless-stopped
    depends_on:
      - ollama
      - paperless
    ports:
      - "3002:8080"
    env_file:
      - ./paperless-gpt/.env
    volumes:
      - ./paperless-gpt/prompts:/app/prompts


  # optional but helpful log viewer
  dozzle:
    image: amir20/dozzle:latest
    restart: unless-stopped
    container_name: dozzle
    env_file: 
      - ./dozzle/.env
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./dozzle/data:/data
    ports:
      - "8080:8080"
```

---

## Without local AI

If you don't want your stack to use local AI, comment out or remove:

* `open-webui`
* `ollama`
* `paperless-ai`
* `paperless-gpt`

## Create the folder structure

If you’re using bind mounts (like this stack does), it’s nice to create the folder structure up front so Docker doesn’t create directories as `root`.

```bash
mkdir -p \
  paperless/{data,media,export,consume} \
  postgres/data \
  redis/data \
  gotenberg \
  tika \
  paperless-ai/data \
  open-webui/data \
  ollama/{data,models} \
  paperless-gpt/prompts \
  dozzle/data
```

## Project layout

Here’s the folder/file layout used in this guide, with the project root named `paperless-stack`:

```txt
paperless-stack/
├── docker-compose.yml
├── dozzle/
│   ├── .env
│   └── data/
├── gotenberg/
│   ├── .env
├── ollama/
│   ├── .env
│   ├── data/
│   └── models/
├── open-webui/
│   ├── .env
│   └── data/
├── paperless/
│   ├── .env
│   ├── consume/
│   ├── data/
│   ├── export/
│   └── media/
├── paperless-ai/
│   ├── .env
│   └── data/
├── paperless-gpt/
│   ├── .env
│   └── prompts/
├── postgres/
│   ├── .env
│   └── data/
├── redis/
│   ├── .env
│   └── data/
└── tika/
    └── .env
```

## Step 1 — Start Everything

Inside of the folder with your compose file:

```console
docker compose up -d
```

If you want to watch logs while services come up:

```console
docker compose logs -f
```

Or open Dozzle at `http://<server-ip>:8080`.

---

## Step 2 — Set Up Paperless-ngx

Open Paperless:

* `http://<server-ip>:8000`

Create your admin account and sign in.

At this point, Paperless-ngx is fully functional *without any AI*. You can upload documents and start building your library.

---

## Step 3 — Optional: Local AI Backend (Ollama + Open WebUI)

If you want local AI features, start by confirming Ollama is running and then use Open WebUI to pull a model.

Open WebUI:

* `http://<server-ip>:3001`

### Pull a model

In Open WebUI:

* **Admin Panel → Settings → Models**

A good lightweight model to start with:

* `llama3.2:3b`

Once it’s downloaded, do a quick chat test to confirm it responds.

If you're using a GPU other than NVIDIA, you'll need to update your `.env` and [docker compose accordingly](https://docs.docker.com/compose/how-tos/gpu-support/).

---

## Step 4 — Optional: Paperless-AI (Tagging/Titles/Metadata)

Paperless-AI needs an API token from Paperless.

### Create a Paperless API token

In Paperless:

* Profile → API Tokens → Generate

Copy the token and place it in your `paperless-ai/.env`.

Then restart:

```console
docker compose restart
```

Open Paperless-AI:

* `http://<server-ip>:3000`

Create an account and confirm it can connect to Paperless.

---

## Step 5 — Optional: Paperless-GPT (Vision OCR + Metadata)

This is the piece that made the biggest difference for me.  OCR is night and day.

Paperless-GPT can run OCR using a **vision-capable LLM** (via Ollama), which can be dramatically more accurate on certain scans than traditional OCR.

Be sure a vision model like `minicpm-v:8b` is set in your `.env`

You will also need to download this model for Ollama using Open WebUI

* `http://<server-ip>:3001`
* In Admin Panel → Settings → Models, pull down model `minicpm-v:8b`

Open Paperless-GPT:

* `http://<server-ip>:3002`

### How Paperless-GPT finds documents

Paperless-GPT watches for tags. Add a tag like `paperless-gpt-ocr-auto` (or your configured tag) to a document in Paperless, and it will show up in the Paperless-GPT UI.

### Manual OCR test

1. Open a document in Paperless
2. Copy the document ID from the URL
3. In Paperless-GPT, go to OCR and run a job using that ID
4. Save the result back to the document

Now check the Paperless **Content** tab — the extracted text should be far more accurate and actually searchable.

---

## Automate OCR with Workflows

If you want OCR to happen automatically, create a Paperless workflow that applies tags on upload.

Example workflow:

* Trigger: **On document added**
* Action: Add tags:

  * `paperless-gpt-auto`
  * `paperless-gpt-ocr-auto`

Once those tags are applied, Paperless-GPT can automatically process new documents. This will process both tags and content (OCR)

---

## Security Note: Remote Access

Paperless contains personal documents. I recommend using a VPN for remote access rather than exposing this directly to the internet.  The same goes for all other services in this stack.

---

## Troubleshooting

A few common checks:

* **It doesn't work:**  open Dozzle at `http://<server-ip>:8080` and read the logs.
* **Paperless won’t load:** `docker compose ps` and check logs for `paperless`
* **AI add-ons can’t connect:** verify URLs are using Compose service names (like `http://paperless:8000`) when running inside Docker
* **Models are slow:** start with a small model, and consider GPU acceleration for vision OCR
* **Nothing shows in Paperless-GPT:** confirm the correct tag is applied to a document in Paperless

---

## Summary

With this you now have:

* A full self-hosted document archive with OCR + search
* A repeatable Docker Compose deployment
* Optional local AI features that doesn't depend on the cloud
* Vision-model OCR (via Paperless-GPT) for improved text extraction on tough scans

---

🤝 Support the channel and [help keep this site ad-free](/sponsor)

🛍️ Check out all merch: [https://shop.technotim.com/](https://shop.technotim.com/)

⚙️ See all the hardware I recommend at [https://l.technotim.com/gear](https://l.technotim.com/gear)
