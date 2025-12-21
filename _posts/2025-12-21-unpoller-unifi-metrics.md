---
layout: post
title: "Building Enterprise-Style UniFi Observability with Unpoller, Prometheus, and Grafana"
date: 2025-12-21 08:00:00 -0500
categories: homelab
tags: unifi unpoller grafana prometheus homelab monitoring observability
image:
  path: /assets/img/headers/unpoller-unifi-metrics.webp
  lqip: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAYACgMBEQACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/AP5gNN+OP7KemeG/DmlX37HXw/17UNM8P2Gl3uvan4h+NlvqfiK/tIrO3n8Va5/YXx50WwGv382mSS3dpomnaL4U3alqMlp4btPNtorSXHNW9MRgk0/ei8NWs/djtL6w2tWnaz0ur3fMtVHLravF2a2VOj/e6+1s7NfyrR3338n1CD9nLWNQvtXt/DnxJ8NW+q3lzqUHh3QdQ0afQtAhvpnuotF0WfxJc6/4im0nSklWx06XX9d1rWpLOCF9V1bUr4z3k1OrjE2n9WbTtflq620/nOmOGylxi3Ux6bSbSoYbqr/8/j//2Q==
---

If you run a UniFi network in a homelab or small environment, there’s a point where basic status pages stop being enough. You want to understand *how your network behaves over time* - what normal looks like, what’s changing, and how those changes correlate with real issues.

This post walks through building an **enterprise-style observability stack** for UniFi using **Unpoller, Prometheus, and Grafana**, in a way that’s repeatable, approachable, and easy to run in a homelab.

The goal is not just better charts, but better understanding - and hands-on experience with tooling that’s widely used in production environments.

{% include embed/youtube.html id='cVCPKTHEnI8' %}
[Watch the video](https://www.youtube.com/watch?v=cVCPKTHEnI8)

---

## What We’re Building

At a high level, we’re collecting metrics from UniFi devices and making them available for long-term analysis and visualization.

Data flow:
UniFi Devices → Unpoller → Prometheus → Grafana

- **UniFi devices** expose metrics via the UniFi Network API
- **[Unpoller](https://github.com/unpoller/unpoller)** collects those metrics and exposes them in Prometheus format
- **[Prometheus](https://github.com/prometheus/prometheus)** scrapes and stores metrics over time
- **[Grafana](https://github.com/grafana/grafana)** visualizes the data using dashboards

This pattern - exporter, time-series storage, visualization - is extremely common in enterprise environments, and it scales down very nicely to a homelab.

---

## Why Observability Matters

Point-in-time status is useful, but it only tells you what’s happening *right now*. Observability gives you:

- Historical trends
- Baselines for what "normal" looks like
- Better troubleshooting context
- Capacity planning insight

Instead of guessing, you can correlate behavior over hours, days, or weeks.

---

## Docker Compose Stack

Everything is deployed using a single Docker Compose stack with all services preconfigured and wired together.

🔗 **[Complete configuration and files available on GitHub](https://github.com/timothystewart6/unpoller-unifi)**

### Services Included

- **Prometheus** – metrics storage
- **Grafana** – visualization
- **Unpoller** – UniFi metrics collector
- **Dozzle (optional)** – lightweight container log viewer

### Docker Compose File

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    restart: unless-stopped
    container_name: prometheus
    user: "${UID:-1000}:${GID:-1000}"
    env_file:
      - ./prometheus/.env
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus/config:/etc/prometheus
      - ./prometheus/data:/prometheus

  grafana:
    image: grafana/grafana:latest
    restart: unless-stopped
    container_name: grafana
    user: "${UID:-1000}:${GID:-1000}"
    env_file:
      - ./grafana/.env
    ports:
      - '3000:3000'
    volumes:
      - ./grafana/data:/var/lib/grafana
      - ./grafana/provisioning/datasources:/etc/grafana/provisioning/datasources
      - ./grafana/provisioning/dashboards:/etc/grafana/provisioning/dashboards
    depends_on:
      - prometheus

  unpoller:
    image: ghcr.io/unpoller/unpoller:latest
    restart: unless-stopped
    container_name: unpoller
    env_file:
      - ./unpoller/.env
    ports:
      - '9130:9130'

  dozzle:
    image: amir20/dozzle:latest
    restart: unless-stopped
    container_name: dozzle
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./dozzle/data:/data
    env_file:
      - ./dozzle/.env
    ports:
      - '8080:8080'
```

All containers run as the same UID/GID as the host user, allowing Docker to create bind-mounted directories automatically in most homelab setups.

### Unpoller Configuration

Unpoller is configured via environment variables. You do not need to tune every option to get started.

> *Note: All pre-configured .env files for every service are included in the [GitHub repository](https://github.com/timothystewart6/unpoller-unifi). You only need to update the UniFi controller details and credentials.*
{: .prompt-info }

#### Complete Unpoller Configuration

Here's the complete `unpoller/.env` file:

```console
UP_INFLUXDB_DISABLE=true
UP_POLLER_DEBUG=false
UP_UNIFI_DYNAMIC=false
UP_PROMETHEUS_HTTP_LISTEN=0.0.0.0:9130
UP_PROMETHEUS_NAMESPACE=unpoller
UP_UNIFI_CONTROLLER_0_VERIFY_SSL=false
UP_UNIFI_CONTROLLER_0_SAVE_ALARMS=true
UP_UNIFI_CONTROLLER_0_SAVE_ANOMALIES=true
UP_UNIFI_CONTROLLER_0_SAVE_EVENTS=true
UP_UNIFI_CONTROLLER_0_SAVE_IDS=true
UP_UNIFI_CONTROLLER_0_SAVE_SITES=true
UP_UNIFI_CONTROLLER_0_VERIFY_SSL=false
UP_UNIFI_CONTROLLER_0_SAVE_DPI=false

UP_UNIFI_CONTROLLER_0_URL=https://192.168.10.1 # change to your Unifi Controller URL
UP_UNIFI_CONTROLLER_0_USER=unpoller # change to your Unifi Controller username
UP_UNIFI_CONTROLLER_0_PASS=password123 # change to your Unifi Controller password
UP_UNIFI_CONTROLLER_0_SITE=default # this is usually 'default', change if needed
TZ=America/Chicago # change to your timezone
```

The **required** settings you must update are:

- `UP_UNIFI_CONTROLLER_0_URL` - Your UniFi controller address
- `UP_UNIFI_CONTROLLER_0_USER` - UniFi username  
- `UP_UNIFI_CONTROLLER_0_PASS` - UniFi password
- `UP_UNIFI_CONTROLLER_0_SITE` - Usually "default"

#### UniFi User Requirement

Unpoller authenticates to UniFi using a standard UniFi account.

- Create a dedicated local UniFi account that has read-only access to your Network controller
- Read-only permissions are sufficient
- Use these credentials in the Unpoller .env file

If authentication fails, this is the first thing to double-check.

#### Prometheus Metrics Endpoint

The Prometheus metrics endpoint is configured in the complete `.env` file above and exposes metrics at `/metrics` that Prometheus will scrape.

### Prometheus Scrape Configuration

Prometheus needs to be told where Unpoller is running.

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['prometheus:9090']

  - job_name: 'unpoller'
    static_configs:
      - targets: ['unpoller:9130']
    scrape_interval: 30s
    scrape_timeout: 10s
```

The key line is:

```yaml
targets: ['unpoller:9130']
```

This uses the Docker Compose service name, so no IP management is required.

If dashboards are empty, this is one of the first places to check.

### Starting the Stack

With everything configured, bring the stack up:

```console
docker compose up -d
```

## Access

| Service | URL |
| ------- | --- |
| Grafana | <http://localhost:3000> |
| Prometheus | <http://localhost:9090> |
| Dozzle (logs) | <http://localhost:8080> |

**Grafana default login**: admin/admin123 (change in `grafana/.env`)

### Grafana Provisioning

Grafana is fully provisioned using files on disk.

- Datasources are defined via provisioning
- Dashboards are loaded automatically on startup
- No manual imports required

> *Note: All Grafana datasources and dashboards are included in the [GitHub repository](https://github.com/timothystewart6/unpoller-unifi) under the `grafana/` directory.*
{: .prompt-info }

This approach is repeatable, versionable, and aligns with how Grafana is typically managed in production.

## Dashboards and What They Enable

The stack includes pre-configured Grafana dashboards for comprehensive UniFi network monitoring:

- **Access Points** - Client counts, radio utilization, 2.4/5/6 GHz visibility
- **Switches** - Port utilization, throughput, and performance metrics
- **Gateway** - WAN performance, throughput, and edge behavior
- **Clients** - Connection history, device behavior, and usage patterns
- **DPI** - Deep packet inspection and traffic insights (requires gateway support)
- **Sites** - Multi-site overview and comparison
- **PDU** - Power distribution unit metrics (hardware-dependent)

### Access Points

The Access Points dashboard is usually the best place to start:

- Client counts over time
- Radio utilization
- 2.4, 5, and 6 GHz visibility

This makes it much easier to understand load distribution, interference, and capacity issues.

### Clients, Switches, and Gateways

Additional dashboards:

- Client connection history and behavior
- Switch throughput and port utilization
- Gateway performance and WAN behavior

The real value comes from being able to correlate changes over time rather than relying on snapshots.

### Bonus Dashboards

Several additional dashboards are included but not required for day-one value:

- Gateway - throughput, latency, edge behavior
- PDU - power usage and device state (hardware-dependent)
- DPI - traffic insights (depends on gateway support and configuration)

For example, the DPI dashboard will populate automatically if DPI is enabled and supported by your gateway. Not every UniFi deployment will expose every metric - that’s expected.

## Troubleshooting

If you run into issues, here are the most common solutions:

- **Check logs**: `docker compose logs [service-name]` or use Dozzle at <http://localhost:8080>
- **Verify UniFi controller accessibility** from Docker network
- **Ensure a local UniFi account** has been created with read-only/view-only network controller access
- **For 429 errors**, increase scrape interval in `prometheus/config/prometheus.yml`
- **If dashboards are empty**, check the Prometheus scrape configuration

## Summary

With this setup in place, you now have:

- Long-term visibility into your UniFi network
- Repeatable, file-based configuration
- Enterprise-style tooling running at homelab scale
- A solid foundation for alerts, customization, and deeper analysis

This approach removes much of the guesswork from monitoring and gives you both better insight and valuable hands-on experience.

## Join the conversation

<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><p lang="en" dir="ltr">Build a UniFi observability stack with Unpoller, Prometheus, and Grafana to collect and visualize real network metrics over time.<a href="https://twitter.com/Ubiquiti?ref_src=twsrc%5Etfw">@Ubiquiti</a> <a href="https://t.co/DV3VVdxmzQ">https://t.co/DV3VVdxmzQ</a></p>&mdash; Techno Tim (@TechnoTimLive) <a href="https://twitter.com/TechnoTimLive/status/2002815765905547304?ref_src=twsrc%5Etfw">December 21, 2025</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

---

🤝 Support the channel and [help keep this site ad-free](/sponsor)  

🛍️ Check out all merch: <https://shop.technotim.live/>

⚙️ See all the hardware I recommend at <https://l.technotim.live/gear>
