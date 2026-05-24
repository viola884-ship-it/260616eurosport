import type { Bot } from 'grammy';
import type { BotContext, Env } from '../types';
import { OrderQueries } from '../db/queries';
import { extractLinks, extractSpecs, formatOrderSummary } from './helpers';

export function registerCustomerHandlers(bot: Bot<BotContext>, env: Env) {
  const queries = new OrderQueries(env.DB);

  bot.command('status', async (ctx) => {
    const customer = await queries.getCustomerByTelegramId(ctx.from!.id);
    if (!customer) {
      await ctx.reply('No orders found. Send me a product link to create an order.');
      return;
    }

    const orders = await queries.getOrdersByCustomer(customer.id);
    if (orders.length === 0) {
      await ctx.reply('No orders found. Send me a product link to create an order.');
      return;
    }

    const lines = orders.map(o => ` #${o.display_id} — ${o.status}`);
    await ctx.reply(`Your orders:\n${lines.join('\n')}`);
  });

  bot.hears(/https?:\/\/[^\s]+/, async (ctx) => {
    const text = ctx.message?.text ?? '';
    const links = extractLinks(text);
    const specs = extractSpecs(text, links);

    if (links.length === 0) {
      await ctx.reply('Send me a product link to create an order. Use /status to check your orders.');
      return;
    }

    const from = ctx.from!;
    const customer = await queries.findOrCreateCustomer(
      from.id,
      from.username ?? null,
      from.first_name ?? null,
    );

    const isDuplicate = await queries.checkDuplicate(customer.id, links);
    const order = await queries.createOrder(customer.id, specs, links, isDuplicate);

    const summary = formatOrderSummary(order, links, specs);

    await ctx.reply(summary);

    // Notify manager — no URLs in notification text to prevent feedback loops
    const managerId = Number(env.MANAGER_CHAT_ID);
    if (managerId) {
      const prefix = isDuplicate ? '\u{26A0}\uFE0F ' : '\uD83C\uDD95 ';
      const username = ctx.from?.username
        ? `@${ctx.from.username}`
        : `${ctx.from?.first_name ?? 'Unknown'}`;

      await ctx.api.sendMessage(
        managerId,
        `${prefix}New Order #${order.display_id}\nFrom: ${username}\nItems: ${links.length} link(s)\nSpecs: ${specs ?? '(none)'}\nTime: ${order.created_at}\n\nManage: /customer ${order.display_id}`,
      );
    }
  });

  bot.on('message:text', async (ctx) => {
    await ctx.reply('Send me a product link to create an order. Use /status to check your orders.');
  });
}