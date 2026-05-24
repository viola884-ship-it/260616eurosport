import type { Bot } from 'grammy';
import type { BotContext, Env } from '../types';
import { OrderQueries } from '../db/queries';

export function registerManagerHandlers(bot: Bot<BotContext>, env: Env) {
  const queries = new OrderQueries(env.DB);
  const managerChatId = Number(env.MANAGER_CHAT_ID);

  // Guard: only process commands in the manager chat
  const isManager = (ctx: BotContext): boolean => {
    if (!managerChatId) return false;
    return ctx.chat?.id === managerChatId;
  };

  bot.command('ping', async (ctx) => {
    await ctx.reply(`pong (chat: ${ctx.chat?.id}, manager: ${managerChatId})`);
  });

  bot.command('update', async (ctx) => {
    if (!isManager(ctx)) {
      await ctx.reply('This command is only available in the manager chat.');
      return;
    }

    const args = ctx.match?.trim().split(/\s+/);
    if (!args || args.length < 2) {
      await ctx.reply('Usage: /update <order-id> <new-status>');
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
    if (!isManager(ctx)) {
      await ctx.reply('This command is only available in the manager chat.');
      return;
    }

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
      lines.push(` #${order.display_id} ${order.status} — ${items.length} item(s)`);
    }
    await ctx.reply(`Orders:\n${lines.join('\n')}`);
    if (orders.length > 0) {
      await ctx.reply('Use /customer <order-id> to view details.');
    }
  });

  bot.command('order', async (ctx) => {
    if (!isManager(ctx)) {
      await ctx.reply('This command is only available in the manager chat.');
      return;
    }

    const displayId = ctx.match?.trim();
    if (!displayId) {
      await ctx.reply('Usage: /order <order-id>');
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

  bot.command('customer', async (ctx) => {
    if (!isManager(ctx)) {
      await ctx.reply('This command is only available in the manager chat.');
      return;
    }

    const identifier = ctx.match?.trim();
    if (!identifier) {
      await ctx.reply('Usage: /customer <customer-id>');
      return;
    }

    const customerId = Number(identifier);
    const customer = !isNaN(customerId)
      ? await queries.getCustomerById(customerId)
      : await queries.getCustomerByTelegramId(Number(identifier));

    if (!customer) {
      await ctx.reply(`Customer #${identifier} not found.`);
      return;
    }

    const orders = await queries.getOrdersByCustomer(customer.id);
    if (orders.length === 0) {
      await ctx.reply(`Customer @${customer.username ?? customer.first_name ?? customer.id} has no orders.`);
      return;
    }

    const lines = orders.map(o => ` #${o.display_id} — ${o.status}`);
    await ctx.reply(
      `Orders for @${customer.username ?? customer.first_name ?? customer.id}:\n${lines.join('\n')}`,
    );
  });
}