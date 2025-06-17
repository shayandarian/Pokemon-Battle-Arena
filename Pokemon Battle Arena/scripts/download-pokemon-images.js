const fs = require('fs');
const path = require('path');
const https = require('https');

const pokemonIds = [1, 4, 7, 25]; // Bulbasaur, Charmander, Squirtle, Pikachu
const outputDir = path.join(__dirname, '../frontend/public/pokemon');

// Create directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

pokemonIds.forEach(id => {
  const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  const outputPath = path.join(outputDir, `${id}.png`);

  https.get(url, (response) => {
    if (response.statusCode === 200) {
      const file = fs.createWriteStream(outputPath);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded Pokemon ${id}`);
      });
    } else {
      console.error(`Failed to download Pokemon ${id}: ${response.statusCode}`);
    }
  }).on('error', (err) => {
    console.error(`Error downloading Pokemon ${id}:`, err.message);
  });
}); 