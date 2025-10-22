import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DB_CONNECTION_STRING,
};

export default Object.freeze(config);