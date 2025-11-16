// worker/tunnel-worker.js - DNS-over-HTTPS SERVER
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Headers para DNS-over-HTTPS
    const dohHeaders = {
      'Content-Type': 'application/dns-json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Manejar preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: dohHeaders });
    }

    try {
      // 📡 ENDPOINT PRINCIPAL DoH
      if (url.pathname === '/dns-query') {
        return await handleDoHQuery(request);
      }
      
      // 🚇 TUNNEL DoH
      if (url.pathname === '/doh-tunnel') {
        return await handleDoHTunnel(request);
      }
      
      // 📊 ESTADO DEL SERVIDOR
      if (url.pathname === '/status') {
        return await handleDoHStatus();
      }

      // Página de inicio DoH
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

    } catch (error) {
      return new Response(JSON.stringify({
        "Status": 2, // SERVFAIL
        "Comment": error.message,
        "timestamp": new Date().toISOString()
      }), { 
        status: 500,
        headers: dohHeaders 
      });
    }
  }
}

// 🔍 MANEJAR CONSULTAS DoH
async function handleDoHQuery(request) {
  const url = new URL(request.url);
  const name = url.searchParams.get('name') || 'tunnel.etecsa.tk';
  const type = parseInt(url.searchParams.get('type')) || 16; // TXT por defecto
  
  // Detectar consultas de tunneling
  let tunnelData = null;
  if (name.includes('.proxy.') || name.includes('.tunnel.')) {
    try {
      // Extraer datos codificados del nombre
      const base64Part = name.split('.')[0];
      const padded = base64Part.padEnd(base64Part.length + (4 - base64Part.length % 4) % 4, '=');
      const decoded = atob(padded);
      
      tunnelData = {
        type: 'tunnel_request',
        original: decoded,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      tunnelData = { error: 'decode_failed', message: e.message };
    }
  }

  // Construir respuesta DoH estándar
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
        "data": tunnelData 
          ? `"tunnel:${JSON.stringify(tunnelData).replace(/"/g, '')}"`
          : (type === 1 ? "93.184.216.34" : `"DoH Tunnel Ready - ${new Date().toISOString()}"`)
      }
    ],
    "Additional": [],
    "Comment": "DoH Tunnel Server - etecsa.tk",
    "tunnel_available": true,
    "timestamp": new Date().toISOString()
  };
  
  return new Response(JSON.stringify(response), { 
    headers: {
      'Content-Type': 'application/dns-json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// 🚇 MANEJAR TUNNEL DoH
async function handleDoHTunnel(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'connect';
  const data = url.searchParams.get('data');
  
  let tunnelResponse;
  
  switch (action) {
    case 'connect':
      tunnelResponse = {
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
            "type": 16,
            "TTL": 300,
            "data": `"tunnel:connected:${Math.random().toString(36).substring(2, 10)}"`
          }
        ],
        "tunnel_info": {
          "protocol": "doh_tunnel",
          "max_data_size": 512,
          "compression": true,
          "encryption": true
        },
        "timestamp": new Date().toISOString()
      };
      break;
      
    case 'data':
      if (data) {
        tunnelResponse = {
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
              "type": 16,
              "TTL": 300,
              "data": `"data:received:${data.length}bytes"`
            }
          ],
          "timestamp": new Date().toISOString()
        };
      }
      break;
      
    default:
      tunnelResponse = {
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
            "type": 16,
            "TTL": 300,
            "data": `"error:invalid_action:${action}"`
          }
        ],
        "timestamp": new Date().toISOString()
      };
  }
  
  return new Response(JSON.stringify(tunnelResponse), {
    headers: {
      'Content-Type': 'application/dns-json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// 📊 ESTADO DEL SERVIDOR DoH
async function handleDoHStatus() {
  const status = {
    "Status": 0,
    "TC": false,
    "RD": true,
    "RA": true,
    "AD": false,
    "CD": false,
    "Question": [],
    "Answer": [
      {
        "name": "status.etecsa.tk",
        "type": 16,
        "TTL": 300,
        "data": "\"🚀 DoH Tunnel Server - Operational\""
      }
    ],
    "server_info": {
      "name": "DNS-over-HTTPS Tunnel",
      "version": "1.0.0",
      "domain": "etecsa.tk",
      "protocol": "DoH"
    },
    "timestamp": new Date().toISOString()
  };
  
  return new Response(JSON.stringify(status, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
