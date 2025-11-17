// dns-tunnel-worker.js - Código PARA PEGAR EN CLOUDFLARE WORKERS
const WORKER_DOMAIN = 'dns-tunnel.hallochrrr.workers.dev';

async function handleRequest(request) {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const type = parseInt(url.searchParams.get('type')) || 16; // TXT por defecto

    // Si no hay parámetro name, mostrar información
    if (!name) {
        return new Response('DNS Tunnel Worker - Operativo\nUse: ?name=domain&type=TXT', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    try {
        // Prevenir bucles - no procesar nuestro propio dominio directamente
        if (name === WORKER_DOMAIN || name.endsWith('.' + WORKER_DOMAIN)) {
            return createDNSResponse([], 3); // NXDOMAIN
        }

        // Manejar diferentes tipos de consultas
        if (type === 16) { // TXT
            return await handleTXTQuery(name);
        } else if (type === 1) { // A
            return await handleAQuery(name);
        } else {
            return createDNSResponse([], 0);
        }

    } catch (error) {
        console.error('Error en Worker:', error);
        return createDNSResponse([], 2); // SERVFAIL
    }
}

async function handleTXTQuery(name) {
    try {
        console.log('Procesando TXT query:', name);
        
        // Extraer datos codificados del subdominio
        const domainParts = name.split('.');
        if (domainParts.length < 3) {
            return createDNSResponse([], 3);
        }

        const encodedData = domainParts[0];
        
        // Validar que sean datos hex válidos
        if (!/^[0-9a-fA-F]+$/.test(encodedData)) {
            return createDNSResponse([], 3);
        }

        // Decodificar datos binarios
        const requestBytes = hexToBytes(encodedData);
        const requestText = new TextDecoder().decode(requestBytes);
        const httpRequest = JSON.parse(requestText);
        
        // Validar estructura básica
        if (!httpRequest.url || !httpRequest.method) {
            throw new Error('Estructura de petición inválida');
        }

        // Prevenir bucles infinitos - verificar que no sea nuestro dominio
        try {
            const targetUrl = new URL(httpRequest.url);
            if (targetUrl.hostname.includes(WORKER_DOMAIN)) {
                throw new Error('Prevención de bucle: No se puede hacer petición al propio worker');
            }
        } catch (urlError) {
            throw new Error('URL inválida: ' + httpRequest.url);
        }

        // Preparar petición HTTP con timeout
        const init = {
            method: httpRequest.method,
            headers: httpRequest.headers || {},
            signal: AbortSignal.timeout(15000) // 15 segundos timeout
        };

        // Agregar body si existe
        if (httpRequest.body) {
            init.body = hexToBytes(httpRequest.body);
        }

        // Realizar petición HTTP
        const response = await fetch(httpRequest.url, init);
        
        // Preparar respuesta
        const responseData = {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: bytesToHex(await response.arrayBuffer())
        };

        // Codificar respuesta
        const responseJson = JSON.stringify(responseData);
        const responseHex = bytesToHex(new TextEncoder().encode(responseJson));
        
        // Fragmentar para DNS (límite ~250 chars por TXT)
        const chunks = splitIntoChunks(responseHex, 240);
        return createDNSResponse(chunks, 0);

    } catch (error) {
        console.error('Error en TXT query:', error);
        
        // Enviar error de vuelta al cliente
        const errorData = {
            error: error.message,
            status: 500
        };
        const errorHex = bytesToHex(new TextEncoder().encode(JSON.stringify(errorData)));
        const chunks = splitIntoChunks(errorHex, 240);
        return createDNSResponse(chunks, 0);
    }
}

async function handleAQuery(name) {
    // Para consultas A, devolver IPs dummy (necesario para compatibilidad)
    const answers = [
        {
            name: name,
            type: 1,
            TTL: 300,
            data: '1.1.1.1'
        },
        {
            name: name,
            type: 1, 
            TTL: 300,
            data: '8.8.8.8'
        }
    ];

    return new Response(JSON.stringify({
        Status: 0,
        Answer: answers
    }), {
        headers: { 
            'Content-Type': 'application/dns-json',
            'Cache-Control': 'no-cache'
        }
    });
}

function createDNSResponse(dataChunks, status) {
    const answers = dataChunks.map(chunk => ({
        name: WORKER_DOMAIN,
        type: 16, // TXT record
        TTL: 60, // TTL corto para datos frescos
        data: `"${chunk}"` // Formato TXT correcto con comillas
    }));

    return new Response(JSON.stringify({
        Status: status,
        Answer: answers
    }), {
        headers: { 
            'Content-Type': 'application/dns-json',
            'Cache-Control': 'no-cache, no-store',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

// Utilidades
function splitIntoChunks(str, chunkSize) {
    const chunks = [];
    for (let i = 0; i < str.length; i += chunkSize) {
        chunks.push(str.substring(i, i + chunkSize));
    }
    return chunks;
}

function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
}

// Event listener para Cloudflare Workers
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
