// Jest global setup — runs before each test file
// Uses CommonJS-compatible env setup (no import needed here)

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32chars';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-32c';
process.env.DB_NAME = 'voclio_test_db';
process.env.DB_PASSWORD = 'test-password';
process.env.ENCRYPTION_SECRET = 'test-encryption-secret-key-for-testing-32c';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.STORAGE_PROVIDER = 's3';
process.env.STORAGE_BUCKET = 'test-bucket';
process.env.STORAGE_REGION = 'us-east-1';
process.env.STORAGE_ACCESS_KEY_ID = 'test-key';
process.env.STORAGE_SECRET_ACCESS_KEY = 'test-secret';
