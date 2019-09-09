const mc = require('minecraft-protocol')
const tokens = require('prismarine-tokens');
const fs = require('fs');
const TOML = require('@iarna/toml');

function checkFileExist(path, exit) {
    if (fs.existsSync(path))
        return (true);
    else
        if (exit) {
            console.error("The file " + path + " doesn't exist, can't continue. Please check the documentation for further details.");
            process.exit(1);
        }
        else
            return (false);
}

checkFileExist("config.toml", true);
const configFile = TOML.parse(fs.readFileSync('./config.toml'));

const reconnectInterval = 1000 * 60;

const options = {
    host: "play.minehut.gg",
    port: 25565,
    username: configFile["minecraft"].username,
    password: configFile["minecraft"].password,
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
        console.info('connected')
    });

    bot.on('end', function () {
        console.log('Connection lost');
        setTimeout(connect, reconnectInterval);
    });

    bot.on('chat', function (packet) {
        const j = JSON.parse(packet.message)
        const chat = parseChat(j, {})
        if (chat.includes("move to enable chat") || chat.includes("Your requested server is starting up") || chat.includes("Sending you to"))
            setTimeout(function () {
                bot.write('chat', { message: "/join " + configFile["minehut"].serverName });
            }, Math.floor(Math.random() * 20000));
    });

    (['spawn', 'respawn']).forEach(event => bot.on(event, () => {
        setTimeout(function () {
            bot.write('chat', { message: "/join " + configFile["minehut"].serverName });
        }, Math.floor(Math.random() * 20000));
    }));
}