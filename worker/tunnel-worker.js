// worker/tunnel-worker.js - VERSIÓN ESTABLE DE EMERGENCIA
export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      
      // Headers básicos
      const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      };

      // Respuesta inmediata - sin lógica compleja
      const response = {
        status: 'active',
        message: '🚀 DNS Tunnel - Minimal Worker',
        path: path,
        timestamp: new Date().toISOString(),
        domain: 'etecsa.tk'
      };

      return new Response(JSON.stringify(response), { headers });
      
    } catch (error) {
      // Respuesta de error controlada
      return new Response(JSON.stringify({
        error: 'Worker error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
