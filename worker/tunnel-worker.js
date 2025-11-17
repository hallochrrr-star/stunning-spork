// Worker MÍNIMO - PEGA ESTO EN CLOUDFLARE
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const type = url.searchParams.get('type') || 'TXT';
    
    // Si no hay parámetros, mostrar info
    if (!name) {
        return new Response('DNS Tunnel Worker - ACTIVO\n\nPara usar: ?name=DOMINIO&type=TIPO\nEjemplo: ?name=google.com&type=TXT', {
            headers: { 'Content-Type': 'text/plain' }
        });
    }
    
    // Respuesta DNS simple de prueba
    const response = {
        Status: 0,
        Answer: [
            {
                name: name,
                type: 16, // TXT
                TTL: 300,
                data: '"5465737420726573707565737461204f4b"' // "Test respuesta OK" en hex
            }
        ]
    };
    
    return new Response(JSON.stringify(response), {
        headers: { 
            'Content-Type': 'application/dns-json',
            'Cache-Control': 'no-cache'
        }
    });
}
