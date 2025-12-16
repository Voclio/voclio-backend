#!/usr/bin/env node

/**
 * Quick Setup Script for Voclio API
 * Run with: node setup.js
 */

const fs = require("fs");
const path = require("path");

console.log("\n🚀 Voclio API - Quick Setup\n");
console.log("━".repeat(50));

// Check if old folders exist
const oldFolders = ["routes", "config", "middleware", "services"];
const foldersToDelete = oldFolders.filter((folder) =>
  fs.existsSync(path.join(__dirname, folder))
);

if (foldersToDelete.length > 0) {
  console.log("\n⚠️  Old folder structure detected:");
  foldersToDelete.forEach((folder) => console.log(`   - ${folder}/`));
  console.log("\n   These can be safely deleted now that code is in src/");
  console.log("\n   To delete, run:");
  console.log("   Remove-Item -Recurse -Force " + foldersToDelete.join(", "));
}

// Check if uploads directory exists
const uploadsDir = path.join(__dirname, "uploads", "voice");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("\n✅ Created uploads/voice directory");
}

// Check environment variables
const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.log("\n❌ .env file not found!");
  console.log("   Please create .env file with required variables");
} else {
  const envContent = fs.readFileSync(envPath, "utf8");
  const required = [
    "DB_HOST",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "JWT_SECRET",
    "OPENROUTER_API_KEY",
  ];
  const missing = required.filter((key) => !envContent.includes(key));

  if (missing.length > 0) {
    console.log("\n⚠️  Missing environment variables:");
    missing.forEach((key) => console.log(`   - ${key}`));
  } else {
    console.log("\n✅ All required environment variables are set");
  }
}

// Check if PostgreSQL is accessible
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

console.log("\n🔍 Testing database connection...");

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.log("❌ Database connection failed");
    console.log("   Error:", err.message);
    console.log("\n   Steps to fix:");
    console.log("   1. Install PostgreSQL");
    console.log("   2. Create database: createdb voclio_db");
    console.log("   3. Update .env with correct DB_PASSWORD");
    console.log("   4. Run: npm run init-db");
  } else {
    console.log("✅ Database connected successfully!");
    console.log("   Server time:", res.rows[0].now);
  }

  pool.end();

  console.log("\n━".repeat(50));
  console.log("\n📋 Next Steps:\n");

  if (err) {
    console.log("1. Setup PostgreSQL database");
    console.log("2. Run: npm run init-db");
    console.log("3. Start server: npm start");
  } else {
    console.log(
      "1. Delete old folders (optional): " + foldersToDelete.join(", ")
    );
    console.log("2. Initialize database: npm run init-db");
    console.log("3. Start server: npm start");
    console.log("4. Test with Postman collection");
  }

  console.log("\n🎉 Setup complete! Your API is ready.\n");
});
