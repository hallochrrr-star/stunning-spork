// worker/tunnel-worker.js - VERSIÓN ULTRALIGERA
export default {
  async fetch(request, env, ctx) {
    // 🔥 MÁXIMA VELOCIDAD - Respuesta inmediata
    const startTime = Date.now();
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Headers predefinidos - SIN procesamiento
    const dohHeaders = {
      'Content-Type': 'application/dns-json',
      'Access-Control-Allow-Origin': '*',
      'X-Response-Time': `${Date.now() - startTime}ms`
    };

    // OPTIONS - Respuesta instantánea
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: dohHeaders });
    }

    // 📡 ENDPOINTS ULTRARRÁPIDOS - SIN async/await complejos
    if (path === '/dns-query') {
      const name = url.searchParams.get('name') || 'tunnel.etecsa.tk';
      const type = parseInt(url.searchParams.get('type')) || 16;
      
      const response = {
        "Status": 0,
        "TC": false,
        "RD": true,
        "RA": true,
        "AD": false,
        "CD": false,
        "Question": [{ "name": name, "type": type }],
        "Answer": [{
          "name": name,
          "type": type,
          "TTL": 300,
          "data": type === 1 ? "93.184.216.34" : `"DoH:${name.substring(0,20)}"`
        }],
        "timestamp": new Date().toISOString()
      };
      
      return new Response(JSON.stringify(response), { headers: dohHeaders });
    }
    
    if (path === '/tunnel') {
      const action = url.searchParams.get('action') || 'ready';
      
      const response = {
        "Status": 0,
        "TC": false,
        "RD": true,
        "RA": true,
        "AD": false,
        "CD": false,
        "Question": [],
        "Answer": [{
          "name": "tunnel.etecsa.tk",
          "type": 16,
          "TTL": 300,
          "data": `"tunnel:${action}"`
        }],
        "timestamp": new Date().toISOString()
      };
      
      return new Response(JSON.stringify(response), { headers: dohHeaders });
    }
    
    if (path === '/status' || path === '/') {
      const response = {
        "Status": 0,
        "TC": false,
        "RD": true,
        "RA": true,
        "AD": false,
        "CD": false,
        "Question": [],
        "Answer": [{
          "name": "status.etecsa.tk",
          "type": 16,
          "TTL": 300,
          "data": "\"🚀 ACTIVE - DoH Ready\""
        }],
        "server": "ultralight-worker",
        "response_time": `${Date.now() - startTime}ms`,
        "timestamp": new Date().toISOString()
      };
      
      return new Response(JSON.stringify(response), { headers: dohHeaders });
    }

    // Endpoint no encontrado - respuesta instantánea
    const errorResponse = {
      "Status": 3,
      "Comment": "Endpoint not found",
      "timestamp": new Date().toISOString()
    };
    
    return new Response(JSON.stringify(errorResponse), { headers: dohHeaders });
  }
}
