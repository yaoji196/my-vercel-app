const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

// MySQL 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'mydatabase.c5usi8ueqrw0.eu-north-1.rds.amazonaws.com',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'mydatabase',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'Yaojiye123',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// 创建 Sequelize 实例（用于 ORM）
let sequelize = null;

const initDatabase = async () => {
  try {
    // 使用 Sequelize 连接 MySQL
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.user,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: 'mysql',
        timezone: '+08:00',
        define: {
          timestamps: true,
          underscored: true,
          createdAt: 'created_at',
          updatedAt: 'updated_at',
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci'
        },
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        dialectOptions: {
          timezone: 'local',
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      }
    );

    await sequelize.authenticate();
    return sequelize;
  } catch (error) {
    throw error;
  }
};

const dbExports = {
  initDatabase,
  getSequelize: () => sequelize,
  config: dbConfig,
  getConnection: async () => {
    const connection = await mysql.createConnection({
      ...dbConfig,
      timezone: '+08:00'
    });
    return connection;
  }
};

module.exports = dbExports;
