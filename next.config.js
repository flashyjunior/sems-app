/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
};

// PWA configuration (enable after: npm install next-pwa)
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   runtimeCaching: [
//     {
//       urlPattern: /^https:\/\/.*/,
//       handler: 'NetworkFirst',
//       options: {
//         cacheName: 'offlineCache',
//         expiration: {
//           maxEntries: 200,
//         },
//       },
//     },
//   ],
// });
// module.exports = withPWA(nextConfig);

module.exports = nextConfig;
