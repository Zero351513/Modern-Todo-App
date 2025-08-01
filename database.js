const { Pool } = require('pg');
require('dotenv').config();

// DB接続設定
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// 接続テスト
pool.connect((err, client, release) => {
  if (err) {
    console.error('DB接続エラー:', err.stack);
  } else {
    console.log('DB接続成功');
    release();
  }
});

// TODO: コネクションプールの設定を調整
module.exports = pool;
