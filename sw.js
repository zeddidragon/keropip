const namespace = 'keropip-v7'
const requiredAssets = [
  'assets/sfx.m4a',
  'assets/sfx.ogg',
  'assets/poppy.m4a',
  'assets/poppy.ogg',
]

async function checkIfReady() {
  const allClients = await clients.matchAll()
  const cache = await caches.open(namespace)
  const path = self.location.pathname.split('/').slice(0, -1).join('/') + '/'
  const paths = requiredAssets.map(url => path + url)
  const matches = await Promise.all(paths.map(p => cache.match(p)))
  const size = matches
    .filter(m => m)
    .reduce((set, val) => set.add(val.url.split('.')[0]), new Set)
    .size

  if(size < 2) return
  for(const client of allClients) {
    client.postMessage({msg: 'install-ready'})
  }
}

self.addEventListener('install', function(event) {
  self.skipWaiting()
  event.waitUntil(
    caches.open(namespace).then(function(cache) {
      return cache.addAll([
        'index.html',
        'styles.css',
        'favicon.ico',
        'lib/pep.min.js',
        'lib/howler.core.min.js',
        'lib/three.min.js',
        'index.js',
        'assets/bird/bird.json',
        'assets/bird/bird_face.png',
        'assets/bird/frog_eye.png',
        'assets/bird/frog_face.png',
        'assets/block.png',
        'assets/block2.png',
        'assets/block-fade.png',
        'assets/letters.png',
        'assets/sfx.json',
        'levels/1',
        'levels/2',
        'levels/3',
        'levels/4',
        'levels/5',
        'levels/6',
        'levels/7',
        'levels/8',
        'levels/9',
        'levels/10',
        'levels/11',
        'levels/12',
        'levels/13',
        'levels/14',
        'levels/15',
        'levels/16',
        'levels/17',
        'levels/18',
        'levels/19',
        'levels/20',
        'levels/21',
        'levels/22',
        'levels/23',
        'levels/24',
        'levels/25',
        'levels/26'
      ]);
    }) .then(checkIfReady)
  )
});

async function onFetch(event) {
  const cache = await caches.open(namespace)
  const response = await cache.match(event.request)
  if(response) return response
  const fetchResponse = await fetch(event.request)
  if(event.request.url.includes('assets')) {
    await cache.put(event.request, fetchResponse.clone());
  }
  return fetchResponse
}

self.addEventListener('fetch', function(event) {
  event.respondWith(onFetch(event));
});

self.addEventListener('message', function(event) {
  checkIfReady()
})
