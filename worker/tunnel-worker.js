// workers/dns-tunnel-worker.js
const WORKER_DOMAIN = 'etecsa.tk';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Solo responder a consultas DNS
    if (url.pathname !== '/dns-query' || !url.searchParams.has('name')) {
      return new Response('Not found', { status: 404 });
    }

    try {
      const name = url.searchParams.get('name');
      const type = url.searchParams.get('type') || 'TXT';

      // Evitar bucles - no procesar nuestro propio dominio
      if (name === WORKER_DOMAIN || name.endsWith('.' + WORKER_DOMAIN)) {
        return this.createDNSResponse([], 3); // Status 3 = NXDOMAIN
      }

      // Procesar diferentes tipos de consultas
      if (type === 'TXT') {
        return await this.handleTXTQuery(name);
      } else if (type === 'A') {
        return await this.handleAQuery(name);
      }

      return this.createDNSResponse([], 0);

    } catch (error) {
      console.error('Error:', error);
      return this.createDNSResponse([], 2); // Status 2 = SERVFAIL
    }
  },

  async handleTXTQuery(name) {
    // Extraer datos codificados del subdominio
    const parts = name.split('.');
    if (parts.length < 3) {
      return this.createDNSResponse([], 3);
    }

    const encodedData = parts[0];
    
    try {
      // Decodificar datos binarios (hex)
      const requestData = this.hexToUint8Array(encodedData);
      const httpRequest = JSON.parse(new TextDecoder().decode(requestData));
      
      // Validar URL para evitar bucles
      const targetUrl = new URL(httpRequest.url);
      if (targetUrl.hostname.includes(WORKER_DOMAIN)) {
        throw new Error('Loop detected');
      }

      // Realizar petición HTTP
      const response = await fetch(httpRequest.url, {
        method: httpRequest.method,
        headers: httpRequest.headers,
        body: httpRequest.body ? this.hexToUint8Array(httpRequest.body) : null,
      });

      // Preparar respuesta
      const responseData = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.arrayBuffer(),
      };

      // Codificar respuesta en hex
      const responseJson = JSON.stringify(responseData);
      const responseHex = this.uint8ArrayToHex(new TextEncoder().encode(responseJson));
      
      // Fragmentar en chunks de 250 caracteres (límite DNS)
      const chunks = this.chunkString(responseHex, 250);
      return this.createDNSResponse(chunks, 0);

    } catch (error) {
      console.error('TXT Query error:', error);
      const errorData = JSON.stringify({ error: error.message });
      const errorHex = this.uint8ArrayToHex(new TextEncoder().encode(errorData));
      const chunks = this.chunkString(errorHex, 250);
      return this.createDNSResponse(chunks, 0);
    }
  },

  async handleAQuery(name) {
    // Para consultas A, devolver IPs dummy (necesario para resolución básica)
    const dummyIPs = ['1.1.1.1', '8.8.8.8'];
    const answers = dummyIPs.map(ip => ({
      name: name,
      type: 1, // A record
      TTL: 300,
      data: ip,
    }));

    return new Response(JSON.stringify({
      Status: 0,
      Answer: answers,
    }), {
      headers: { 'Content-Type': 'application/dns-json' },
    });
  },

  createDNSResponse(dataChunks, status = 0) {
    const answers = dataChunks.map((chunk, index) => ({
      name: WORKER_DOMAIN,
      type: 16, // TXT record
      TTL: 60,
      data: chunk,
    }));

    return new Response(JSON.stringify({
      Status: status,
      Answer: answers,
    }), {
      headers: { 
        'Content-Type': 'application/dns-json',
        'Cache-Control': 'no-cache'
      },
    });
  },

  chunkString(str, chunkSize) {
    const chunks = [];
    for (let i = 0; i < str.length; i += chunkSize) {
      chunks.push(str.substring(i, i + chunkSize));
    }
    return chunks;
  },

  hexToUint8Array(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  },

  uint8ArrayToHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
};
