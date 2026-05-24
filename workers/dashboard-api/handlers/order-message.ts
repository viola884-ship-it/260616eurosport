/**
 * Order Message Handler
 * POST /orders/:display_id/message
 */

import type { Env } from '../types';
import { jsonResponse } from './base';
import { loggingMiddleware } from '../middleware/logging';

export async function handleOrderMessage(request: Request, env: Env, displayId: string): Promise<Response> {
  const body = await request.json().catch(() => ({}));
  const { message } = body as { message?: string };

  if (!message) {
    return jsonResponse({ error: 'Message is required' }, 400);
  }

  await loggingMiddleware(request, env, { action: 'send_message', targetType: 'order', targetId: displayId, details: { messageLength: message.length } });

  const order = await getOrderByDisplayId(env.DB, displayId);
  if (!order) {
    return jsonResponse({ error: 'Order not found' }, 404);
  }

  const telegramId = (order as { telegram_id?: number }).telegram_id;
  if (!telegramId) {
    return jsonResponse({ error: 'Customer has no Telegram ID' }, 400);
  }

  const messageId = await sendTelegramMessage(env, telegramId, message);

  return jsonResponse({ success: true, message_id: messageId });
}

async function getOrderByDisplayId(db: D1Database, displayId: string): Promise<unknown | null> {
  return db.prepare(
    `SELECT o.*, c.telegram_id FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.display_id = ?`
  ).bind(displayId).first();
}

async function sendTelegramMessage(env: Env, telegramId: number, text: string): Promise<number> {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn('Telegram bot token not configured');
    return 0;
  }

  const telegramApi = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(telegramApi, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramId,
      text,
    }),
  });

  const result = await response.json() as { message_id?: number };
  return result.message_id || 0;
}