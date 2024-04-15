export interface Session {
    _id: string,
    user_id: string,
    user?: string,
    session_token: string
    expiry_time: Date
    refresh_token: string
    refresh_token_expiry_time: Date
};
