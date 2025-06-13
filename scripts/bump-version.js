#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function bumpVersion() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  try {
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Parse current version
    const currentVersion = packageJson.version;
    const versionParts = currentVersion.split('.');
    
    // Increment patch version
    const major = parseInt(versionParts[0]);
    const minor = parseInt(versionParts[1]);
    const patch = parseInt(versionParts[2]) + 1;
    
    const newVersion = `${major}.${minor}.${patch}`;
    
    // Update package.json
    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log(`Version bumped from ${currentVersion} to ${newVersion}`);
    
    // Create version info file for the frontend
    const versionInfo = {
      version: newVersion,
      buildDate: new Date().toISOString(),
      buildNumber: Date.now()
    };
    
    const versionInfoPath = path.join(__dirname, '..', 'src', 'version.json');
    fs.writeFileSync(versionInfoPath, JSON.stringify(versionInfo, null, 2));
    
    console.log(`Version info written to ${versionInfoPath}`);
    
  } catch (error) {
    console.error('Error bumping version:', error);
    process.exit(1);
  }
}

bumpVersion();