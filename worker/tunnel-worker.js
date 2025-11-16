// worker/tunnel-worker.js - VERSIÓN ESTABLE Y RÁPIDA
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Headers para DNS-over-HTTPS
    const dohHeaders = {
      'Content-Type': 'application/dns-json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Manejo inmediato de OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: dohHeaders });
    }

    try {
      // 📡 ENDPOINT PRINCIPAL DoH - MÍNIMO Y RÁPIDO
      if (path === '/dns-query') {
        return handleSimpleDoH(request);
      }
      
      // 🚇 TUNNEL BÁSICO
      if (path === '/tunnel') {
        return handleSimpleTunnel(request);
      }
      
      // 📊 ESTADO SIMPLE
      if (path === '/status' || path === '/') {
        return new Response(JSON.stringify({
          "Status": 0,
          "TC": false,
          "RD": true,
          "RA": true,
          "AD": false,
          "CD": false,
          "Question": [],
          "Answer": [
            {
              "name": "dns-tunnel.etecsa.tk",
              "type": 16,
              "TTL": 300,
              "data": "\"🚀 DNS Tunnel Active - DoH Ready\""
            }
          ],
          "timestamp": new Date().toISOString(),
          "server": "etecsa.tk"
        }), { headers: dohHeaders });
      }

      // Endpoint no encontrado - respuesta inmediata
      return new Response(JSON.stringify({
        "Status": 3, // NXDOMAIN
        "Comment": "Endpoint not found"
      }), { headers: dohHeaders });

    } catch (error) {
      // Error controlado - respuesta inmediata
      return new Response(JSON.stringify({
        "Status": 2, // SERVFAIL
        "Comment": error.message
      }), { 
        headers: dohHeaders 
      });
    }
  }
}

// 🔍 MANEJAR DoH DE FORMA SIMPLE Y RÁPIDA
async function handleSimpleDoH(request) {
  const url = new URL(request.url);
  const name = url.searchParams.get('name') || 'tunnel.etecsa.tk';
  const type = parseInt(url.searchParams.get('type')) || 16;
  
  // Respuesta DoH estándar - SIN procesamiento complejo
  const response = {
    "Status": 0,
    "TC": false,
    "RD": true, 
    "RA": true,
    "AD": false,
    "CD": false,
    "Question": [
      {
        "name": name,
        "type": type
      }
    ],
    "Answer": [
      {
        "name": name,
        "type": type,
        "TTL": 300,
        "data": type === 1 ? "93.184.216.34" : `"DoH Tunnel: ${name}"`
      }
    ],
    "timestamp": new Date().toISOString()
  };
  
  return new Response(JSON.stringify(response), { 
    headers: {
      'Content-Type': 'application/dns-json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// 🚇 TUNNEL SIMPLE - SIN LÓGICA COMPLEJA
async function handleSimpleTunnel(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'ready';
  
  // Respuesta inmediata sin procesamiento
  const response = {
    "Status": 0,
    "TC": false,
    "RD": true,
    "RA": true,
    "AD": false,
    "CD": false,
    "Question": [],
    "Answer": [
      {
        "name": "tunnel.etecsa.tk",
        "type": 16,
        "TTL": 300,
        "data": `"tunnel:${action}:success"`
      }
    ],
    "tunnel_info": {
      "status": "ready",
      "protocol": "doh_simple"
    },
    "timestamp": new Date().toISOString()
  };
  
  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/dns-json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
