import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '@/config';
import { GoogleLoginBody } from '@/interfaces/auth.interface';
import { logger } from '@/utils/logger';
import { google, Auth } from 'googleapis';

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
);

// Generate a url that asks permissions for the user's email and profile
export const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];
export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}


export async function getGoogleUserInfo(body: GoogleLoginBody): Promise<Auth.TokenPayload> {
    try {
      const ticket = await oauth2Client.verifyIdToken({
        idToken: body.credential,
      })
      const userInfoResponse = ticket.getPayload();
      return userInfoResponse;
    } catch (error) {
        console.error('Failed to fetch user info:', error);
        throw error;
    }
}

export async function getGoogleUserInfoFromCode(code: string, redirectUri: string): Promise<Auth.TokenPayload> {
    try {
      console.log(`Google code: ${code} | redirectUri: ${redirectUri}`);
      const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        redirectUri
      );
      const response = await oauth2Client.getToken(code);
      logger.info(`Google response: ${JSON.stringify(response)}`);
      const ticket = await oauth2Client.verifyIdToken({
        idToken: response.tokens.id_token,
      })
      logger.info(`Google ticket: ${JSON.stringify(ticket)}`);
      const userInfoResponse = ticket.getPayload();
      logger.info(`Google user info: ${JSON.stringify(userInfoResponse)}`);
      return userInfoResponse;
    } catch (error) {
        console.error('Failed to fetch user info:', error);
        throw error;
    }
}
