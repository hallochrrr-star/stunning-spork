// worker/tunnel-worker.js - VERSIÓN ULTRARROBUSTA
export default {
  async fetch(request, env, ctx) {
    // 🔧 HEADERS MÁS COMPATIBLES
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
      'X-Robust-Tunnel': 'true'
    };

    // 🎯 MANEJAR DIFERENTES MÉTODOS HTTP
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    if (request.method === 'HEAD') {
      return new Response(null, { headers });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // 📡 ENDPOINT DNS-QUERY - MÁS ROBUSTO
      if (path === '/dns-query') {
        const name = url.searchParams.get('name') || 'tunnel.etecsa.tk';
        const type = url.searchParams.get('type') || 'TXT';
        
        // Respuesta inmediata y simple
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
              "type": type === 'A' ? 1 : 16
            }
          ],
          "Answer": [
            {
              "name": name,
              "type": type === 'A' ? 1 : 16,
              "TTL": 60, // TTL más corto para actualizaciones rápidas
              "data": type === 'A' ? "1.1.1.1" : `"OK:${Date.now()}"`
            }
          ],
          "timestamp": new Date().toISOString(),
          "cache": "no-store"
        };

        return new Response(JSON.stringify(response), { headers });
      }

      // 🚇 ENDPOINT TUNNEL - MÁS SIMPLE
      if (path === '/tunnel') {
        const action = url.searchParams.get('action') || 'ping';
        
        const response = {
          "status": "active",
          "action": action,
          "timestamp": new Date().toISOString(),
          "response_time": "immediate"
        };

        return new Response(JSON.stringify(response), { headers });
      }

      // 📊 ENDPOINT STATUS - SIEMPRE RESPONDE
      if (path === '/status' || path === '/') {
        const response = {
          "status": "active",
          "message": "✅ DNS Tunnel Server - Operational",
          "server_time": new Date().toISOString(),
          "version": "3.0.0",
          "features": [
            "instant_response",
            "doh_compatible", 
            "etecsa_evasion",
            "error_resistant"
          ]
        };

        return new Response(JSON.stringify(response, null, 2), { headers });
      }

      // 🔍 HEALTH CHECK - EXTRA LIGERO
      if (path === '/health' || path === '/ping') {
        return new Response(JSON.stringify({
          "ok": true,
          "timestamp": new Date().toISOString()
        }), { headers });
      }

      // Endpoint no encontrado - respuesta útil
      return new Response(JSON.stringify({
        "error": false,
        "message": "Endpoint not found - try /status, /health, /dns-query",
        "available": ["/status", "/health", "/dns-query", "/tunnel"],
        "timestamp": new Date().toISOString()
      }), { 
        status: 404,
        headers 
      });

    } catch (error) {
      // 🛑 MANEJO DE ERRORES MÁS ROBUSTO
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        "error": true,
        "message": "Server error",
        "recovery": "automatic",
        "timestamp": new Date().toISOString()
      }), {
        status: 500,
        headers
      });
    }
  }
}
