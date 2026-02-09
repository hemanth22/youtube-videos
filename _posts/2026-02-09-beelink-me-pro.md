---
layout: post
title: "Beelink ME Pro: Tiny NAS, Stacked Hardware"
date: 2026-02-09 08:00:00 -0500
categories: homelab
tags: beelink me-pro nas truenas plex intel n95 quicksync zfs smb homelab
image:
  path: /assets/img/headers/beelink-me-pro-hero.webp
  lqip: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAUACgMBEQACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APTP2dvCEXw/stYeZNJ8R+BjeS+FdP8ABV7b+JrC4tYfFPiyw1qzmvPF1j4xTXdUi8LwpaaXosEzRXBtbdzf390JUjt/zLMeK82z7F8EuriJ0MRwzmuZ8STxEFh6jzKVPhTivh6eEqUZYZUMPGpDPJ4r2yp1vZyw8aVKlFT9pT/YFwBlODo5xXhaVHG/U8vpYZwrL6r9YzHLsTGsq6xftazoqgqcYS5fac3PVnJqz+u7n9jb9lbUbifULr4JeHmub+aW8uGTXfGiqZ7p2nlKr/wkp2qZHYhcnAwMmuReJnE8kpfWKa5leyo4eyvrZXoXsj0ZeGnDUZOPsq75W43dapd2dru07Xflof/Z
---

The sub-$400 NAS market is **crowded** right now.

The **Beelink ME Pro** stood out to me because it’s small, quiet, easy to work on, and it has a really nice mix of hardware for the money: **5GbE + 2.5GbE**, **three NVMe slots**, **two SATA bays**, **12GB LPDDR5**.

In this video, I set it up the way I’d actually use it: bulk storage on SATA, fast NVMe for apps/containers, real SMB transfers, and a Plex hardware transcode check.

{% include embed/youtube.html id='ngqe-vp7htk' %}
[Watch the video](https://www.youtube.com/watch?v=ngqe-vp7htk)

---

## What the ME Pro is

Think of the ME Pro as a tiny NAS style mini PC that’s meant to be opened up.

A few things you’ll notice right away:

- Mostly-metal chassis
- Magnetic top cover for quick access
- Tray-based design (easy to service)
- Dual NICs (2.5G + 5G)
- Storage layout that actually makes sense for "bulk + fast apps"

---

## The setup I used

Beelink sent the **N95** config:

- Intel N95 (4C/4T, up to 3.4GHz)
- 12GB LPDDR5
- 512GB SSD (system drive)

I added:

- 2× SATA HDDs for bulk storage (mirror)
- 2× NVMe SSDs for a fast app pool (mirror)

---

## Quick tour

On the **front**: USB‑C and the power button.

On the **back**: 2.5G + 5G Ethernet, HDMI, USB, USB‑C (supports a display), and a 3.5mm audio jack.

That dual NIC combo is still not super common under $400.

---

## Installing drives (best part)

This is where the ME Pro differentiates itself in terms of design.

- The top vent/mesh cover is **magnetic**
- The tool is stored underneath (so you don’t go hunting for it)
- Drive trays include **rubber bumpers**
- The trays also have **thermal pads** so heat can move into the chassis

And yes, they include an extra screw. Thank you.

---

## OS and why I used TrueNAS

I used **TrueNAS SCALE** as my real world test.

I had a quick install issue with an older Ventoy stick, so I just flashed a normal installer USB and installed the latest TrueNAS SCALE.

I went with [TrueNAS SCALE](https://www.truenas.com/truenas-scale/) for this build because it’s what I’m most familiar with right now. I’m sure this box would work fine with [Unraid](https://unraid.net/) too, I just didn’t test it in this video.

Quick install note: if you’re using [Ventoy](https://www.ventoy.net/), make sure your Ventoy USB is **up to date**. I ran into a boot issue with an older Ventoy build, so I just flashed a standard USB Installer with [Etcher](https://github.com/balena-io/etcher) and moved on.

---

## Storage layout: slow + fast

I created two pools:

- **slow**: mirrored SATA HDD pool (bulk storage)
- **fast**: mirrored NVMe pool (apps/containers)

This is the same pattern I use on a lot of home servers:

- big drives for media/backups
- fast SSDs for apps, databases, containers, and anything latency sensitive

---

## SMB shares + copy tests

I created two SMB shares:

- slow movies (HDD pool)
- fast movies (NVMe pool)

Then I copied the same large files to both.

The HDD mirror landed right where I expected, solid performance and really close to on 2.5Gb/s (due to HDD speed), but it’s not the kind of speed that’s anywhere near 5GbE.

The NVMe pool is where you really see the benefit of 5GbE. In my testing it was hovering around ~4.1 - 4.2 Gb/s (peaking around ~4.19 Gb/s), so not perfectly pinned at 5GbE, but still really fast.

---

## Apps + Plex

Once I confirmed the NVMe pool was actually fast, I used it for apps.

Then I installed Plex, mounted the media share, and verified hardware transcoding.

Intel Quick Sync is a perfect for a box like this: small, efficient, and it can transcode on the fly without hammering the CPU.

I also used `intel_gpu_top` to confirm the iGPU was doing the work.

---

## Where it fits (value)

This market is crowded, so value matters.

A lot of boxes under $400 are either:

- "appliance NAS" (great UI/ecosystem, less flexible)
- budget hardware (often 2.5GbE, fewer fast storage options)
- barebones DIY (you’re still adding RAM and a boot drive)

The ME Pro is different because it gives you a lot in one tiny box:

- 5GbE + 2.5GbE
- 3× NVMe + 2× SATA
- quiet, serviceable design
- LPDDR5 already included

If you want a simple appliance NAS, you might still prefer a traditional ecosystem.

But if you want a small, efficient box with 2 drive bays that can do NAS stuff *and* run apps/containers on fast storage, the ME Pro might make sense.

---

## Wrapping up

This one was fun to test.

If you’re considering a small, low power NAS, the ME Pro stands out because it’s compact, quiet, and has a lot of the stuff homelab people care about.

---

🤝 Support the channel and [help keep this site ad-free](/sponsor)

🛍️ Check out all merch: <https://shop.technotim.com/>
