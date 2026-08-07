const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = process.env.PORT || 3000;
const baseDir = process.cwd();
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
};

const server = http.createServer((req, res) => {
  try {
    const parsedUrl = url.parse(req.url || '/');
    let pathname = decodeURIComponent(parsedUrl.pathname || '/');
    if (pathname.includes('..')) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      return res.end('Bad request');
    }

    let filePath = path.join(baseDir, pathname);
    if (pathname === '/' || pathname.endsWith('/')) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        if (!path.extname(pathname)) {
          const fallback = path.join(baseDir, 'index.html');
          fs.createReadStream(fallback).pipe(res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
        }
      }
    });
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
  }
});

server.listen(port, () => {
  console.log(`Static server running at http://127.0.0.1:${port}/`);
});
