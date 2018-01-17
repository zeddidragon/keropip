self.addEventListener('install', function(event) {
  self.skipWaiting()
  event.waitUntil(
    caches.open('keropip-v3').then(function(cache) {
      return cache.addAll([
        'index.html',
        'styles.css',
        'favicon.ico',
        'lib/pep.min.js',
        'lib/howler.core.min.js',
        'lib/three.min.js',
        'index.js',
        'assets/poppy.ogg',
        'assets/poppy.m4a',
        'assets/bird/bird.json',
        'assets/bird/bird_face.png',
        'assets/bird/frog_eye.png',
        'assets/bird/frog_face.png',
        'assets/block.png',
        'assets/block2.png',
        'assets/block-fade.png',
        'assets/letters.png',
        'assets/sfx.json',
        'assets/sfx.ogg',
        'assets/sfx.m4a',
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
    })
  )
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open('keropip-v3').then(function(cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request)
      });
    })
  );
});
