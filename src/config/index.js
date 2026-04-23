import 'dotenv/config';

// Validate critical environment variables
const validateConfig = () => {
  const errors = [];
  
  // Check JWT secrets
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
    errors.push('JWT_SECRET must be set to a strong secret value');
  }
  
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'your-refresh-secret-key') {
    errors.push('JWT_REFRESH_SECRET must be set to a strong secret value');
  }
  
  // Check database config
  if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === 'password' || process.env.DB_PASSWORD === 'your_postgres_password_here') {
    errors.push('DB_PASSWORD must be set to a secure password');
  }
  
  // In production, enforce stricter validation
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.ALLOWED_ORIGINS) {
      errors.push('ALLOWED_ORIGINS must be set in production');
    }
    
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production');
    }
  }
  
  if (errors.length > 0) {
    console.error('\n❌ Configuration Errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\n💡 Please check your .env file and update the required values.\n');
    process.exit(1);
  }
};

// Run validation
validateConfig();

export default {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'voclio_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || null,
  },

  // Cloud Storage (S3 or Cloudflare R2)
  storage: {
    provider: process.env.STORAGE_PROVIDER || 's3', // 's3' or 'r2'
    bucket: process.env.STORAGE_BUCKET || 'voclio-uploads',
    region: process.env.STORAGE_REGION || 'us-east-1',
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || '',
    endpoint: process.env.STORAGE_ENDPOINT || null, // For Cloudflare R2
    publicUrl: process.env.STORAGE_PUBLIC_URL || '', // For R2 public access
  },

  // Encryption
  encryption: {
    secret: process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'change-this-in-production',
  },
  
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    googleApiKey: process.env.GOOGLE_API_KEY
  },
  
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${process.env.PORT || 3000}/api/calendar/google/callback`
  },
  
  webex: {
    clientId: process.env.WEBEX_CLIENT_ID,
    clientSecret: process.env.WEBEX_CLIENT_SECRET,
    redirectUri: process.env.WEBEX_REDIRECT_URI || `http://localhost:${process.env.PORT || 3000}/api/webex/callback`,
    apiUrl: process.env.WEBEX_API_URL || 'https://webexapis.com/v1'
  },
  
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/webm']
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300 // limit each IP to 300 requests per windowMs
  }
};
