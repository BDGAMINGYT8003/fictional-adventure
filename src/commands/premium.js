import { commandData, userOption } from '../brain/command-schema.js';
import {
  FREE_DAILY_LIMIT,
  FREE_MINUTE_LIMIT,
  PREMIUM_DAILY_LIMIT,
} from '../brain/rate-limit/limits.js';
import { actionRow, button } from '../discord/components.js';
import { ButtonStyle } from '../discord/constants.js';
import { requester, resolvedUser } from '../discord/interaction-data.js';
import { avatarUrl, displayName } from '../lib/discord-user.js';
import { randomColor } from '../lib/random.js';

const CHECK = '<:CY:1071484103762915348>';
const SUBSCRIBE_URL = 'https://chatgpt.com';

function number(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function meter(snapshot) {
  const minute = snapshot.minuteLimit === null
    ? 'Unlimited per min'
    : `${number(snapshot.minuteRemaining)} / ${number(snapshot.minuteLimit)} per min`;
  return [
    '**Limits Meter**',
    `Rate Limit: ${minute}`,
    `Daily Cap: ${number(snapshot.dailyRemaining)} / ${number(snapshot.dailyLimit)}`,
  ].join('\n');
}

function freeDescription(target, ownProfile, snapshot) {
  const subject = ownProfile ? 'You are' : `**${displayName(target)}** is`;
  const possessive = ownProfile ? 'you currently have' : 'they currently have';
  const missing = ownProfile ? "you're currently missing" : "they're currently missing";
  return [
    `${subject} currently **NOT** a Premium User.`,
    '',
    `**Perks ${possessive}:**`,
    `${CHECK} Access to 36 NSFW commands`,
    `${CHECK} Cooldown limits: ${number(FREE_MINUTE_LIMIT)}/min & ${number(FREE_DAILY_LIMIT)}/day`,
    '',
    `**Perks ${missing}:**`,
    `${CHECK} Unlimited requests per minute`,
    `${CHECK} ${number(PREMIUM_DAILY_LIMIT)} requests per day hard ceiling`,
    `${CHECK} Instant image pre-fetching & optimization`,
    `${CHECK} Premium support server access`,
    '',
    meter(snapshot),
  ].join('\n');
}

function premiumDescription(target, ownProfile, snapshot) {
  const name = displayName(target);
  const status = ownProfile
    ? 'You are currently a **Premium User**.'
    : `**${name}** is currently a **Premium User**.`;
  const thanks = ownProfile
    ? `Thank you, **${name}**, for supporting the bot! Your membership keeps the media flowing.`
    : `Thanks to **${name}** for supporting the bot and helping keep the media flowing.`;
  return [
    status,
    '',
    thanks,
    '',
    '**Premium perks:**',
    `${CHECK} Access to 36 NSFW commands`,
    `${CHECK} Unlimited requests per minute`,
    `${CHECK} ${number(PREMIUM_DAILY_LIMIT)} requests per day hard ceiling`,
    `${CHECK} Instant image pre-fetching & optimization`,
    `${CHECK} Premium support server access`,
    '',
    meter(snapshot),
  ].join('\n');
}

export default {
  data: commandData({
    name: 'premium',
    description: 'View Premium status, benefits, and remaining request quotas.',
    options: [userOption({
      name: 'user',
      description: 'User whose plan and remaining quotas you want to view.',
    })],
  }),

  async execute(context) {
    await context.responder.defer();
    const author = requester(context.interaction);
    const target = resolvedUser(context.interaction, 'user');
    const ownProfile = author?.id === target?.id;
    const snapshot = context.rateLimiter.snapshot(target.id);
    const premium = snapshot.premium;
    await context.responder.editOriginal({
      embeds: [{
        title: premium ? 'Premium Plan ($1)' : 'Free Plan ($0)',
        description: premium
          ? premiumDescription(target, ownProfile, snapshot)
          : freeDescription(target, ownProfile, snapshot),
        color: randomColor(),
        footer: { text: displayName(target), icon_url: avatarUrl(target) },
        timestamp: new Date().toISOString(),
      }],
      components: [actionRow(button({
        label: 'Subscribe',
        style: ButtonStyle.LINK,
        url: SUBSCRIBE_URL,
      }))],
      attachments: [],
    });
  },
};

export { meter as premiumLimitsMeter, SUBSCRIBE_URL };
