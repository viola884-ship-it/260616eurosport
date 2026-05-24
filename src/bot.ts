import { Bot, webhookCallback } from 'grammy';
import type { BotContext } from './types';

export function createBot(token: string): Bot<BotContext> {
  return new Bot<BotContext>(token);
}

export function getWebhookHandler(bot: Bot<BotContext>) {
  return webhookCallback(bot, 'cloudflare-mod');
}