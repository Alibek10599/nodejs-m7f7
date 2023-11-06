require('dotenv').config({ path: `${ process.cwd() }/.env` });

module.exports = {
  development: {
    username: 'myuser',
    password: 'myuserpassword',
    database: 'mydatabase',
    host: '127.0.0.1',
    port: '3306',
    dialect: 'mysql',
  },
  production: {
    username: process.env.MYSQL_DB_USER,
    password: process.env.MYSQL_DB_PASSWORD,
    database: process.env.MYSQL_DB,
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    dialect: 'mysql',
  },
};
