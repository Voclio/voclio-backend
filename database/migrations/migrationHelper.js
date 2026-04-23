import sequelize from '../../src/config/database.orm.js';

/**
 * Execute raw SQL migration using Sequelize
 * @param {string} sql - SQL query to execute
 * @returns {Promise<void>}
 */
export async function executeMigration(sql) {
  try {
    await sequelize.query(sql);
  } catch (error) {
    console.error('Migration execution error:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeConnection() {
  await sequelize.close();
}

export default { executeMigration, closeConnection };
