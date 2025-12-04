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
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                credentials: true,
              },
            },
          },
          {
            'rate-limit': {
              action: {
                max: 100,
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
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                credentials: true,
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
                max: 100,
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

