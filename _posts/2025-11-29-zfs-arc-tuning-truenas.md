---
layout: post
title: "Optimizing ZFS for Media, Apps, Databases, and Special VDEVs on TrueNAS SCALE"
date: 2025-11-29 08:00:00 -0500
categories: truenas homelab
tags: zfs truenas scale optane l2arc arc homelab
image:
  path: /assets/img/headers/zfs-arc-tuning-truenas.webp
  lqip: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAUACgMBEQACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APDfh9+0B4J8Oftb+MP2X3/Zx+CGtXFtFF4ol8Xap8N/hb/wj9t4b1W9e68P+HPD/giz+G1rrOj6zo2l+KdL0rWfEt58Rdb07xPJ4XtNSHhHRbnUr9G560ZRbm6k3H3ZKC5IpW3V+RtqV+rbXR7WmMaMpxprD0Yt895qO6dnH3U0rx2vs7Xcbtn3HofgPwVp2iaPp+sfDv4R69q9hpWn2eqa4fhJ4E0w61qNraQwX2rHTrXSHttPOo3KS3hsrd3gtTN5ETNHGpOXO/Ir6tS6wpt9X7OJ/9k=
---

Over the last few weeks I completely re-tuned my TrueNAS SCALE ZFS layout for maximum performance around ARC, L2ARC, special VDEVs, recordsize, and how each dataset interacts with them. I've been chasing this idea of having one large hybrid pool with lots of spinning disks backed by fast low latency storage for specific datasets and data access patterns within the pool.  My pool contains large files, small files, Docker containers & images, as well as configs and databases. Rather than create separate pools with specific hardware and assigning specific workloads to those pools, I just want one pool that can do it all (pipe dream, I know).

This post documents the reasoning and the final tuned configuration so you can reproduce it (and so I can remember how I did it in the future 😅).

---

## High-Level Goals

1. Prevent L2ARC from being filled with cold, huge media files.
2. Force all metadata and small random I/O onto my Intel Optane special VDEV.
3. Tune app configs and databases (Postgres, Home Assistant, Plex DB, Jellyfin, Resolve) for latency and IOPS.

Performance hierarchy:

- ARC (RAM) – fastest
- Special VDEV (Optane) – second fastest
- HDD pool – large sequential throughput
- L2ARC SSD – optional read cache, slower than Optane

Key realization:
L2ARC is *not* part of the storage hierarchy. If a special VDEV exists, metadata will not be cached in L2ARC. Disabling L2ARC for large datasets prevents wasted SSD writes.

---

## Storage0 Hardware Layout

- Data VDEVs: 5× HDD mirrors
- Special VDEV: 4× Intel Optane (mirrored pair)
- SLOG: 1× NVMe
- L2ARC: 1× SSD (~900GB)

Because the Optane mirror has so much room and extremely high performance, L2ARC provides almost no benefit.

---

## Dataset Strategy

Datasets were grouped into functional categories and tuned accordingly.

### 1. Media (large sequential files)

Datasets:

- `movies`
- `tv_shows`
- `music`
- `recorded_tv`

Settings:

- `recordsize = 1M`
- `primarycache = metadata`
- `secondarycache = none`
- `special_small_blocks = 0`

Reasoning:
Large files shouldn't pollute ARC or L2ARC. Metadata still benefits from Optane.

### 2. Heavy app configs / databases

Datasets:

- `plex/config`  
- `postgres`  
- `jellyfin`  
- `prometheus`  
- `resolve/library`
- `homeassistant`

Settings:

- `recordsize = 8K–16K`
- `primarycache = all`
- `secondarycache = none`
- `special_small_blocks = 64K` (pool default, pushes small blocks to Optane)

Reasoning:
Small random I/O workloads (DBs, configs) benefit heavily from ARC + Optane.

### 3. Light app configs

Datasets:

- `homepage`  
- `code-server`  
- `scrypted`
- `dozzle`

Settings:

- `secondarycache = none`

Reasoning:
Prevents L2ARC from filling with tiny config files.

### 4. Datasets that benefit from L2ARC

With an Optane special VDEV:
None.

---

## Final Dataset Configuration (Storage0)

```shell
(Columns: name — recordsize — primarycache — secondarycache — special_small_blocks)

storage0                        128K   all        all         64K  
storage0/bambustudio            16K   all        none       128K  
storage0/cadvisor               16K   all        none       128K  
storage0/code-server            16K   all        none       128K  
storage0/dcgm-exporter          16K   all        none       128K  
storage0/dozzle                 16K   all        none        64K  
storage0/filebrowser            16K   all        none        64K  
storage0/grafana                16K   all        none       128K  
storage0/home-assistant         16K   all        none       128K  
storage0/homepage               16K   all        none        64K  
storage0/jellyfin               16K   all        none       128K  
storage0/llm                   128K   all        none         0  
storage0/minio                 128K   metadata   none         0  
storage0/movies                 1M    metadata   none         0  
storage0/mqtt                   16K   all        none       128K  
storage0/music                  1M    metadata   none         0  
storage0/n8n                    16K   all        none       128K  
storage0/nebula-sync            16K   all        none       128K  
storage0/node-exporter          16K   all        none       128K  
storage0/nvtop                  16K   all        none        64K  
storage0/ollama                 16K   all        none       128K  
storage0/open-webui             16K   all        none       128K  
storage0/pgadmin                16K   all        none       128K  
storage0/plex                   16K   all        none       128K  
storage0/plex/config            16K   all        none       256K  
storage0/postgres                8K   all        none         8K  
storage0/postiz                 16K   all        none       128K  
storage0/prometheus            128K   metadata   none       128K  
storage0/prometheus-plex-exp    16K   all        none       128K  
storage0/recorded_tv             1M   metadata   none         0  
storage0/resolve               128K   all        all         64K  
storage0/resolve/backups       128K   metadata   all        128K  
storage0/resolve/library        16K   all        none        16K  
storage0/scrypted               16K   all        none       128K  
storage0/searxng                16K   all        none        64K  
storage0/smartctl-exporter      16K   all        none       128K  
storage0/tautulli               16K   all        none       128K  
storage0/tv_shows               1M    metadata   none         0  
storage0/unbound                16K   all        none       128K  
storage0/valkey                 16K   all        none       128K  
storage0/zigbee2mqtt            16K   all        none       128K  
```

---

## Why L2ARC Was Disabled for Almost Everything

L2ARC is:

- write-heavy
- slower than Optane
- redundant when ARC + special VDEV handle small IO
- ineffective for large media files

Therefore:

```shell
zfs set secondarycache=none <dataset>
```

...became the default rule.

---

## Observed Results

- L2ARC no longer fills with useless 1M movie blocks
- Optane special VDEV handles 80–95% of metadata I/O
- ARC hit ratio improved
- App configs, Plex DB, and Postgres workloads are significantly faster
- Media playback unchanged (HDD-limited anyway)

---

## ZFS Cheatsheet

### Media Datasets

```shell
zfs set recordsize=1M storage0/movies
zfs set primarycache=metadata storage0/movies
zfs set secondarycache=none storage0/movies
```

(Repeat for `tv_shows`, `music`, `recorded_tv`.)

### App Configs / Databases

Postgres:

```shell
zfs set recordsize=8K storage0/postgres
zfs set primarycache=all storage0/postgres
zfs set secondarycache=none storage0/postgres
```

Plex:

```shell
zfs set recordsize=16K storage0/plex
zfs set primarycache=all storage0/plex
zfs set secondarycache=none storage0/plex
```

### Disable L2ARC (General Rule)

```shell
zfs set secondarycache=none <dataset>
```

### Check Special VDEV Block Size

```shell
zfs get special_small_blocks storage0
```

### Check L2ARC Stats

```shell
grep -i l2arc /proc/spl/kstat/zfs/arcstats
```

### Check ARC Efficiency

```shell
grep -i arc /proc/spl/kstat/zfs/arcstats
```

### View Dataset Settings Table

```shell
zfs list -o name,recordsize,primarycache,secondarycache,special_small_blocks -r storage0
```

---

## Summary

With a fast, low latency Optane special VDEV, the ideal ZFS hierarchy becomes:

- Metadata → Optane
- Small random IO → Optane
- Hot data → ARC
- Media → HDD
- L2ARC → rarely useful

This layout avoids wasted SSD writes, improves responsiveness, and keeps databases and application workloads fast and predictable.

---

## Join the conversation

<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><p lang="en" dir="ltr">I&#39;ve been tuning my hybrid ZFS pool lately. Optane for metadata and small files, HDDs for bulk storage, and cleaned up my L2ARC. Things are finally starting to feel right.<a href="https://t.co/kk9YxsAdGi">https://t.co/kk9YxsAdGi</a></p>&mdash; Techno Tim (@TechnoTimLive) <a href="https://twitter.com/TechnoTimLive/status/1995191512922263881?ref_src=twsrc%5Etfw">November 30, 2025</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
---

🤝 Support the channel and [help keep this site ad-free](/sponsor)

🛍️ Check out all merch: <https://shop.technotim.live/>

⚙️ See all the hardware I recommend at <https://l.technotim.live/gear>
