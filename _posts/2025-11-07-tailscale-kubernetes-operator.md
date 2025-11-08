---

layout: post
title: "My Private Mini Kubernetes Cluster - Secured by Tailscale"
date: 2025-11-07 08:00:00 -0500
categories: homelab kubernetes
tags: kubernetes tailscale homelab flux gitops rke2 unifi beelink
image:
 path: /assets/img/headers/tailscale-kubernetes-operator.webp
 lqip: data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAUACgMBEQACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APxi/aE+FOtfDTXfhf8AszeHPFWgxaf4n0i60++8YT/DrQ7vUorextNOvLcWlhf314tmxKyxz3FjqFpfSxy+WLuODz4bj+hciyOlj8xwuXKtKgsLh55j7RUqdRVoYNOtLC1KT5fdrKj7NzU/cU3L2c7cr9PPeFll1WnTWPqVViqdW79lKk4KVK/uuGIvzK+kk009VZnvl1/wRT8P3FzcT/8AC+QnnzyzbF+EsW1PMkZ9q4+IyjC7sDCgYHAHSvRreH2BrVatWOKVONWpOpGmsJCSpqcnJQUvaq6inyp2V7Xsj87jntWKUXRUnFKLk6jvJpWu7wbu99W/Vn//2Q==
---

A compact Kubernetes cluster, completely private and connected over 5G - powered by **Tailscale**.

{% include embed/youtube.html id='T2D6ATbDGIw' %}
📺 [Watch the video](https://www.youtube.com/watch?v=T2D6ATbDGIw)

---

## Why Build a Private Kubernetes Cluster?

I wanted a way to run a full Kubernetes cluster that I could access securely from anywhere - **no open ports, no complicated VPN setup, no public exposure**.  

Tailscale made that possible by creating a secure network for exposing and connecting Kubernetes services with the Tailscale Operator.

This project combines three Beelink Mini PCs, a UniFi Cloud Gateway Ultra, and a custom **Dark Mode** mini rack to host an RKE2-based Kubernetes cluster that’s lightweight, low-power, and entirely private.

---

## The Hardware Stack

This cluster runs inside a **Rackmate T0 4U mini rack**, finished in black for that "Dark Mode" aesthetic.

**Top to bottom:**

* **UniFi Cloud Gateway Ultra** - Handles routing, VLANs, and firewall rules  
* **Three Beelink Mini S PCs** - Intel N150, 16 GB RAM, 500 GB SSD, Gigabit NIC  
* **3D-printed mounts and magnetic blackout panels** - custom printed for the rack  
* **Slim network cables** - keeps everything tidy  
* **5G WAN connection** - a bit of latency, but proves how resilient this setup can be

The entire rack will be **given away**, courtesy of **Tailscale**.

---

## Product Links (Affiliate)

* [Rackmate T0 4U Mini Rack](https://amzn.to/4otCHO5)  
* [UniFi Cloud Gateways](https://store.ui.com/us/en/category/all-cloud-gateways?a_aid=TechnoTim)  
* [Beelink Mini S13 Pro](https://amzn.to/43OLVfu)  
* [Slim Ethernet Cables](https://amzn.to/43jsv2l)  
* [Acrylic Panels](https://amzn.to/43hxccR)

---

## Network Configuration

After assembling the rack, I powered everything up and adopted the devices in UniFi.  
Then I spun up a **new VLAN**, created a **DMZ** for the cluster, added **zone-based firewall rules**, and enabled **intrusion prevention**.  

The WAN runs entirely over **5G**, which adds a bit of latency and CG-NAT fun - but it works, and that’s what makes this project interesting.

---

## Installing Ubuntu and Preparing the Nodes

Next, I installed [**Ubuntu 24.04 LTS**](https://ubuntu.com/download/server) on all three Beelink Mini PCs using a Ventoy drive.  
Pretty standard install - repeated across all nodes.  

Later, I realized my **PiKVM** would’ve made BIOS updates and installs easier, so I connected it, [installed Tailscale opn the PiKVM and enabled subnet routing](https://tailscale.com/kb/1292/pikvm) flashed firmware on each device, and made sure everything was up to date.

Then I reserved static IPs for each node - something you definitely want to do before joining them into a Kubernetes cluster.

---

## Deploying RKE2

For this build, I used **RKE2**, Rancher’s hardened Kubernetes distribution that’s FIPS 140-2 compliant and fully compatible with upstream Kubernetes.  It's [really easy to get started](https://docs.rke2.io/install/quickstart)

I bootstrapped RKE2 on the first node, retrieved the cluster token, and joined the other two nodes using that token.  
A few moments later, I had a fully functional **three-node Kubernetes cluster** with distributed etcd and `kubectl` access.

---

## Managing Cluster State with Flux

Before diving into networking, I installed **Flux** - a GitOps tool that manages Kubernetes state through YAML stored in Git.  
[I already use Flux in my other clusters](/posts/flux-devops-gitops/), so it made sense to keep this one consistent.  
Once bootstrapped, Flux handled deployments automatically based on my commits.

---

## Installing the Tailscale Kubernetes Operator

The magic happens here.  
The **Tailscale Kubernetes Operator** brings Tailscale’s secure networking directly into your cluster - giving you private access to services, pods, and even the control plane without exposing anything publicly.  I'll briefly list my steps but [I encourage to check out their documentation](https://tailscale.com/kb/1236/kubernetes-operator)

Setup steps:

1. Add new tags and permissions in the Tailscale admin console  
2. Generate an OAuth client with limited write access  
3. Install the operator using **Helm** or Flux  
4. Verify connectivity in the Tailscale admin console

Here is my flux `helm` release from the video:

```yaml
---
apiVersion: helm.toolkit.fluxcd.io/v2
kind: HelmRelease
metadata:
  name: tailscale-operator
  namespace: tailscale
spec:
  interval: 30m
  chart:
    spec:
      chart: tailscale-operator
      version: 1.90.5
      interval: 30m
      sourceRef:
        kind: HelmRepository
        name: tailscale-charts
        namespace: flux-system
  values:
    operatorConfig:
      hostname: "tailscale-operator-mini-cluster"
    apiServerProxyConfig:
      mode: "true"
```

If you're using helm, you can install it using these commands:

Add the Tailscale Helm repository:

```bash
helm repo add tailscale https://pkgs.tailscale.com/helmcharts
```

Update the Helm repositories:

```bash
helm repo update
```

Install the Tailscale operator, don't forget to use your OAuth client and Secret from the Tailscale Admin Console.

```bash
helm upgrade \
  --install \
  tailscale-operator \
  tailscale/tailscale-operator \
  --namespace=tailscale \
  --create-namespace \
  --set-string oauth.clientId="<OAuth client ID>" \
  --set-string oauth.clientSecret="<OAuth client secret>" \
  --set-string apiServerProxyConfig.mode="true" \
  --wait
```

Once installed, the cluster appeared as a new machine on my Tailnet.

---

## Secure Access to the Kubernetes API

I enabled **API proxy mode** in Helm, allowing me to access the Kubernetes API securely through Tailscale.  
After updating grants in the Tailscale admin console to impersonate Kubernetes admin privileges, I could connect remotely from anywhere using my Tailscale-authenticated `kube config`.

This should have already been enabled from the helm command argument of `--set-string apiServerProxyConfig.mode="true"`.  If you didn't use this flag, just run the command again with the flag but use upgrade instead `helm upgrade`.

You will need to decide on permissions, I suggest reviewing the [impersonation section in the docs](https://tailscale.com/kb/1437/kubernetes-operator-api-server-proxy#impersonating-kubernetes-groups-with-grants)

Once everything is in place, you just need to run a command to configure your `kube config` with a new context.

```bash
tailscale configure kube config tailscale-operator
```

It will output the new context, switch to it

```bash
 kube config use-context tailscale-operator-mini-cluster.tail1234.ts.net # replace with your operator FQDN
```

Then run a command to test it

```bash
kube config get nodes
```

and you should see something like:

```text
NAME                STATUS   ROLES                       AGE    VERSION
k8s-home-1          Ready    control-plane,etcd,master   102d   v1.33.5+rke2r1
k8s-home-2          Ready    control-plane,etcd,master   102d   v1.33.5+rke2r1
k8s-home-3          Ready    control-plane,etcd,master   102d   v1.33.5+rke2r1
k8s-home-worker-1   Ready    worker                      102d   v1.33.5+rke2r1
k8s-home-worker-2   Ready    worker                      102d   v1.33.5+rke2r1
k8s-home-worker-3   Ready    worker                      102d   v1.33.5+rke2r1
```

No exposed ports, no manual VPN configuration - just private access through the Tailnet.

---

## Hosting Private Services (Draw.io)

To test it out, I deployed **Draw.io** inside the cluster.  
Instead of exposing it publicly or relying on `kubectl port-forward`, I created a **Tailscale ingress** that made the service securely available on my Tailnet with a trusted certificate.

Here is a minimal deployment file for DawIO

`deployment.yaml`

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: drawio
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: drawio
  template:
    metadata:
      labels:
        app: drawio
    spec:
      containers:
        - name: drawio
          image: jgraph/drawio:latest
          ports:
            - containerPort: 8080
```

then apply the deployment with:

```yaml
kubectl apply ./deployment.yaml
```

Then you'll want to create a Tailscale Ingress

`ingress.yaml`

```yaml
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: diagram-tailscale-ingress
  namespace: default
spec:
  defaultBackend:
    service:
      name: diagram
      port:
        number: 8080
  ingressClassName: tailscale
  tls:
    - hosts:
        - diagram

---
apiVersion: v1
kind: Service
metadata:
  name: diagram
  namespace: default
spec:
  type: ClusterIP
  selector:
    app: diagram
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
```

Then apply it

```bash
kubectl apply -f ./ingress.yaml
```

This will expose this service on your Tailnet.  You will see it in your Tailscale Admin Console and you will be able to access it securely, with certificates, using the FQDN.

e.g.

```text
https://diagram.tail1234.ts.net
```

Now I can access Draw.io privately from any device connected to Tailscale.

---

## Cross-Cluster Monitoring

I didn’t want to run a separate monitoring stack, so I used **Tailscale’s cluster-to-cluster communication** to let my **homelab’s Grafana and Prometheus** scrape metrics from this new mini cluster.

With a **Tailscale Load Balancer** in front of **Node Exporter**, and an **egress service** pointing back from my home cluster, Prometheus was able to pull metrics over the Tailnet securely.

The key here is to expose the service  on one side, and then create an egress on the other side.  The ingress should be created like the drawIO example above, exposing the service to your Tailnet, and then creating an egress that points to the IP on your Tailnet (as seen on the Tailscale Admin Dashboard)

Node Exporter Service side (mini-server)

`service.yaml`

```yaml
---
# LoadBalancer for node 1 - using nodeSelector + pod network
apiVersion: v1
kind: Service
metadata:
  name: node-exporter-1
  namespace: default
  annotations:
    tailscale.com/expose: "true"
spec:
  type: LoadBalancer
  loadBalancerClass: tailscale
  ports:
    - port: 9100
      targetPort: 9100
      protocol: TCP
      name: metrics
  # Instead of selector, we'll create individual endpoints

---
# Endpoints for node 1
apiVersion: v1
kind: Endpoints
metadata:
  name: node-exporter-1
  namespace: default
subsets:
  - addresses:
      - ip: 192.168.200.101  # mini-server-1 IP
    ports:
      - port: 9100
        name: metrics

```

Prometheus Service side (Prometheus scraper)

`service.yaml`

```yaml
---
# Egress service for mini-server-1
apiVersion: v1
kind: Service
metadata:
  name: mini-cluster-node-1
  namespace: default
  annotations:
    tailscale.com/tailnet-ip: "100.124.122.6"
spec:
  type: ExternalName
  externalName: placeholder
  ports:
    - name: metrics
      port: 9100
      targetPort: 9100
      protocol: TCP

---
```

Moments later, Grafana displayed the new "Mini Cluster" node - fully integrated and private.

---

## The Mini Rack Giveaway

This entire Dark Mode rack - running RKE2, Flux, and the Tailscale Kubernetes Operator - is being **given away**, thanks to Tailscale.  
To find out how to enter, check out the details in the [**Tailscale Discord community**](https://discord.gg/tailscale).

---

## Final Thoughts

Over the past few weeks, I’ve gone from knowing very little about Tailscale beyond its mesh networking to using it for **multi-cluster connectivity** and **zero-trust access**.  
It’s completely changed how I think about Kubernetes networking - making something complex feel *almost* easy 😅 .

I’m Tim - thanks for reading and for watching.

## Join the conversation

<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><p lang="en" dir="ltr">Back at it with another mini rack - this time in Dark Mode.<br>A private Kubernetes cluster secured by Tailscale.<br>And the whole thing? It’s being given away.<a href="https://t.co/epriZOeuiF">https://t.co/epriZOeuiF</a> <a href="https://t.co/1c66EvSuvL">pic.twitter.com/1c66EvSuvL</a></p>&mdash; Techno Tim (@TechnoTimLive) <a href="https://twitter.com/TechnoTimLive/status/1986867749398761832?ref_src=twsrc%5Etfw">November 7, 2025</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

---

🧠 Learn more about [Tailscale’s Kubernetes Operator](https://tailscale.com/kubernetes-operator)

🛍️ Check out my [recommended gear](https://l.technotim.live/gear)

🤝 Support the channel and [help keep this site ad-free](/sponsor)

---
