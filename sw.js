// Define um nome e versão para o cache
const CACHE_NAME = 'agente-ia-cache-v1';

// Lista de arquivos essenciais para o "casco" do aplicativo
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/icon.svg'
];

// Evento de instalação: abre o cache e armazena os arquivos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de ativação: limpa caches antigos
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento de fetch: intercepta as requisições de rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o recurso estiver no cache, retorna ele
        if (response) {
          return response;
        }

        // Caso contrário, faz a requisição na rede
        return fetch(event.request).then(
          response => {
            // Respostas de APIs de terceiros (como as de LLM) não devem ser cacheadas aqui
            // para garantir que os dados sejam sempre atuais.
            if (!response || response.status !== 200 || response.type === 'opaque' || event.request.url.includes('aistudiocdn')) {
              return response;
            }
            
            // Clona a resposta para que ela possa ser usada tanto pelo navegador quanto pelo cache
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                 // Não estamos cacheando novas respostas de fetch por padrão
                 // para manter o exemplo simples e focado no app shell.
                 // cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
      .catch(() => {
        // Se a busca no cache e na rede falhar (offline),
        // podemos retornar uma página de fallback, se tivéssemos uma.
        // Por agora, o erro de rede será propagado.
      })
  );
});
