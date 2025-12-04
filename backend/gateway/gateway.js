/**
 * Express Gateway Configuration
 * 
 * Why: Centralize shared services like authentication and rate limiting
 * How: Uses Express Gateway to proxy requests with shared middleware
 * Impact: Consistent authentication and rate limiting across services
 * 
 * Gateway Flow:
 * 1. Request received at gateway
 * 2. Apply shared middleware (auth, rate limiting)
 * 3. Proxy to appropriate service
 * 4. Return response
 */

const gateway = require('express-gateway')
const path = require('path')

/**
 * Initialize Express Gateway
 * Why: Start API gateway for shared services
 * How: Loads gateway configuration and starts gateway server
 * Impact: All requests go through gateway with shared middleware
 */
gateway()
  .load(path.join(__dirname, './config'))
  .run()

