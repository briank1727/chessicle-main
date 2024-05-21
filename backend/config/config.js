module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: "chessicle",
    host: process.env.DB_IPADDRESS,
    dialect: "mysql",
  },
  test: {
    username: "chessicle",
    password: "XilZjgaABTi66yQzQ29p",
    database: "chessicle",
    host: "127.0.0.1",
    dialect: "mysql",
  },
  production: {
    username: "chessicle",
    password: "XilZjgaABTi66yQzQ29p",
    database: "chessicle",
    host: "127.0.0.1",
    dialect: "mysql",
  },
};
