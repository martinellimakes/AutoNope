const sharp = require('sharp');
const { mkdirSync, existsSync } = require('fs');
const { join } = require('path');

const SRC = join(__dirname, '..', 'icon.png');
const OUT = join(__dirname, '..', 'icons');

if (!existsSync(SRC)) {
  console.error('icon.png not found in project root');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

const sizes = [16, 48, 128];

Promise.all(
  sizes.map(size =>
    sharp(SRC)
      .resize(size, size)
      .png()
      .toFile(join(OUT, `icon${size}.png`))
      .then(() => console.log(`icon${size}.png`))
  )
).catch(err => {
  console.error(err);
  process.exit(1);
});
