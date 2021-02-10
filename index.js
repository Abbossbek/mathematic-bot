require('console-stamp')(console, { pattern: 'yyyy-mm-dd HH:MM:ss' });

const { onError, sendMultipleMessages } = require('./util');
const { typesetAndScale } = require('./typeset');

const Telegraf = require('telegraf');
const bot = new Telegraf('1628549057:AAFs8x9kw83XrXBFo7yWXoD25Q4hC78PTtA');

/**
 * Config
 * BOT_TOKEN will be taken from environment variables
 */
const mathMarker = "/math";
const inlineMathMarker = "/im";
const welcomeMessages = [
    'Assalomu alaykum',
    'Latex da yozilgan formulani `/math` buyrug‘idan so‘ng yozib menga yuboring! Misol uchun: /math \\nabla w_{pq}=-\\eta\\frac{\\partial E}{\\partial w_{pq}}.'
];
const helpMessages = [
    'Shu ko‘rinishda yozing:\n```\n/math \\nabla w_{pq}=-\\eta\\frac{\\partial E}{\\partial w_{pq}}\n```',
    'Yaratuvchi: @Programmer1718'
];


if (process.env.MATOMO_URL) {
    const usage = require('./usage');
    bot.use(usage);
    helpMessages.push('');}

/**
 * Main Handler Function: Bot hears text starting with mathMarker --> trim message, create png, respond
 */
bot.hears(text => text.startsWith(mathMarker), async function(ctx) {
    try {
        const markerLength = ctx.message.text[mathMarker.length] === '*' ? mathMarker.length + 1 : mathMarker.length; // handle *
        const tex = ctx.message.text.substr(markerLength).trim();
        if (!tex) return;
        const png = await typesetAndScale(tex);
        await ctx.replyWithPhoto({ source: png });
    } catch (errors) {
        // one error at a time
        if (Array.isArray(errors)) {
            return await ctx.reply(errors[0]).catch(onError);
        }
        onError(errors);
    }
});

/**
 * Inline Math Handler Function: Bot hears text starting with inlineMathMarker --> find math, create pngs, respond
 */
bot.hears(text => text.startsWith(inlineMathMarker), async function(ctx) {
    for (let element of ctx.message.entities) {
        try {
            if (element.type === 'code') {
                const tex = ctx.message.text.substring(element.offset, element.offset + element.length);
                const png = await typesetAndScale(tex);
                await ctx.replyWithPhoto({ source: png });
            }
        } catch (errors) {
            // one error at a time
            if (Array.isArray(errors)) {
                await ctx.reply(errors[0]).catch(onError);
            }
            onError(errors);
        }
    }
});

/**
 * Bot Start & Help --> Send out Messages
 */
bot.start((ctx) => {
    return sendMultipleMessages(ctx, welcomeMessages);
});
bot.help((ctx) => {
    return sendMultipleMessages(ctx, helpMessages);
});

// required for group chat
bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username
});

bot.startPolling();
bot.launch();
console.log('Bot started');
