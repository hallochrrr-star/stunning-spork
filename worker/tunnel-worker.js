// workers/dns-tunnel-worker.js
const WORKER_DOMAIN = 'etecsa.tk';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const dnsName = url.searchParams.get('name');
      const dnsType = parseInt(url.searchParams.get('type') || '16'); // TXT por defecto

      // Si no es una consulta DNS válida, responder con error
      if (!dnsName) {
        return new Response('DNS Query Worker - Use ?name=domain&type=TXT', { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Prevenir bucles infinitos - no procesar nuestro propio dominio
      if (dnsName.includes(WORKER_DOMAIN)) {
        return this.createDNSResponse([], 3); // NXDOMAIN
      }

      // Manejar diferentes tipos de consultas
      switch (dnsType) {
        case 1:  // A record
          return await this.handleAQuery(dnsName);
        case 16: // TXT record  
          return await this.handleTXTQuery(dnsName);
        default:
          return this.createDNSResponse([], 0);
      }

    } catch (error) {
      console.error('Worker Error:', error);
      return this.createDNSResponse([], 2); // SERVFAIL
    }
  },

  async handleTXTQuery(name) {
    try {
      // Extraer datos codificados del subdominio
      const domainParts = name.split('.');
      if (domainParts.length < 2) {
        return this.createDNSResponse([], 3);
      }

      const encodedData = domainParts[0];
      
      // Validar que sea datos hex válidos
      if (!/^[0-9a-fA-F]+$/.test(encodedData) || encodedData.length < 4) {
        return this.createDNSResponse([], 3);
      }

      // Decodificar datos binarios (hex)
      const requestBytes = this.hexToBytes(encodedData);
      const requestText = new TextDecoder().decode(requestBytes);
      const httpRequest = JSON.parse(requestText);
      
      // Validar estructura de la petición
      if (!httpRequest.url || !httpRequest.method) {
        throw new Error('Invalid request structure');
      }

      // Prevenir bucles - verificar que la URL no apunte a nuestro dominio
      const targetUrl = new URL(httpRequest.url);
      if (targetUrl.hostname.includes(WORKER_DOMAIN)) {
        throw new Error('Loop prevention: Cannot request worker domain');
      }

      // Realizar petición HTTP con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(httpRequest.url, {
        method: httpRequest.method,
        headers: httpRequest.headers,
        body: httpRequest.body ? this.hexToBytes(httpRequest.body) : null,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Preparar respuesta optimizada
      const responseData = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.arrayBuffer(),
      };

      // Codificar respuesta en hex (binario)
      const responseJson = JSON.stringify(responseData);
      const responseHex = this.bytesToHex(new TextEncoder().encode(responseJson));
      
      // Fragmentar en chunks para DNS (límite de 255 chars por TXT)
      const chunks = this.splitIntoChunks(responseHex, 240);
      return this.createDNSResponse(chunks, 0);

    } catch (error) {
      console.error('TXT Query Error:', error);
      
      // Enviar error al cliente
      const errorResponse = {
        error: error.message,
        status: 500
      };
      const errorHex = this.bytesToHex(new TextEncoder().encode(JSON.stringify(errorResponse)));
      const chunks = this.splitIntoChunks(errorHex, 240);
      return this.createDNSResponse(chunks, 0);
    }
  },

  async handleAQuery(name) {
    // Para consultas A, devolver IPs dummy (necesario para resolución básica)
    // Usar IPs de Cloudflare para mejor compatibilidad
    const dummyIPs = ['1.1.1.1', '1.0.0.1'];
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
      headers: { 
        'Content-Type': 'application/dns-json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });
  },

  createDNSResponse(dataChunks, status = 0) {
    const answers = dataChunks.map((chunk, index) => ({
      name: WORKER_DOMAIN,
      type: 16, // TXT record
      TTL: 60, // TTL corto para datos frescos
      data: `"${chunk}"`, // Formato TXT correcto
    }));

    return new Response(JSON.stringify({
      Status: status,
      Answer: answers,
    }), {
      headers: { 
        'Content-Type': 'application/dns-json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
    });
  },

  splitIntoChunks(str, chunkSize) {
    const chunks = [];
    for (let i = 0; i < str.length; i += chunkSize) {
      chunks.push(str.substring(i, i + chunkSize));
    }
    return chunks;
  },

  hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  },

  bytesToHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// Handler para el event listener
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
})

async function handleRequest(request) {
  const worker = new Worker();
  return worker.fetch(request);
}
