// workers/dns-tunnel-worker.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Evitar bucles infinitos - NO hacer peticiones a nuestro propio dominio
    if (url.hostname.includes('etecsa.tk') || url.hostname.includes('workers.dev')) {
      return new Response('Blocked self-request', { status: 403 });
    }

    // Solo manejar consultas DNS-over-HTTPS
    if (url.pathname === '/dns-query') {
      return await handleDnsQuery(request);
    }

    // Endpoint de salud
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: Date.now(),
        worker: 'dns-tunnel'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('DNS Tunnel Worker OK', { status: 200 });
  }
};

async function handleDnsQuery(request) {
  try {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const type = url.searchParams.get('type') || 'TXT';

    if (!name) {
      return jsonResponse({ Status: 2, Comment: 'Missing name parameter' });
    }

    // Prevenir bucles - no procesar nuestro propio dominio
    if (name.includes('etecsa.tk') || name.includes('workers.dev')) {
      return jsonResponse({ 
        Status: 0, 
        Answer: [{ 
          name: name, 
          type: 16, 
          TTL: 300, 
          data: `"SELF_BLOCK:${btoa('Blocked self-request')}"` 
        }] 
      });
    }

    // Decodificar peticiones HTTP desde DNS
    if (name.startsWith('http.')) {
      return await handleHttpRequest(name);
    }

    // Decodificar peticiones HTTPS desde DNS  
    if (name.startsWith('https.')) {
      return await handleHttpsRequest(name);
    }

    // Consulta DNS normal
    return await handleNormalDns(name, type);

  } catch (error) {
    console.error('Error in DNS query:', error);
    return jsonResponse({ 
      Status: 2, 
      Comment: `Error: ${error.message}` 
    });
  }
}

async function handleHttpRequest(encodedName) {
  try {
    // Formato: http.{base64url}.{random}.etecsa.tk
    const parts = encodedName.split('.');
    if (parts.length < 4) {
      return jsonResponse({ Status: 2, Comment: 'Invalid HTTP format' });
    }

    const base64Url = parts[1];
    const decodedUrl = atob(base64Url.replace(/-/g, '+').replace(/_/g, '/'));
    
    // Validar URL para prevenir SSRF
    if (!isValidUrl(decodedUrl)) {
      return jsonResponse({ Status: 2, Comment: 'Invalid URL' });
    }

    // Hacer petición HTTP real
    const response = await fetch(decodedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'DNS-Tunnel-Client/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    });

    // Codificar respuesta en formato binario compacto
    const responseData = await response.arrayBuffer();
    const status = response.status;
    const headers = Object.fromEntries(response.headers.entries());
    
    // Crear payload binario compacto
    const payload = createBinaryPayload(status, headers, responseData);
    
    // Dividir en chunks para DNS
    const chunks = splitToChunks(payload, 200); // 200 bytes por chunk
    
    return createDnsResponse(chunks);

  } catch (error) {
    console.error('HTTP request failed:', error);
    return jsonResponse({ 
      Status: 2, 
      Answer: [{ 
        name: encodedName, 
        type: 16, 
        TTL: 60, 
        data: `"ERROR:${btoa(error.message)}"` 
      }] 
    });
  }
}

async function handleHttpsRequest(encodedName) {
  try {
    // Formato: https.{base64url}.{random}.etecsa.tk
    const parts = encodedName.split('.');
    if (parts.length < 4) {
      return jsonResponse({ Status: 2, Comment: 'Invalid HTTPS format' });
    }

    const base64Url = parts[1];
    let decodedUrl = atob(base64Url.replace(/-/g, '+').replace(/_/g, '/'));
    
    // Asegurar que sea HTTPS
    if (!decodedUrl.startsWith('https://')) {
      decodedUrl = 'https://' + decodedUrl;
    }

    if (!isValidUrl(decodedUrl)) {
      return jsonResponse({ Status: 2, Comment: 'Invalid HTTPS URL' });
    }

    // Petición HTTPS con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(decodedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'DNS-Tunnel-Client/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseData = await response.arrayBuffer();
    const status = response.status;
    const headers = Object.fromEntries(response.headers.entries());
    
    const payload = createBinaryPayload(status, headers, responseData);
    const chunks = splitToChunks(payload, 200);
    
    return createDnsResponse(chunks);

  } catch (error) {
    console.error('HTTPS request failed:', error);
    return jsonResponse({ 
      Status: 2, 
      Answer: [{ 
        name: encodedName, 
        type: 16, 
        TTL: 60, 
        data: `"HTTPS_ERROR:${btoa(error.message)}"` 
      }] 
    });
  }
}

async function handleNormalDns(name, type) {
  // Para consultas DNS normales, usar Cloudflare DNS
  const cfResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${name}&type=${type}`, {
    headers: { 'Accept': 'application/dns-json' }
  });
  
  if (cfResponse.ok) {
    const data = await cfResponse.json();
    return jsonResponse(data);
  }
  
  return jsonResponse({ Status: 2, Comment: 'DNS query failed' });
}

// Utilidades
function isValidUrl(string) {
  try {
    const url = new URL(string);
    // Bloquear localhost y redes privadas
    if (url.hostname === 'localhost' || 
        url.hostname === '127.0.0.1' ||
        url.hostname === '::1' ||
        url.hostname.endsWith('.local') ||
        url.hostname.endsWith('.internal')) {
      return false;
    }
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function createBinaryPayload(status, headers, data) {
  const statusBuffer = new Uint16Array([status]);
  const headersBuffer = new TextEncoder().encode(JSON.stringify(headers));
  const headersLength = new Uint16Array([headersBuffer.length]);
  
  // Concatenar todo: [status(2)][headers_length(2)][headers][data]
  const totalLength = 4 + headersBuffer.length + data.byteLength;
  const payload = new Uint8Array(totalLength);
  
  payload.set(new Uint8Array(statusBuffer.buffer), 0);
  payload.set(new Uint8Array(headersLength.buffer), 2);
  payload.set(headersBuffer, 4);
  payload.set(new Uint8Array(data), 4 + headersBuffer.length);
  
  return payload;
}

function splitToChunks(data, chunkSize) {
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
}

function createDnsResponse(chunks) {
  const answers = chunks.map((chunk, index) => {
    // Convertir a base64 para TXT (más eficiente que texto plano)
    const base64Data = btoa(String.fromCharCode(...chunk))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return {
      name: `chunk${index}.etecsa.tk`,
      type: 16,
      TTL: 300,
      data: `"${base64Data}"`
    };
  });
  
  // Añadir metadata como primer chunk
  answers.unshift({
    name: "meta.etecsa.tk",
    type: 16,
    TTL: 300,
    data: `"CHUNKS:${chunks.length}"`
  });
  
  return jsonResponse({
    Status: 0,
    Answer: answers
  });
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    headers: { 
      'Content-Type': 'application/dns-json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
