const mc = require('minecraft-protocol')
const tokens = require('prismarine-tokens');
const dns = require('dns');
require('better-logging')(console, {
    format: ctx => `${ctx.date} ${ctx.time24} ${ctx.type} ${ctx.msg}`
});

const reconnectInterval = 1000 * 60;

dns.resolve4('play.minehut.gg', function (err, addresses) {
    
    const options = {
        host: addresses[0],
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
        tokensLocation: './bot_tokens.json'
    };

    function connect() {
        tokens.use(options, function (_err, _opts) {
            if (_err) throw _err;
            const bot = mc.createClient(_opts);
            main(bot);
        });
    }

    connect();


    function parseChat(chatObj, parentState) {

        if (typeof chatObj === 'string') {
            return chatObj
        } else {
            let chat = ''

            if ('text' in chatObj) {
                chat += chatObj.text
            }
            if (chatObj.extra) {
                chatObj.extra.forEach(function (item) {
                    chat += parseChat(item, parentState)
                })
            }
            return chat
        }
    }

    function main(bot) {
        bot.on('connect', function () {
            console.info('Connected to the minehut main server.');
        });

        bot.on('end', function () {
            console.warn('Connection lost with the minehut server, reconnecting...');
            setTimeout(connect, reconnectInterval);
        });

        bot.on('chat', function (packet) {
            const j = JSON.parse(packet.message);
            const chat = parseChat(j, {});
            console.log(chat);
            if (chat.includes("move to enable chat") || chat.includes("Your requested server is starting up") || chat.includes("Sending you to"))
                setTimeout(function () {
                    bot.write('chat', { message: "/join " + process.env.SERVER_NAME });
                }, Math.floor(Math.random() * 20000));
        });

        (['spawn', 'respawn']).forEach(event => bot.on(event, () => {
            setTimeout(function () {
                bot.write('chat', { message: "/join " + process.env.SERVER_NAME });
            }, Math.floor(Math.random() * 20000));
        }));
    }
});