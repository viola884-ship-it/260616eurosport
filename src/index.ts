import { createBot, getWebhookHandler } from './bot';
import type { Env } from './types';
import { registerCustomerHandlers } from './handlers/customer';
import { registerManagerHandlers } from './handlers/manager';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);

      if (url.pathname === '/webhook') {
        const bot = createBot(env.BOT_TOKEN);
        bot.api.config.use((prev, method, payload) => {
          return prev(method, { ...payload, parse_mode: 'HTML' });
        });

        registerCustomerHandlers(bot, env);
        registerManagerHandlers(bot, env);

        const handler = getWebhookHandler(bot);
        return await handler(request);
      }

      return new Response('Telegram Order Bot', { status: 200 });
    } catch (err) {
      return new Response(`Error: ${err instanceof Error ? err.message : String(err)}\nStack: ${err instanceof Error ? err.stack : 'N/A'}`, { status: 500 });
    }
  },
};