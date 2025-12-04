/**
 * Express Gateway Configuration
 * 
 * Why: Define gateway routes and policies
 * How: Maps routes to services with shared middleware
 * Impact: All requests use shared authentication and rate limiting
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
  pipelines: {
    default: [
      {
        policies: [
          {
            cors: {
              action: {
                // Support multiple origins (comma-separated) for production
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                credentials: true,
                methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
              },
            },
          },
          {
            'rate-limit': {
              action: {
                max: 500,
                windowMs: 900000,
              },
            },
          },
          {
            proxy: {
              action: {
                serviceEndpoint: 'backend',
                changeOrigin: true,
              },
            },
          },
        ],
      },
    ],
    authenticated: [
      {
        policies: [
          {
            cors: {
              action: {
                // Support multiple origins (comma-separated) for production
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                credentials: true,
                methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
              },
            },
          },
          {
            jwt: {
              action: {
                secretOrPublicKey: process.env.JWT_SECRET || 'default-secret',
                checkCredentialExistence: false,
              },
            },
          },
          {
            'rate-limit': {
              action: {
                max: 500,
                windowMs: 900000,
              },
            },
          },
          {
            proxy: {
              action: {
                serviceEndpoint: 'backend',
                changeOrigin: true,
              },
            },
          },
        ],
      },
    ],
  },
  policies: {
    cors: {},
    proxy: {},
    'rate-limit': {},
    jwt: {},
  },
}

