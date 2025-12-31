/**
 * Setup Script
 * Initializes the project with necessary configurations
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

console.log(`
${colors.blue}╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🤖 AI-Powered Notes Application Setup                ║
║     MERN Stack with RAG (Retrieval-Augmented Generation) ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝${colors.reset}
`);

// Create necessary directories
const directories = [
  'backend/logs',
  'backend/data/vector_store',
];

console.log(`${colors.yellow}📁 Creating directories...${colors.reset}`);
directories.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`   ✓ Created: ${dir}`);
  } else {
    console.log(`   • Already exists: ${dir}`);
  }
});

// Create .env file from example if not exists
const envPath = path.join(__dirname, '..', 'backend', '.env');
const envExamplePath = path.join(__dirname, '..', 'backend', '.env.example');

console.log(`\n${colors.yellow}⚙️ Checking environment configuration...${colors.reset}`);
if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log(`   ✓ Created .env file from .env.example`);
  console.log(`   ${colors.red}⚠️ Don't forget to update your OpenAI API key in backend/.env${colors.reset}`);
} else if (fs.existsSync(envPath)) {
  console.log(`   • .env file already exists`);
} else {
  console.log(`   ${colors.red}⚠️ No .env.example found${colors.reset}`);
}

// Create .gitignore if not exists
const gitignorePath = path.join(__dirname, '..', '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  const gitignoreContent = `# Dependencies
node_modules/
*/node_modules/

# Environment variables
.env
*.env.local

# Build outputs
/frontend/build/
/dist/

# Logs
logs/
*.log
npm-debug.log*

# Vector store data
/backend/data/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Test coverage
coverage/
`;
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log(`   ✓ Created .gitignore`);
}

console.log(`
${colors.green}✅ Setup complete!${colors.reset}

${colors.blue}Next steps:${colors.reset}
1. Configure your environment:
   ${colors.yellow}cd backend && cp .env.example .env${colors.reset}
   Then edit .env and add your OpenAI API key

2. Make sure MongoDB is running:
   ${colors.yellow}mongod${colors.reset}
   Or use MongoDB Atlas connection string in .env

3. Install dependencies:
   ${colors.yellow}npm run install:all${colors.reset}

4. Start the development server:
   ${colors.yellow}npm run dev${colors.reset}

5. Open your browser:
   ${colors.yellow}http://localhost:3000${colors.reset}

${colors.blue}📚 Documentation:${colors.reset}
   See README.md for detailed instructions

${colors.green}Happy coding! 🚀${colors.reset}
`);
