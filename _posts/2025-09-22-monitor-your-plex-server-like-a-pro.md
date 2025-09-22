---
layout: post
title: "Monitor Your Plex Server Like a Pro"
date: 2025-08-22 08:00:00 -0500
categories: self-hosted
tags: plex homelab self-hosted monitoring
image:
 path: /assets/img/headers/monitor-your-plex-server-like-a-pro.webp
 lqip: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAUACgMBEQACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APjv4A/8Eu7WH4C/Hr41WHxsmtovB/w+8Y6lZeGJ/h1Hdvd6h4G8R+IPDkUtzqp8bw6bbwagmmz3b22l+F9P8p7xFuJb+W2Nzc/lOW+IdXFyp4WplNJe0xMKXMsXUlCMJpNtQqUZ1HO1VKTddr3E4Rp3kn99n3Cdso/1gnj4zlKWNpSwqy+hQhJYTGYvL4tyw06NJc0cJGreGGjPmnKMpzWri8C/8EXPBHjfwR4N8Z3fx38WWF34u8K+HvE91YWXgjw/9jsrjX9Is9VmtLTzdTeX7NbSXbQweYzSeUib2LZJ+mlnk4ylFYWlaMnFXnVbsnZXfNq+76n59DDwcIPRXjF29920Wl3Ub08233P/2Q==
---

Never have to wonder what's going on with your Plex server again.

{% include embed/youtube.html id='MmBN2Ahbdao' %}
📺 [Watch Video](https://www.youtube.com/watch?v=MmBN2Ahbdao)

Thanks to Plex for inviting me to [Plex Pro Week 2025](https://www.plex.tv/pro-week/) and for sponsoring the video!

## Plex Monitoring Stack – Prometheus + Grafana

This stack provides monitoring for a Plex media server using Prometheus, Grafana, and a set of exporters. It covers system metrics, GPU usage, disk health, container stats, and Plex activity.

All configuration files, Docker Compose setup, and dashboards for this monitoring stack are available in the [plex-monitoring-stack GitHub repository](https://github.com/timothystewart6/plex-monitoring-stack).
You'll find everything you need to get started, including environment file examples, provisioning scripts, and pre-built Grafana dashboards.  

A big thanks to the original [prometheus-plex-exporter](https://github.com/jsclayton/prometheus-plex-exporter) by jsclayton — I forked and adapted it as part of this stack.

---

## Stack Components

- **Plex** – Media server  
- **Prometheus** – Metrics collection/storage  
- **Grafana** – Visualization/dashboards  
- **Dozzle** – Container log viewer  
- **node_exporter** – CPU, memory, filesystem, network  
- **dcgm-exporter** – NVIDIA GPU stats (AMD: `rocm-device-metrics-exporter`)  
- **smartctl-exporter** – Disk health / SMART metrics  
- **cAdvisor** – Container-level metrics  
- **plex-prometheus-exporter** – Plex sessions, streams, metrics, library  

> *Note: If you also need to monitor Windows machines, install the [windows_exporter](https://github.com/prometheus-community/windows_exporter) on those hosts and add them as Prometheus scrape targets.*
{: .prompt-info }

---

## Prerequisites

- Docker + Docker Compose  
- Plex URL + Plex Token  
- NVIDIA GPU with drivers and **NVIDIA Container Toolkit** installed (required for GPU monitoring with `dcgm-exporter` and for hardware transcoding in Plex)  

---

## Setup

1. **Clone repo**

   ```bash
   git clone https://github.com/timothystewart6/plex-monitoring-stack
   cd plex-monitoring-stack
   ```

2. **Copy environment files**

   ```bash
   cp plex/.env.example plex/.env
   cp prometheus/.env.example prometheus/.env
   cp grafana/.env.example grafana/.env
   ```

   Edit values for `PLEX_URL`, `PLEX_TOKEN`, and media paths.

3. **Set environment variables**

   ```bash
   export MEDIA_PATH="/path/to/media"
   export MEDIA_SERVER_PATH="/path/to/this/repo"
   ```

4. **Create data directories**

   ```bash
   mkdir -p prometheus/data grafana/data plex/config dozzle/data
   ```

5. **Fix permissions**

   ```bash
   sudo chown -R $(id -u):$(id -g) prometheus/data grafana/data
   ```

6. **Start stack**

   ```bash
   docker compose up -d
   ```

---

## Access

- Plex → <http://localhost:32400/web>  
- Grafana → <http://localhost:3000>  
- Prometheus → <http://localhost:9090>  
- Dozzle → <http://localhost:8080>  

---

## Dashboards

Preconfigured Grafana dashboards are included:

- System metrics (CPU, memory, GPU, temps)  
- Disk health (SMART data)  
- Plex activity (sessions, streams, transcodes)  
- Container metrics (CPU, memory, network, restarts)  

---

## Troubleshooting

- **Metrics missing** → check exporter `/metrics` endpoint  
- **GPU blank** → verify NVIDIA drivers + **NVIDIA Container Toolkit** are installed  
- **SMART blank** → run `smartctl-exporter` in privileged mode  
- **Plex data empty** → confirm `PLEX_URL` and `PLEX_TOKEN`  

---

## Using Grafana

After the stack is running, open Grafana in your browser:

```text
http://localhost:3000
```

- Default username: `admin`  
- Default password: `admin` (you will be asked to change this on first login)  

Grafana in this stack comes with pre-provisioned dashboards and datasources. Once logged in, click **Dashboards → Browse** to see all available panels.

### Included Dashboards

- **Media Server Dashboard** – Full stack Plex Media Server Monitoring  
- **Plex Dashboard** – Active sessions, transcodes, library stats  
- **Server Dashboard** – CPU, memory, disk I/O, temps  
- **GPU Dashboard** – Encoder/decoder usage, temps, power draw  
- **SMART / Disk Health** – Per-drive health and temperature  
- **Container Dashboard** – Plex and other container usage (CPU, memory, bandwidth)  

You can access dashboards by:

1. Opening the left-hand menu in Grafana.  
2. Selecting **Dashboards → Browse**.  
3. Choosing from the list of imported dashboards.  

You can also use the **search bar** at the top of Grafana to quickly find dashboards by name.

---

This setup provides a single dashboard with system, Plex, and container monitoring in one place. Open Grafana, pick a dashboard, and start exploring your metrics.

## Links

🛍️ Check out the new Merch Shop at <https://l.technotim.live/shop>

⚙️ See all the hardware I recommend at <https://l.technotim.live/gear>

🚀 Don't forget to check out the [🚀Launchpad repo](https://l.technotim.live/quick-start) with all of the quick start source files

🤝 Support me and [help keep this site ad-free!](/sponsor)
