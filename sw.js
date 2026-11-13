// ক্যাশের নাম বদলালে পুরনো ক্যাশ মুছে যায় — বড় পরিবর্তনে এটা বাড়ান
const CACHE = 'hisab-v4';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first: অনলাইনে থাকলে সবসময় নতুন ভার্সন, অফলাইনে ক্যাশ থেকে।
// শুধু নিজের সাইটের GET রিকোয়েস্ট — Google API / font এ হাত দেওয়া হয় না।
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached =>
          cached || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())
        )
      )
  );
});
