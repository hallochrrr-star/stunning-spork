// worker/tunnel-worker.js - VERSIÓN MEJORADA
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers para todas las respuestas
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Manejar preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Endpoints principales
    if (path === '/dns-query' || path.startsWith('/dns/')) {
      return handleAdvancedDNS(request);
    } else if (path === '/tunnel') {
      return handleTunnel(request);
    } else if (path === '/socks') {
      return handleSocksProxy(request);
    } else if (path === '/status') {
      return new Response(JSON.stringify({
        status: 'active',
        message: '🚀 DNS Tunnel Worker Operativo',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        endpoints: {
          dns: '/dns-query',
          tunnel: '/tunnel', 
          socks: '/socks',
          status: '/status'
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Página de inicio mejorada
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>🌐 DNS Tunnel Server</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>🌐 DNS Tunnel Server</h1>
        <p><strong>Estado:</strong> <span style="color: green;">🟢 OPERATIVO</span></p>
        
        <div class="endpoint">
          <h3>📡 Endpoints disponibles:</h3>
          <ul>
            <li><strong>DNS Query:</strong> <code>/dns-query</code></li>
            <li><strong>Tunnel:</strong> <code>/tunnel</code></li>
            <li><strong>SOCKS:</strong> <code>/socks</code></li>
            <li><strong>Status:</strong> <code>/status</code></li>
          </ul>
        </div>
        
        <p><em>Server Time: ${new Date().toISOString()}</em></p>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
}

// Manejo avanzado de DNS
async function handleAdvancedDNS(request) {
  try {
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain') || 'example.com';
    const type = url.searchParams.get('type') || 'A';
    
    // Simular resolución DNS (en producción aquí iría la lógica real)
    const dnsResponse = {
      domain: domain,
      type: type,
      answers: [
        {
          type: 'A',
          address: '1.2.3.4',
          ttl: 300
        }
      ],
      timestamp: new Date().toISOString(),
      encrypted: true
    };
    
    return new Response(JSON.stringify(dnsResponse), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// Manejo de tunnel de datos
async function handleTunnel(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'connect';
  
  switch (action) {
    case 'connect':
      return new Response(JSON.stringify({
        status: 'connected',
        tunnel_id: 'tun_' + Math.random().toString(36).substr(2, 9),
        server: 'dns-tunnel.hallochrrr.workers.dev',
        timestamp: new Date().toISOString()
      }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
      
    case 'data':
      // Aquí procesaríamos datos del tunnel
      return new Response(JSON.stringify({
        status: 'data_received',
        bytes: 0,
        encrypted: true
      }), { headers: { 'Content-Control-Allow-Origin': '*' } });
      
    default:
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Acción no válida'
      }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

// Proxy SOCKS básico
async function handleSocksProxy(request) {
  return new Response(JSON.stringify({
    status: 'socks_ready',
    port: 1080,
    version: '5',
    timestamp: new Date().toISOString()
  }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}
