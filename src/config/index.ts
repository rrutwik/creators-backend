import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN } = process.env;
export const { DB_HOST, DB_URL, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD } = process.env;
export const {RAZORPAY_KEY, RAZORPAY_SECRET} = process.env;
export const {GOOGLE_CLIENT_SECRET, GOOGLE_CLIENT_ID} = process.env;
