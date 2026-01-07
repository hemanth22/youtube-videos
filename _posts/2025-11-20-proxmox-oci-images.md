---

layout: post
title: "OCI Containers Come to Proxmox 9.1 – A First Look"
date: 2025-11-20 08:00:00 -0500
categories: proxmox homelab
tags: proxmox oci docker lxc homelab self-hosted grafana
image:
  path: /assets/img/headers/proxmox-oci-images-hero.webp
  lqip: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAUACgMBEQACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APifQPiRpfhpvBmt3HgLw9qEGiaT4a0K/wBOinvYovE9zoseu6vPrOuDWH8RWP2zWX/s6y1KHS9N021lsNMji8ozXE85/pL6ZPC2c5V4d5nlVfjHOMwhxNxvhcdTrVfbUp5VDLXjszp4PDpY2o6mGqwcsDUip0G8POd20+VfsH7MLL8q408bOJsbgcuw3DWZ8JeCnEGTU8fg4U6tbG1eKM/4Ky+vm0pYenltajmOBpZXWngasq+J9nWx9WpvT/e8dqnxV8OXmp6jdxfDnTbeK6vru5jtze6dKYI57iSVITKvhqESGJWCGQQxB9u4RoDtH+VeEpywWFw2DlWrYqWEw9HCyxWIqSlXxMqFONJ160m25Vqzh7SpJt3nKTuz/felgqtOlTp1K9OpUhThCpUjQqQVScYqMpqEsTUlBTknJRlUqOKdnObXM/8A/9k=
---

Proxmox 9.1 introduces support for **OCI container images**, bringing Docker‑style workloads into the Proxmox ecosystem for the first time. It’s still a **tech preview**, but it’s a promising step toward more flexible application hosting inside Proxmox.

{% include embed/youtube.html id='gDZVrYhzCes' %}
[Watch the video](https://www.youtube.com/watch?v=gDZVrYhzCes)

---

## Why OCI Support Matters

Until now, Proxmox has traditionally focused on **virtual machines** and **LXC containers**. Both are powerful, but many applications today are distributed as **OCI images** on registries like Docker Hub.

Adding OCI support means:

- You can pull widely used container images directly into Proxmox
- You can use familiar image tags like `grafana/grafana`
- You gain a more standardized way of handling app deployments
- You can use container images with full immutability

This brings Proxmox closer to the workflows many homelabbers and developers already use.

---

## How Proxmox Implements OCI Containers

The biggest surprise to me was that **Proxmox translates OCI containers inside an LXC container (the best I can tell)**.

This means:

- The OCI image is pulled and stored locally as a template
- Proxmox builds an LXC around it
- Networking and resource allocation behave like any LXC

It's different from Docker or containerd, but it keeps things portable and backup‑friendly.
It also protects the host by not running containers directly on the Proxmox node.

---

## Pulling OCI Images

OCI images are pulled from registries the same way you pull LXC templates.

Inside your storage area for container templates, you’ll see a new option:

**Pull From OCI Registry**

You can enter something like:

`grafana/grafana`

Proxmox will:

1. Query available tags
2. Download the selected tagged image
3. Store it as a `.tar` container template

Once downloaded, the image appears in your template list just like any LXC base image.

---

## Creating a Container From an OCI Image

Creating a container is similar to creating an LXC:

1. Select **Create CT**
2. Fill out the usual container details
3. Choose your OCI image as the template
4. Assign CPU, RAM, storage, and networking

Networking uses **LXC networking**, not Docker networking.
This gives you:

- Access to Proxmox bridge interfaces
- DHCP or static assignment
- No need for macvlan workarounds
- Clear separation from the Proxmox host itself

The result is kind of a hybrid - an LXC wrapper running an OCI application inside.

---

## Running the Example: Grafana

In the video I pulled the image: `grafana/grafana`

After creating the container and letting DHCP assign an address, Grafana launched immediately inside the LXC wrapper. Visiting the LXC container’s IP brought up Grafana just like normal.

It's fast, just like containers an LXCs.

---

## Environment Variables and Configuration

Proxmox exposes container configuration through a new **Environment** section inside the LXC Options tab.

You can:

- View default environment variables shipped with the OCI image
- Add or override variables
- Restart the container to apply changes

This is similar to Docker Compose environment variables, but exposed in the Proxmox UI.

---

## Limitations and Quirks (Keep in mind it is a Tech Preview)

This feature is labeled a **tech preview**, and it shows.

A few early limitations:

- Updating images is not streamlined nor even documented at this point
- You may need to rebuild containers instead of pulling updates (certainly hope not in the future)
- Console access behaves differently from a normal LXC  (which is fine, but we have terminal access with LCX and even with OCI containers, so why not here?)
- Traditional Docker workflows (run, exec, logs) don’t exist.  For all intensive purposes, one should forget the term Docker altogether.

None of this was unexpected, but it’s worth keeping in mind if you’re planning to test it in your homelab.

---

## What I’d Love to See Next

This is a great step forward, and I’m excited about where it could go.

A few things that would really make the experience better:

- Pulling OCI images on‑demand directly from the create menu
- Switching image versions without rebuilding the whole container
- A more streamlined update flow
- Optional direct host‑level container execution
- Console access, just as we would with containers
- Immutability, just like with OCI containers
- Update detection mechanism when new container images are released.

Proxmox ha some of the foundation, now it's about smoothing out the workflow and the limitations.

---

## Why Run OCI Images at All?

Some may ask why even both with OCI images when you can install applications directly inside an LXC or VM.

Here’s why I think containers are the way to go:

- Applications ship with all dependencies included
- Versions are pinned and reproducible
- Containerized apps behave the same across environments
- No need to manage system‑level package installs
- Faster deployment and rollback
- Immutable nature of containers

To wrap it up, containers simplify your stack, reduce drift, and make deployments repeatable.

---

## Final Thoughts

OCI support in Proxmox 9.1 may not replace Docker, but it’s a welcome addition for anyone running a homelab or managing self‑hosted services. It’s early, but it’s promising, and it’s great to see containers becoming a first‑class citizen in the Proxmox ecosystem.  If I had my choice, I would still have OCI containers be a first class citizen on the platform.  Personally it feels like they are doing whatever they can to avoid it.  If this feature matures however, I will gladly replace my existing LXCs for an OCI based one and still hope the Proxmox team adds a truly native OCI container support.

Thanks for reading,
I'm Tim.---

## Join the conversation

<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><p lang="en" dir="ltr">Proxmox 9.1 adds support for OCI containers.<br>That means you can now run Docker-style workloads inside Proxmox using LXC.<br>I tested it, showed how it works, and covered the current limitations.<a href="https://t.co/ieY0JDxHmm">https://t.co/ieY0JDxHmm</a></p>&mdash; Techno Tim (@TechnoTimLive) <a href="https://twitter.com/TechnoTimLive/status/1991569879015772535?ref_src=twsrc%5Etfw">November 20, 2025</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
---

🛍️ Check out my [recommended gear](https://l.technotim.com/gear)

🤝 Support the channel and [help keep this site ad‑free](/sponsor)
