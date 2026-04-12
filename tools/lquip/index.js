const lqip = require('lqip');
const fs = require('fs');
const path = require('path');

const preferredInputExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const supportedExtensions = new Set(preferredInputExtensions);

async function collectImages(dirPath) {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectImages(fullPath));
      continue;
    }

    if (supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function buildImageTargets(files) {
  const imageMap = new Map();

  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    const baseName = file.slice(0, -extension.length);

    if (!imageMap.has(baseName)) {
      imageMap.set(baseName, new Map());
    }

    imageMap.get(baseName).set(extension, file);
  }

  return Array.from(imageMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, variants]) => {
      const inputPath = preferredInputExtensions
        .map((extension) => variants.get(extension))
        .find(Boolean);
      const outputPath = variants.get('.webp') || inputPath;

      return { inputPath, outputPath };
    });
}

async function main() {
  const targets = process.argv.slice(2);
  const directories = targets.length > 0 ? targets : ['assets/img/headers', 'assets/img/posts'];

  for (const directory of directories) {
    const images = buildImageTargets(await collectImages(directory));

    for (const image of images) {
      const result = await lqip.base64(image.inputPath);
      console.log(JSON.stringify({ file: image.outputPath, lqip: result }));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


