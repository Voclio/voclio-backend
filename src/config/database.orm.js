import { Sequelize } from 'sequelize';
import 'dotenv/config';

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ Missing required database environment variables:', missingEnvVars.join(', '));
  console.error('💡 Please configure these variables in your .env file');
  process.exit(1);
}

// Database configuration with fallback for development
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'voclio_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: process.env.DB_HOST?.includes('neon.tech') || process.env.DB_HOST?.includes('aws') ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Test connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database ORM connected successfully');
    if (missingEnvVars.length > 0) {
      console.warn('⚠️  Using fallback database credentials. Update .env file for production.');
    }
  })
  .catch(err => {
    console.error('❌ Unable to connect to database:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

export default sequelize;
