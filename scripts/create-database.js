const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'mydatabase.c5usi8ueqrw0.eu-north-1.rds.amazonaws.com',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'mydatabase',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'Yaojiye123'
};

async function createDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({ host: dbConfig.host, port: dbConfig.port, user: dbConfig.user, password: dbConfig.password });
    const [databases] = await connection.execute(`SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`, [dbConfig.database]);
    if (databases.length === 0) {
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    }
    await connection.end();
  } catch (error) {
    if (connection) await connection.end();
    process.exit(1);
  }
}

createDatabase();
