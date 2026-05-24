import { Bot } from 'grammy';
import type { BotContext, Env } from './types';
import { registerCustomerHandlers } from './handlers/customer';
import { registerManagerHandlers } from './handlers/manager';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);

      if (url.pathname === '/webhook') {
        const raw = await request.text();
        const update = JSON.parse(raw);

        const bot = new Bot<BotContext>(env.BOT_TOKEN);
        bot.api.config.use((prev, method, payload) => {
          return prev(method, { ...payload, parse_mode: 'HTML' });
        });

        registerCustomerHandlers(bot, env);
        registerManagerHandlers(bot, env);

        try {
          await bot.handleUpdate(update);
        } catch {
          // handler errors caught — always return 200 to avoid Telegram retries
        }

        return new Response('OK', { status: 200 });
      }

      return new Response('Telegram Order Bot', { status: 200 });
    } catch (err) {
      return new Response(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
        { status: 500 },
      );
    }
  },
};