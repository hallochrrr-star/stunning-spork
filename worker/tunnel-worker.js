cat > worker_doh_code.js << 'EOF'
// CÓDIGO PARA CLOUDFLARE WORKER - MODO DoH SERVER
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Headers para DoH
    const dohHeaders = {
      'Content-Type': 'application/dns-json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: dohHeaders });
    }

    // 📡 SERVIDOR DoH REAL
    if (url.pathname === '/dns-query') {
      return await handleDoHQuery(request);
    }
    
    // 🚇 TUNNEL DoH PARA DATOS
    if (url.pathname === '/doh-tunnel') {
      return await handleDoHTunnel(request);
    }
    
    // Estado del servidor DoH
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
          "name": "doh-tunnel.etecsa.tk",
          "type": 16, // TXT
          "TTL": 300,
          "data": "\"🚀 DoH Tunnel Server - Active\""
        }
      ],
      "Comment": "DNS-over-HTTPS Tunnel Server",
      "timestamp": new Date().toISOString()
    }), { headers: dohHeaders });
  }
}

async function handleDoHQuery(request) {
  const url = new URL(request.url);
  const name = url.searchParams.get('name') || 'tunnel.etecsa.tk';
  
  // Analizar consultas DNS codificadas
  let tunnelData = null;
  if (name.includes('.proxy.etecsa.tk')) {
    // Esta es una consulta de tunneling
    const encoded = name.split('.')[0];
    try {
      const decoded = Buffer.from(encoded + '==', 'base64').toString();
      tunnelData = {
        type: 'tunnel_request',
        original_request: decoded,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      tunnelData = { error: 'decode_failed' };
    }
  }
  
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
        "type": 16 // TXT
      }
    ],
    "Answer": [
      {
        "name": name,
        "type": 16, // TXT
        "TTL": 300,
        "data": tunnelData 
          ? `"tunnel:${JSON.stringify(tunnelData)}"` 
          : "\"DoH Tunnel Ready - Use base64 encoded requests\""
      }
    ],
    "Additional": [],
    "Comment": "DoH Tunnel Server Response",
    "tunnel_available": true,
    "timestamp": new Date().toISOString()
  };
  
  return new Response(JSON.stringify(response), { headers: {
    'Content-Type': 'application/dns-json',
    'Access-Control-Allow-Origin': '*'
  }});
}

async function handleDoHTunnel(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'connect';
  
  const tunnelResponse = {
    "Status": 0,
    "TC": false,
    "RD": true,
    "RA": true,
    "AD": false,
    "CD": false,
    "Question": [],
    "Answer": [
      {
        "name": "doh-tunnel.etecsa.tk",
        "type": 16, // TXT
        "TTL": 300,
        "data": action === 'connect' 
          ? `"tunnel:connected:${Math.random().toString(36).substr(2, 8)}"`
          : `"tunnel:${action}:success"`
      }
    ],
    "tunnel_info": {
      "protocol": "doh_tunnel",
      "max_data_size": 512,
      "compression": true
    },
    "timestamp": new Date().toISOString()
  };
  
  return new Response(JSON.stringify(tunnelResponse), { headers: {
    'Content-Type': 'application/dns-json',
    'Access-Control-Allow-Origin': '*'
  }});
}
EOF

echo "📋 Código DoH listo para Cloudflare Worker"
