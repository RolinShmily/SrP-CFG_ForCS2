import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../out/', import.meta.url));
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const prefix = html.match(/href="([^"]*)\/_next\/static\/[^\"]+\.css"/)?.[1] || '';
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png', '.ico':'image/x-icon', '.woff2':'font/woff2', '.woff':'font/woff', '.zip':'application/zip' };
const server = createServer(async(req,res)=>{
  try {
    let pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
    if (pathname==='/' && prefix) {res.writeHead(302,{Location:`${prefix}/`});res.end();return;}
    if (prefix && !pathname.startsWith(`${prefix}/`)) {res.writeHead(404);res.end('Not found');return;}
    pathname=pathname.slice(prefix.length);
    const target=resolve(root, `.${pathname}`);
    if (target!==resolve(root) && !target.startsWith(resolve(root)+sep)) {res.writeHead(403);res.end('Forbidden');return;}
    let file=target;
    try {if((await stat(file)).isDirectory())file=resolve(file,'index.html');}
    catch(error){
      if(error.code==='ENOENT' && pathname==='/packages.json'){
        // Local preview only: CI generates the real same-origin manifest before building.
        const response=await fetch('https://rolinshmily.github.io/SrP-CFG_ForCS2/packages.json',{signal:AbortSignal.timeout(10000)});
        if(!response.ok)throw new Error(`Package manifest: HTTP ${response.status}`);
        const body=await response.text();if(body.length>262144)throw new Error('Manifest size limit');
        res.writeHead(200,{'Content-Type':types['.json']});res.end(body);return;
      }
      throw error;
    }
    res.writeHead(200,{'Content-Type':types[extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'});res.end(await readFile(file));
  } catch(error) {
    if(error.code==='ENOENT'){res.writeHead(404);res.end('Not found');}
    else{console.error(error);res.writeHead(503);res.end('Preview request unavailable');}
  }
});
server.listen(port,'127.0.0.1',()=>console.log(`Static preview: http://127.0.0.1:${port}${prefix}/`));
