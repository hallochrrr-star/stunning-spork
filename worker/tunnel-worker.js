// worker/tunnel-worker.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Configuración CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Manejar preflight OPTIONS
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Manejar diferentes endpoints
    if (path === '/dns-query' || path === '/dns') {
      return await handleDNSQuery(request);
    } else if (path === '/proxy' || path === '/http') {
      return await handleProxy(request);
    } else if (path === '/tunnel' || path === '/connect') {
      return await handleTunnel(request);
    } else if (path === '/status' || path === '/health') {
      return new Response(JSON.stringify({
        status: 'active',
        message: '🚀 DNS Tunnel Worker Operativo',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }), { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      });
    }
    
    // Página de inicio/información
    return new Response(`
<!DOCTYPE html>
<html>
<head>
    <title>🌐 DNS Tunnel Worker</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007cba; padding-bottom: 10px; }
        .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #007cba; }
        code { background: #eee; padding: 2px 5px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 DNS Tunnel Worker</h1>
        <p><strong>Estado:</strong> <span style="color: green;">🟢 OPERATIVO</span></p>
        <p>Endpoints disponibles para el túnel DNS:</p>
        
        <div class="endpoint">
            <h3>📡 DNS Query</h3>
            <p><code>GET/POST ${url.origin}/dns-query</code></p>
            <p>Maneja consultas DNS para tunneling</p>
        </div>
        
        <div class="endpoint">
            <h3>🔗 HTTP Proxy</h3>
            <p><code>GET ${url.origin}/proxy?url=https://ejemplo.com</code></p>
            <p>Proxy HTTP básico para pruebas</p>
        </div>
        
        <div class="endpoint">
            <h3>⚡ Tunnel Connect</h3>
            <p><code>POST ${url.origin}/tunnel</code></p>
            <p>Endpoint principal para conexiones tunnel</p>
        </div>
        
        <div class="endpoint">
            <h3>📊 Status</h3>
            <p><code>GET ${url.origin}/status</code></p>
            <p>Verifica el estado del servicio</p>
        </div>
        
        <hr>
        <p><strong>📧 Desarrollado por:</strong> hallochrrr</p>
        <p><strong>🕐 Hora del servidor:</strong> <span id="time">${new Date().toISOString()}</span></p>
    </div>
</body>
</html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
}

// Manejar consultas DNS para tunneling
async function handleDNSQuery(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let queryData;
    
    if (contentType.includes('application/json')) {
      queryData = await request.json();
    } else {
      queryData = await request.text();
    }
    
    // Simular respuesta DNS (aquí iría la lógica real de DNS tunneling)
    const response = {
      status: 'success',
      type: 'dns_response',
      timestamp: new Date().toISOString(),
      data: {
        query: queryData,
        response: 'dns-tunnel-response',
        ttl: 300,
        encrypted: true
      },
      server: 'cloudflare-worker'
    };
    
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Manejar proxy HTTP
async function handleProxy(request) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');
  
  if (!targetUrl) {
    return new Response(JSON.stringify({
      error: 'Parámetro "url" requerido',
      ejemplo: `${request.url}?url=https://ejemplo.com`
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Validar URL
    let target;
    try {
      target = new URL(targetUrl);
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'URL inválida',
        message: e.message
      }), { status: 400 });
    }
    
    // Hacer la petición
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'DNS-Tunnel-Proxy/1.0'
      }
    });
    
    const data = await response.text();
    
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'X-Proxy-Server': 'cloudflare-worker-dns-tunnel'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Error del proxy',
      message: error.message,
      url: targetUrl
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Manejar conexiones tunnel (para futuro desarrollo)
async function handleTunnel(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'connect';
    const client = searchParams.get('client') || 'unknown';
    
    const tunnelResponse = {
      status: 'connected',
      action: action,
      client: client,
      timestamp: new Date().toISOString(),
      server: {
        name: 'dns-tunnel-worker',
        location: 'cloudflare',
        version: '1.0.0'
      },
      endpoints: {
        dns: '/dns-query',
        proxy: '/proxy',
        status: '/status'
      }
    };
    
    return new Response(JSON.stringify(tunnelResponse), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'X-Tunnel-Status': 'active'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
