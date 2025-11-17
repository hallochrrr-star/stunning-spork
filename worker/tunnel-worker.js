// Worker para etecsa.tk - PEGA ESTO EN CLOUDFLARE
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    try {
        const url = new URL(request.url);
        const name = url.searchParams.get('name');
        const type = url.searchParams.get('type') || 'TXT';
        
        console.log(`[WORKER] Consulta: ${name}, tipo: ${type}`);
        
        // Si no hay parámetros, mostrar información
        if (!name) {
            return new Response('DNS Tunnel Worker - ACTIVO\n\nUsar: ?name=DOMINIO&type=TIPO\nEjemplo: ?name=google.com&type=TXT', {
                headers: { 'Content-Type': 'text/plain' }
            });
        }
        
        // Prevenir bucles - no procesar nuestro propio dominio
        if (name.includes('etecsa.tk')) {
            console.log('[WORKER] Prevención de bucle activada');
            return createDNSResponse([], 3);
        }
        
        // Manejar diferentes tipos de consultas
        if (type === 'TXT') {
            return await handleTXTQuery(name);
        } else if (type === 'A') {
            return await handleAQuery(name);
        } else {
            return createDNSResponse([], 0);
        }
        
    } catch (error) {
        console.error('[WORKER] Error general:', error);
        return createDNSResponse([], 2);
    }
}

async function handleTXTQuery(name) {
    try {
        console.log('[WORKER] Procesando TXT query:', name);
        
        // Verificar si es una petición de datos (debe tener .data. en el nombre)
        if (!name.includes('.data.')) {
            console.log('[WORKER] No es petición de datos, retornando vacío');
            return createDNSResponse([], 0);
        }
        
        // Extraer datos hex del subdominio
        const hexData = name.split('.')[0];
        
        // Validar formato hex
        if (!/^[0-9a-fA-F]+$/.test(hexData)) {
            console.log('[WORKER] Datos hex inválidos');
            return createDNSResponse([], 3);
        }
        
        console.log('[WORKER] Datos hex recibidos:', hexData.substring(0, 50) + '...');
        
        // Decodificar la petición
        const requestBytes = hexToBytes(hexData);
        const requestText = new TextDecoder().decode(requestBytes);
        const requestData = JSON.parse(requestText);
        
        console.log('[WORKER] Petición decodificada:', {
            method: requestData.method,
            url: requestData.url,
            hasBody: !!requestData.body
        });
        
        // Validar URL para prevenir bucles
        try {
            const targetUrl = new URL(requestData.url);
            if (targetUrl.hostname.includes('etecsa.tk')) {
                throw new Error('Bucle detectado: no se puede hacer petición al propio worker');
            }
        } catch (urlError) {
            throw new Error('URL inválida: ' + requestData.url);
        }
        
        // Realizar petición HTTP con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const fetchOptions = {
            method: requestData.method || 'GET',
            headers: requestData.headers || {},
            signal: controller.signal
        };
        
        // Agregar body si existe
        if (requestData.body) {
            fetchOptions.body = hexToBytes(requestData.body);
        }
        
        const response = await fetch(requestData.url, fetchOptions);
        clearTimeout(timeoutId);
        
        // Preparar respuesta
        const responseData = {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: bytesToHex(await response.arrayBuffer())
        };
        
        console.log('[WORKER] Respuesta preparada, status:', response.status);
        
        // Codificar y fragmentar respuesta
        const responseJson = JSON.stringify(responseData);
        const responseHex = bytesToHex(new TextEncoder().encode(responseJson));
        const chunks = splitChunks(responseHex, 200);
        
        console.log('[WORKER] Enviando', chunks.length, 'chunks');
        return createDNSResponse(chunks, 0);
        
    } catch (error) {
        console.error('[WORKER] Error en TXT query:', error);
        
        // Enviar error al cliente
        const errorData = {
            error: error.message,
            status: 500
        };
        const errorHex = bytesToHex(new TextEncoder().encode(JSON.stringify(errorData)));
        const chunks = splitChunks(errorHex, 200);
        return createDNSResponse(chunks, 0);
    }
}

async function handleAQuery(name) {
    // Para consultas A, devolver IPs dummy
    const answers = [
        {
            name: name,
            type: 1,
            TTL: 300,
            data: '1.1.1.1'
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

function createDNSResponse(chunks, status) {
    const answers = chunks.map(chunk => ({
        name: 'etecsa.tk',
        type: 16,
        TTL: 60,
        data: `"${chunk}"`
    }));
    
    return new Response(JSON.stringify({
        Status: status,
        Answer: answers
    }), {
        headers: { 
            'Content-Type': 'application/dns-json',
            'Cache-Control': 'no-cache, no-store'
        }
    });
}

// Utilidades
function splitChunks(str, size) {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
        chunks.push(str.substring(i, i + size));
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
