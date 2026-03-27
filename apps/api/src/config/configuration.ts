export default () => ({
  port: Number.parseInt(process.env.PORT as string, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  throttle: {
    ttl: Number.parseInt(process.env.THROTTLE_TTL as string, 10) || 60,
    limit: Number.parseInt(process.env.THROTTLE_LIMIT as string, 10) || 10,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT as string, 10) || 6379,
  },
});
