// Standalone Node.js HTTP Server for BitBuild Local Development
import http from 'node:http';
import { handleApiRequest } from './api.js';

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api')) {
    await handleApiRequest(req, res);
  } else {
    res.statusCode = 404;
    res.end('BitBuild API Server running on port ' + PORT);
  }
});

server.listen(PORT, () => {
  console.log(`[BitBuild Server] API & SQLite service running on http://localhost:${PORT}`);
});

