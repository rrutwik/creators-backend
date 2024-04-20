import { ConnectOptions, connect, set } from 'mongoose';
import { NODE_ENV, DB_URL, DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD } from '@config';

export const dbConnection = async () => {
  set('strictQuery', true);

  // Determine the connection URL based on the environment
  const url: string = NODE_ENV === 'production' ? DB_URL : `mongodb://${DB_HOST}:${DB_PORT}`;

  // Set options based on the environment
  const options: ConnectOptions = NODE_ENV === 'production' ? {
    dbName: DB_NAME,
    retryWrites: true,
    w: 'majority', // Recommended for Atlas to ensure write acknowledgment
  } : {
    dbName: DB_NAME,
    user: DB_USERNAME,
    pass: DB_PASSWORD,
    authMechanism: 'SCRAM-SHA-1', // Common for local development setups
    authSource: 'admin', // Typically 'admin' is used for local, but adjust if different
    autoIndex: true,
    autoCreate: true,
  };

  // Enable debug mode for non-production environments
  if (NODE_ENV !== 'production') {
    set('debug', true);
  }

  await connect(url, options);
};
