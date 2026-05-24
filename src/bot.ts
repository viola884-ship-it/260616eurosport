import { Bot } from 'grammy';
import type { BotContext } from './types';

export function createBot(token: string): Bot<BotContext> {
  return new Bot<BotContext>(token);
}