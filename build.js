import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDir = path.join(__dirname, 'client');
const serverDir = path.join(__dirname, 'server');
const clientDist = path.join(clientDir, 'dist');
const serverDist = path.join(serverDir, 'dist');

console.log('🚀 Starting Build Process (Cross-Platform)...');

try {
  // 1. Install Client Dependencies
  console.log('📦 Installing Client Dependencies...');
  execSync('npm install', { cwd: clientDir, stdio: 'inherit', shell: true });

  // 2. Build Client
  console.log('🏗️  Building Client...');
  execSync('npm run build', { cwd: clientDir, stdio: 'inherit', shell: true });

  // 3. Clean old Server Dist
  console.log('🧹 Cleaning old build in server folder...');
  if (fs.existsSync(serverDist)) {
    fs.rmSync(serverDist, { recursive: true, force: true });
  }

  // 4. Move Dist
  console.log('🚚 Moving build files to server folder...');
  // Check if build succeeded
  if (!fs.existsSync(clientDist)) {
    throw new Error('Client build failed! dist folder not found.');
  }
  
  // Use rename (move) - robust method
  fs.renameSync(clientDist, serverDist);

  console.log('✅ Build Complete!'); 
  console.log('👉 You can now upload the entire "server" folder to A2 Hosting.');

} catch (error) {
  console.error('❌ Build Failed:', error.message);
  process.exit(1);
}