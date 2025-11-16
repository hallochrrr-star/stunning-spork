// worker/tunnel-worker.js - VERSIÓN ESTABLE PARA DEVTOOLS
export default {
  async fetch(request, env, ctx) {
    // 🔧 HEADERS COMPATIBLES CON DEVTOOLS
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Content-Type-Options': 'nosniff'
    };

    // 🎯 MANEJAR OPTIONS PARA CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // 📡 ENDPOINT PRINCIPAL - ESTABLE
      if (path === '/dns-query') {
        const name = url.searchParams.get('name') || 'tunnel.etecsa.tk';
        const type = url.searchParams.get('type') || 'TXT';
        
        // Respuesta DoH estándar y estable
        const dohResponse = {
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
              "TTL": 300,
              "data": type === 'A' ? "93.184.216.34" : `"DoH Tunnel: ${name}"`
            }
          ],
          "timestamp": new Date().toISOString(),
          "server": "dns-tunnel.etecsa.tk"
        };

        // 🔧 PEQUEÑA PAUSA PARA DEVTOOLS
        await new Promise(resolve => setTimeout(resolve, 10));
        
        return new Response(JSON.stringify(dohResponse), { headers });
      }

      // 🚇 ENDPOINT TUNNEL - ESTABLE
      if (path === '/tunnel') {
        const action = url.searchParams.get('action') || 'status';
        
        const tunnelResponse = {
          "status": "active",
          "action": action,
          "tunnel_id": `tun_${Date.now()}`,
          "protocol": "dns-over-https",
          "timestamp": new Date().toISOString(),
          "message": `Tunnel ${action} successful`
        };

        await new Promise(resolve => setTimeout(resolve, 10));
        return new Response(JSON.stringify(tunnelResponse), { headers });
      }

      // 📊 ENDPOINT STATUS - SIEMPRE FUNCIONAL
      if (path === '/status' || path === '/') {
        const statusResponse = {
          "status": "active",
          "message": "🚀 DNS Tunnel Server - Operational",
          "version": "1.0.0",
          "timestamp": new Date().toISOString(),
          "endpoints": {
            "dns_query": "/dns-query?name=example.com&type=TXT",
            "tunnel": "/tunnel?action=connect",
            "status": "/status"
          }
        };

        await new Promise(resolve => setTimeout(resolve, 10));
        return new Response(JSON.stringify(statusResponse, null, 2), { headers });
      }

      // 🔍 ENDPOINT NO ENCONTRADO - RESPUESTA AMIGABLE
      const notFoundResponse = {
        "error": "Endpoint not found",
        "available_endpoints": [
          "/status",
          "/dns-query?name=example.com&type=TXT", 
          "/tunnel?action=connect"
        ],
        "timestamp": new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 10));
      return new Response(JSON.stringify(notFoundResponse), { 
        status: 404,
        headers 
      });

    } catch (error) {
      // 🛑 MANEJO DE ERRORES ESTABLE
      const errorResponse = {
        "error": "Internal server error",
        "message": error.message,
        "timestamp": new Date().toISOString()
      };

      await new Promise(resolve => setTimeout(resolve, 10));
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers
      });
    }
  }
}
