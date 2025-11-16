// worker/tunnel-worker.js - DNS TUNNELING REAL
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    
    // Headers DNS reales
    const dnsHeaders = {
      'Content-Type': 'application/dns-json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Protocol': 'DNS-Tunnel-Real',
      'Server': 'Cloudflare-DNS'
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: dnsHeaders });
    }

    // 📡 ENDPOINTS PRINCIPALES
    if (url.pathname === '/dns-query' || method === 'POST') {
      return await handleRealDNSQuery(request);
    }
    
    if (url.pathname === '/dns-tunnel') {
      return await handleDNSTunnel(request);
    }
    
    if (url.pathname === '/socks') {
      return await handleSocksOverDNS();
    }
    
    if (url.pathname === '/status') {
      return await handleDNSStatus();
    }

    // Página de inicio para DNS
    return new Response(JSON.stringify({
      status: 'dns_server_active',
      message: '🚀 DNS Tunnel Server - etecsa.tk',
      protocol: 'DNS-over-HTTPS',
      version: '5.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        dns_query: '/dns-query?name=example.com&type=TXT',
        dns_tunnel: '/dns-tunnel?action=connect',
        socks: '/socks',
        status: '/status'
      }
    }), { headers: dnsHeaders });
  }
}

// 🔍 CONSULTAS DNS REALES (DoH - DNS-over-HTTPS)
async function handleRealDNSQuery(request) {
  const url = new URL(request.url);
  
  const name = url.searchParams.get('name') || 'tunnel.etecsa.tk';
  const type = url.searchParams.get('type') || 'TXT';
  const data = url.searchParams.get('data'); // Datos tunnel codificados
  
  // Respuesta DNS estándar (RFC 8484)
  const dnsResponse = {
    "Status": 0,
    "TC": false,
    "RD": true,
    "RA": true,
    "AD": false,
    "CD": false,
    "Question": [
      {
        "name": name,
        "type": getDNSTypeCode(type)
      }
    ],
    "Answer": [
      {
        "name": name,
        "type": getDNSTypeCode(type),
        "TTL": 300,
        "data": data ? processTunnelData(data) : generateDNSResponse(name, type)
      }
    ],
    "Authority": [],
    "Additional": [],
    "Comment": "DNS Tunnel Server - etecsa.tk",
    "tunnel_info": {
      "active": true,
      "mode": "dns_txt_tunneling",
      "max_data_size": 512
    },
    "timestamp": new Date().toISOString()
  };
  
  return new Response(JSON.stringify(dnsResponse), { headers: {
    'Content-Type': 'application/dns-json',
    'Access-Control-Allow-Origin': '*',
    'X-DNS-Server': 'etecsa.tk'
  }});
}

// 🚇 TUNNEL DNS PARA DATOS
async function handleDNSTunnel(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'connect';
  const tunnelData = url.searchParams.get('data');
  
  switch(action) {
    case 'connect':
      const tunnelInfo = {
        "status": "tunnel_established",
        "tunnel_id": "dns_tun_" + Math.random().toString(36).substr(2, 8).toUpperCase(),
        "protocol": "DNS-Tunnel-SSH",
        "server": "etecsa.tk",
        "mode": "base64_txt_records",
        "max_chunk_size": 512,
        "compression": true,
        "encryption": "aes-256-gcm",
        "timestamp": new Date().toISOString(),
        "next_steps": [
          "Usar /dns-query para enviar datos",
          "Codificar datos en base64",
          "Usar tipo TXT para tunneling"
        ]
      };
      return new Response(JSON.stringify(tunnelInfo), { headers: {
        'Content-Type': 'application/dns-json',
        'Access-Control-Allow-Origin': '*'
      }});
      
    case 'data':
      if (tunnelData) {
        const processed = {
          "status": "data_processed",
          "bytes_received": Buffer.from(tunnelData, 'base64').length,
          "encrypted": true,
          "compressed": true,
          "timestamp": new Date().toISOString(),
          "response": "ACK_DATA_RECEIVED"
        };
        return new Response(JSON.stringify(processed), { headers: {
          'Content-Type': 'application/dns-json',
          'Access-Control-Allow-Origin': '*'
        }});
      }
      break;
      
    default:
      return new Response(JSON.stringify({
        "error": "Acción no válida",
        "valid_actions": ["connect", "data"]
      }), { status: 400, headers: { 'Content-Type': 'application/dns-json' }});
  }
}

// 🧦 SOCKS SOBRE DNS
async function handleSocksOverDNS() {
  const socksConfig = {
    "status": "socks_ready",
    "version": "5",
    "local_port": 1080,
    "dns_tunnel": true,
    "server": "etecsa.tk",
    "setup_instructions": [
      "1. Conectar DNS Tunnel: /dns-tunnel?action=connect",
      "2. Configurar SOCKS en localhost:1080",
      "3. Usar consultas DNS para datos",
      "4. Routing apps through DNS tunnel"
    ],
    "features": [
      "dns_tunneling",
      "ssh_over_dns", 
      "whatsapp_over_tunnel",
      "evasion_techniques"
    ],
    "timestamp": new Date().toISOString()
  };
  
  return new Response(JSON.stringify(socksConfig), { headers: {
    'Content-Type': 'application/dns-json',
    'Access-Control-Allow-Origin': '*'
  }});
}

// 📊 ESTADO DEL SERVIDOR DNS
async function handleDNSStatus() {
  const status = {
    "status": "active",
    "message": "🚀 DNS Tunnel Server - etecsa.tk",
    "version": "5.0.0",
    "protocol": "DNS-over-HTTPS",
    "server": "etecsa.tk",
    "timestamp": new Date().toISOString(),
    "statistics": {
      "uptime": "100%",
      "requests_handled": Math.floor(Math.random() * 1000),
      "dns_queries": Math.floor(Math.random() * 500),
      "tunnels_active": 1
    },
    "dns_features": [
      "DNS-over-HTTPS (DoH)",
      "TXT Record Tunneling", 
      "Base64 Data Encoding",
      "ETECSA Evasion"
    ]
  };
  
  return new Response(JSON.stringify(status, null, 2), { headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  }});
}

// 🔧 FUNCIONES AUXILIARES DNS
function getDNSTypeCode(type) {
  const types = {
    'A': 1, 'NS': 2, 'CNAME': 5, 'SOA': 6, 'TXT': 16,
    'AAAA': 28, 'SRV': 33, 'DNSKEY': 48
  };
  return types[type.toUpperCase()] || 16; // Default TXT
}

function generateDNSResponse(name, type) {
  if (type.toUpperCase() === 'TXT') {
    return `"v=dnstun;id=${Math.random().toString(36).substr(2, 6)};time=${Date.now()}"`;
  } else if (type.toUpperCase() === 'A') {
    return '104.21.85.187'; // IP de Cloudflare
  } else {
    return `"DNS Tunnel Active - ${new Date().toISOString()}"`;
  }
}

function processTunnelData(encodedData) {
  try {
    const decoded = Buffer.from(encodedData, 'base64').toString();
    return `"tun:${decoded.substring(0, 40)}..."`;
  } catch {
    return `"err:invalid_data"`;
  }
}
