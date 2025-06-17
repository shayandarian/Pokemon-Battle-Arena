const fs = require('fs');
const path = require('path');

// Create the contracts directory in frontend if it doesn't exist
const frontendContractsDir = path.join(__dirname, '../frontend/src/contracts');
if (!fs.existsSync(frontendContractsDir)) {
  fs.mkdirSync(frontendContractsDir, { recursive: true });
}

// Copy contract artifacts
const contracts = ['Pokemon', 'Battle', 'Token', 'Marketplace'];
contracts.forEach(contract => {
  const artifactPath = path.join(__dirname, `../artifacts/contracts/${contract}.sol/${contract}.json`);
  const targetPath = path.join(frontendContractsDir, `${contract}.json`);
  
  if (fs.existsSync(artifactPath)) {
    fs.copyFileSync(artifactPath, targetPath);
    console.log(`Copied ${contract}.json to frontend`);
  } else {
    console.error(`Could not find artifact for ${contract}`);
  }
}); 