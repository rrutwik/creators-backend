import { ConnectOptions, connect, set } from 'mongoose';
import { NODE_ENV, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD } from '@config';

export const dbConnection = async () => {
  set('strictQuery', true);
  const url: string = `mongodb://${DB_HOST}:${DB_PORT}`;
  const options: ConnectOptions = {
    dbName: DB_DATABASE,
    user: DB_USERNAME,
    pass: DB_PASSWORD,
    autoIndex: true,
    autoCreate: true
  };

  if (NODE_ENV !== 'production') {
    set('debug', true);
  }

  await connect(url, options);
}
