// workers/dns-tunnel-worker.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
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

    // Permitir acceso directo al worker
    return new Response('DNS Tunnel Worker OK - Use /dns-query for DNS requests', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
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

    console.log(`📥 DNS Query: ${name}, Type: ${type}`);

    // Decodificar peticiones HTTP desde DNS
    if (name.startsWith('http.') || name.startsWith('https.')) {
      return await handleHttpRequest(name);
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
    const parts = encodedName.split('.');
    if (parts.length < 4) {
      return jsonResponse({ Status: 2, Comment: 'Invalid HTTP format' });
    }

    const protocol = parts[0]; // http o https
    const base64Url = parts[1];
    
    // Decodificar URL
    const decodedUrl = atob(base64Url.replace(/-/g, '+').replace(/_/g, '/'));
    console.log(`🌐 Decoded URL: ${decodedUrl}`);
    
    // Validar URL
    if (!isValidUrl(decodedUrl)) {
      return jsonResponse({ Status: 2, Comment: 'Invalid URL' });
    }

    // Hacer petición real
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
    
    console.log(`✅ HTTP Response: ${status}, Size: ${responseData.byteLength} bytes`);
    
    // Crear payload binario
    const payload = createBinaryPayload(status, headers, responseData);
    const chunks = splitToChunks(payload, 180); // 180 bytes por chunk (menos para DNS)
    
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

// ... (las mismas funciones auxiliares que antes)

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function createBinaryPayload(status, headers, data) {
  const statusBuffer = new Uint16Array([status]);
  const headersJson = JSON.stringify(headers);
  const headersBuffer = new TextEncoder().encode(headersJson);
  const headersLength = new Uint16Array([headersBuffer.length]);
  
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
  
  // Metadata como primer chunk
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

async function handleNormalDns(name, type) {
  try {
    const cfResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${name}&type=${type}`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    
    if (cfResponse.ok) {
      const data = await cfResponse.json();
      return jsonResponse(data);
    }
  } catch (e) {
    console.error('DNS query failed:', e);
  }
  
  return jsonResponse({ Status: 2, Comment: 'DNS query failed' });
}
