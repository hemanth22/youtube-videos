# Notes

## Convert to Webp

```bash
cwebp assets/img/headers/powertoys.jpg -o assets/img/headers/powertoys.webp
```

## Post image workflow

Resize post images to 1920x1080 and let `cwebp` use its normal defaults for compression:

```bash
for file in assets/img/posts/321-backup/*.jpg; do cwebp -resize 1920 1080 "$file" -o "${file%.*}.webp"; done
```

Generate `lqip` data for a specific folder and save the output somewhere easy to copy from:

```bash
node tools/lquip/index.js assets/img/posts/321-backup > tmp/321-backup-lqip.jsonl
```

Each line is JSON with the file path and the base64 placeholder:

```json
{"file":"assets/img/posts/321-backup/321-backup-0001.webp","lqip":"data:image/jpeg;base64,..."}
```

Embed images in post markdown like this:

```markdown
![Alt text](/assets/img/posts/321-backup/321-backup-0001.webp){: lqip="data:image/jpeg;base64,..." }
_Caption text_
```

## lquip script

```bash
node tools/lquip/index.js
```

## Local preview without CDN

This repo rewrites image paths through `images.technotim.com` in the main config. For local preview, use the local override config so post images load from the checked-in `assets/` folder instead:

```bash
bundle exec jekyll serve --config _config.yml,_config.local.yml
```

If you only want to test the generated output without starting the server:

```bash
bundle exec jekyll build --config _config.yml,_config.local.yml
```
