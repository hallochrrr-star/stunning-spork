// worker/tunnel-worker.js - VERSIÓN ESTABLE
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Headers básicos
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Manejar preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Respuesta simple y estable
    try {
      const response = {
        status: 'active',
        message: '🚀 DNS Tunnel Server - OPERATIVO',
        domain: 'etecsa.tk',
        timestamp: new Date().toISOString(),
        endpoints: {
          status: '/status',
          dns: '/dns-query?name=example.com',
          tunnel: '/tunnel'
        }
      };
      
      return new Response(JSON.stringify(response, null, 2), { headers });
      
    } catch (error) {
      // Respuesta de error controlada
      return new Response(JSON.stringify({
        error: 'Server error',
        message: error.message
      }), {
        status: 500,
        headers
      });
    }
  }
}
