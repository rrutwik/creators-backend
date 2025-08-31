import { Service } from "typedi";
import TelegramBot from "node-telegram-bot-api";
import { logger } from "@/utils/logger";
import { TELEGRAM_BOT_TOKEN } from "@/config";
import QRCode from "qrcode";
import { cache } from "@/cache";
import crypto from 'crypto';
import { Request, Response } from "express";

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

@Service()
export class TelegramService {
    private botUsername: string;

    constructor() {
        this.initBot();
    }

    private async initBot() {
        const botMe = await bot.getMe();
        this.botUsername = botMe.username;
        try {
            await bot.setWebHook(`https://backend-api.techkarmic.com/auth/telegram-webhook`);
            console.log(`Telegram webhook set at https://backend-api.techkarmic.com/auth/telegram-webhook`);
        } catch (error) {
            logger.error(`Error setting webhook: ${error}`);
        }
    }

    private getQRCodeCacheKey(phone_number: string) {
        return `hash:${phone_number}`;
    }

    public async generateMessageToBotQRCode(phone: string, expiresAt: number): Promise<{ qrCode: string, token: string }> {
        const token = crypto.randomBytes(10).toString('hex'); // 8 chars
        cache.set(this.getQRCodeCacheKey(token), JSON.stringify({
            phone,
            expiresAt,
            authenticated: false
        }), expiresAt);
        const startLink = `https://t.me/${this.botUsername}?start=${token}`;
        const qrCode = await QRCode.toDataURL(startLink);
        return { qrCode, token };
    }

    public getWebhookHandler() {
        return async (req: Request, res: Response) => {
            try {
                const update = req.body;

                if (update.message?.text?.startsWith("/start")) {
                    const chatId = update.message.chat.id;
                    const token = update.message.text.split(" ")[1];

                    const sessionRaw: string = await cache.get(this.getQRCodeCacheKey(token));
                    if (!sessionRaw) {
                        logger.error(`Session expired or invalid token: ${token}`);
                        await bot.sendMessage(chatId, "Session expired or invalid token");
                        return res.sendStatus(200);
                    }

                    const session = JSON.parse(sessionRaw as string);
                    await bot.sendMessage(chatId, `Press the button to share your OTP`, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "Share Login OTP", callback_data: `otp:${token}:${session.otp}` },
                                ],
                            ],
                        },
                    });
                }

                if (update.callback_query?.data?.startsWith("otp:")) {
                    const [prefix, token, otp] = update.callback_query.data.split(":");
                    const chatId = update.callback_query.message.chat.id;

                    const sessionRaw: string = await cache.get(this.getQRCodeCacheKey(token));
                    if (!sessionRaw) {
                        await bot.sendMessage(chatId, "Session expired or invalid OTP");
                        return res.sendStatus(200);
                    }

                    const session = JSON.parse(sessionRaw);
                    if (session.otp !== otp) {
                        await bot.sendMessage(chatId, "Invalid OTP");
                        return res.sendStatus(200);
                    }

                    session.authenticated = true;
                    await cache.set(this.getQRCodeCacheKey(token), JSON.stringify(session), 300);
                    await bot.sendMessage(chatId, "✅ Your phone number is authenticated!");
                }

                return res.sendStatus(200);
            } catch (error) {
                logger.error(`Error in webhook handler: ${error}`);
                return res.sendStatus(500);
            }
        };
    }
}
