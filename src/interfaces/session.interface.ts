export interface Session {
    _id: string,
    user_id: string,
    user?: string,
    session_token: string,
    refresh_token: string,
    expiresAt: Date,
    refreshExpiresAt: Date,
};
