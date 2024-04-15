import { GoogleLoginBody } from '@/interfaces/auth.interface';
import express from 'express';
import { google, Auth } from 'googleapis';
// Replace these with your client ID and client secret obtained from the Google Developer Console
const YOUR_CLIENT_ID = '590138639341-52k54qmlvdhbbr9vsfmm8q4hgu4maln5.apps.googleusercontent.com';
const YOUR_CLIENT_SECRET = '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';
const YOUR_REDIRECT_URL = 'http://localhost:3001/auth/google_call_back';

export const oauth2Client = new google.auth.OAuth2(
  YOUR_CLIENT_ID,
  YOUR_CLIENT_SECRET,
  YOUR_REDIRECT_URL
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
      console.log({
          userInfoResponse
      });
      return userInfoResponse;
    } catch (error) {
        console.error('Failed to fetch user info:', error);
        throw error;
    }
}
