const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const STATIC_DIR = path.join(__dirname, 'dist/static');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Handle static files
  if (req.url.startsWith('/static/')) {
    const filePath = path.join(STATIC_DIR, req.url.replace('/static/', ''));
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(`File not found: ${filePath}`);
        res.writeHead(404);
        res.end('File not found');
        return;
      }
      
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'text/plain';
      
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
    return;
  }
  
  // Root redirects to NASDAQ ranking
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(302, { 'Location': '/static/nasdaq-ranking.html' });
    res.end();
    return;
  }
  
  // API proxy to ML API
  if (req.url.startsWith('/api/')) {
    const ML_API_URL = 'http://localhost:8001';
    const targetUrl = `${ML_API_URL}${req.url}`;
    
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        const proxyReq = http.request(targetUrl, options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          proxyRes.pipe(res);
        });
        proxyReq.on('error', (e) => {
          console.error(`Proxy error: ${e.message}`);
          res.writeHead(500);
          res.end(JSON.stringify({ error: e.message }));
        });
        proxyReq.write(body);
        proxyReq.end();
      });
    } else {
      const proxyReq = http.request(targetUrl, options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        proxyRes.pipe(res);
      });
      proxyReq.on('error', (e) => {
        console.error(`Proxy error: ${e.message}`);
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      });
      proxyReq.end();
    }
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple HTTP server running at http://0.0.0.0:${PORT}`);
  console.log(`Static files served from: ${STATIC_DIR}`);
  console.log(`API proxy to: http://localhost:8001`);
});
