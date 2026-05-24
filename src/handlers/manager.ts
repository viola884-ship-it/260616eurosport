import type { Bot } from 'grammy';
import type { BotContext, Env } from '../types';
import { OrderQueries } from '../db/queries';

export function registerManagerHandlers(bot: Bot<BotContext>, env: Env) {
  const queries = new OrderQueries(env.DB);

  bot.command('status', async (ctx) => {
    const chatId = ctx.chat!.id;
    if (chatId !== Number(env.MANAGER_CHAT_ID)) return;

    const args = ctx.match?.trim().split(/\s+/);
    if (!args || args.length < 2) {
      await ctx.reply('Usage: /status <order-id> <new-status>');
      return;
    }

    const [displayId, newStatus] = args;
    const validStatuses = ['new', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];

    if (!validStatuses.includes(newStatus!)) {
      await ctx.reply(`Invalid status. Valid: ${validStatuses.join(', ')}`);
      return;
    }

    const order = await queries.getOrderByDisplayId(displayId!);
    if (!order) {
      await ctx.reply(`Order #${displayId} not found.`);
      return;
    }

    const allowedNext: Record<string, string[]> = {
      new: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    const nextAllowed = allowedNext[order.status];
    if (!nextAllowed || !nextAllowed.includes(newStatus!)) {
      await ctx.reply(`Cannot change from "${order.status}" to "${newStatus}". Allowed: ${nextAllowed?.join(', ') ?? 'none'}`);
      return;
    }

    const updated = await queries.updateOrderStatus(order.id, newStatus as any, 'manager');
    await ctx.reply(`Order #${displayId} updated to ${updated!.status}. Customer notified.`);

    // Notify customer
    const customer = await queries.getCustomerById(order.customer_id);
    if (customer) {
      const statusIcon: Record<string, string> = {
        confirmed: '\uD83D\uDCE6',
        processing: '\uD83D\uDD04',
        shipped: '\uD83D\uDE9A',
        completed: '\u2705',
        cancelled: '\u274C',
      };
      const icon = statusIcon[newStatus!] ?? '';
      const reason = newStatus === 'cancelled' ? ' Reason: cancelled by manager.' : '';
      await ctx.api.sendMessage(
        customer.telegram_id,
        `${icon} Order #${displayId} is now: ${newStatus}${reason}`,
      );
    }
  });

  bot.command('list', async (ctx) => {
    const chatId = ctx.chat!.id;
    if (chatId !== Number(env.MANAGER_CHAT_ID)) return;

    const statusFilter = ctx.match?.trim() || undefined;
    const orders = statusFilter
      ? await queries.getOrders(statusFilter as any)
      : await queries.getOrders();

    if (orders.length === 0) {
      await ctx.reply('No orders found.');
      return;
    }

    const lines: string[] = [];
    for (const order of orders) {
      const items = await queries.getOrderItems(order.id);
      const firstItem = items[0];
      const linkSummary = firstItem
        ? ` ${firstItem.link.substring(0, 40)}${items.length > 1 ? ` (+${items.length - 1} more)` : ''}`
        : '';
      lines.push(` #${order.display_id} ${order.status} —${linkSummary}`);
    }
    await ctx.reply(`Orders:\n${lines.join('\n')}`);
  });

  bot.command('customer', async (ctx) => {
    const chatId = ctx.chat!.id;
    if (chatId !== Number(env.MANAGER_CHAT_ID)) return;

    const displayId = ctx.match?.trim();
    if (!displayId) {
      await ctx.reply('Usage: /customer <order-id>');
      return;
    }

    const order = await queries.getOrderByDisplayId(displayId);
    if (!order) {
      await ctx.reply(`Order #${displayId} not found.`);
      return;
    }

    const customer = await queries.getCustomerById(order.customer_id);
    const items = await queries.getOrderItems(order.id);
    const username = customer?.username
      ? `@${customer.username}`
      : customer?.first_name ?? 'Unknown';
    const itemsText = items.map(i => i.link).join(', ');

    await ctx.reply(
      `Order #${displayId} by ${username}:\nItems: ${itemsText}\nSpecs: ${order.specs ?? '(none)'}\nStatus: ${order.status}`,
    );
  });
}