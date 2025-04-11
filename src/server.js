import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 8080;

// Serve static files from the "public" directory
app.use(express.static(join(__dirname, 'public')));

// Serve the node_modules directory for import map files
app.use('/node_modules', express.static(join(__dirname, 'node_modules')));

// Serve the src folder if needed
app.use('/src', express.static(join(__dirname, 'src')));

// Serve the style sheet
app.get('/style.css', (req, res) => {
  res.sendFile(join(__dirname, 'style.css'));
});

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`EMechanical server running at http://localhost:${port}`);
  console.log('Press Ctrl+C to quit');
});