/**
 * Express Gateway System Configuration
 * 
 * Why: Configure gateway system settings
 * How: Defines gateway port, host, and logging
 * Impact: Gateway runs on specified port with proper logging
 */

module.exports = {
  http: {
    port: process.env.GATEWAY_PORT || 8080,
  },
  apiEndpoints: {
    api: process.env.BACKEND_URL || 'http://localhost:5000',
  },
  serviceEndpoints: {
    backend: {
      url: process.env.BACKEND_URL || 'http://localhost:5000',
    },
  },
  policies: [
    'cors',
    'proxy',
    'rate-limit',
    'jwt',
  ],
}

