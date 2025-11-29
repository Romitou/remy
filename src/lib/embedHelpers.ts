/**
 * Helper functions for creating consistent and beautiful embeds
 */

import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../constants';

export interface ErrorEmbedOptions {
  title: string;
  description: string;
  thumbnailUrl?: string;
  footerText?: string;
}

export interface SuccessEmbedOptions {
  title: string;
  description: string;
  thumbnailUrl?: string;
  footerText?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

export interface InfoEmbedOptions {
  title: string;
  description: string;
  thumbnailUrl?: string;
  footerText?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

/**
 * Create a standardized error embed
 */
export function createErrorEmbed(options: ErrorEmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setColor(COLORS.ERROR)
    .setTimestamp();

  if (options.thumbnailUrl) {
    embed.setThumbnail(options.thumbnailUrl);
  } else {
    embed.setThumbnail('https://emojicdn.elk.sh/❌?style=google');
  }

  if (options.footerText) {
    embed.setFooter({
      text: options.footerText,
      iconURL: 'https://emojicdn.elk.sh/⚠️?style=google',
    });
  }

  return embed;
}

/**
 * Create a standardized success embed
 */
export function createSuccessEmbed(options: SuccessEmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setColor(COLORS.SUCCESS)
    .setTimestamp();

  if (options.thumbnailUrl) {
    embed.setThumbnail(options.thumbnailUrl);
  } else {
    embed.setThumbnail('https://emojicdn.elk.sh/✅?style=google');
  }

  if (options.fields) {
    embed.addFields(options.fields);
  }

  if (options.footerText) {
    embed.setFooter({
      text: options.footerText,
      iconURL: 'https://emojicdn.elk.sh/✨?style=google',
    });
  }

  return embed;
}

/**
 * Create a standardized info embed
 */
export function createInfoEmbed(options: InfoEmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setColor(COLORS.INFO)
    .setTimestamp();

  if (options.thumbnailUrl) {
    embed.setThumbnail(options.thumbnailUrl);
  }

  if (options.fields) {
    embed.addFields(options.fields);
  }

  if (options.footerText) {
    embed.setFooter({
      text: options.footerText,
      iconURL: 'https://emojicdn.elk.sh/ℹ️?style=google',
    });
  }

  return embed;
}

/**
 * Create a standardized warning embed
 */
export function createWarningEmbed(options: InfoEmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(options.title)
    .setDescription(options.description)
    .setColor(COLORS.WARNING)
    .setTimestamp();

  if (options.thumbnailUrl) {
    embed.setThumbnail(options.thumbnailUrl);
  } else {
    embed.setThumbnail('https://emojicdn.elk.sh/⚠️?style=google');
  }

  if (options.fields) {
    embed.addFields(options.fields);
  }

  if (options.footerText) {
    embed.setFooter({
      text: options.footerText,
      iconURL: 'https://emojicdn.elk.sh/⚠️?style=google',
    });
  }

  return embed;
}

/**
 * Format a field value in a code block for better readability
 */
export function formatFieldValue(value: string | number): string {
  return `\`\`\`${value}\`\`\``;
}

/**
 * Create a progress bar for visual feedback
 */
export function createProgressBar(current: number, total: number, length: number = 10): string {
  const percentage = Math.min(Math.max(current / total, 0), 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${Math.round(percentage * 100)}%`;
}

