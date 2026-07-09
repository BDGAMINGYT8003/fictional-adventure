const { Collection } = require('discord.js');

const command4k = require('./4k');
const anal = require('./anal');
const ass = require('./ass');
const blowjob = require('./blowjob');
const boobs = require('./boobs');
const breeding = require('./breeding');
const buttplug = require('./buttplug');
const cages = require('./cages');
const cum = require('./cum');
const ecchi = require('./ecchi');
const ero = require('./ero');
const feet = require('./feet');
const fuck = require('./fuck');
const gif = require('./gif');
const gonewild = require('./gonewild');
const help = require('./help');
const hentai = require('./hentai');
const invite = require('./invite');
const kitsune = require('./kitsune');
const legs = require('./legs');
const maid = require('./maid');
const midriff = require('./midriff');
const milf = require('./milf');
const neko = require('./neko');
const paizuri = require('./paizuri');
const petgirls = require('./petgirls');
const ping = require('./ping');
const pussy = require('./pussy');
const pussylick = require('./pussylick');
const selfie = require('./selfie');
const smothering = require('./smothering');
const socks = require('./socks');
const solo = require('./solo');
const tentacle = require('./tentacle');
const thigh = require('./thigh');
const threesome = require('./threesome');
const uniform = require('./uniform');
const waifu = require('./waifu');
const yuri = require('./yuri');

const COMMANDS = [
    command4k,
    anal,
    ass,
    blowjob,
    boobs,
    breeding,
    buttplug,
    cages,
    cum,
    ecchi,
    ero,
    feet,
    fuck,
    gif,
    gonewild,
    help,
    hentai,
    invite,
    kitsune,
    legs,
    maid,
    midriff,
    milf,
    neko,
    paizuri,
    petgirls,
    ping,
    pussy,
    pussylick,
    selfie,
    smothering,
    socks,
    solo,
    tentacle,
    thigh,
    threesome,
    uniform,
    waifu,
    yuri,
];

function loadCommands() {
    const commands = new Collection();

    for (const command of COMMANDS) {
        commands.set(command.data.name, command);
    }

    return commands;
}

function commandPayloads() {
    return COMMANDS.map((command) => command.data.toJSON());
}

module.exports = {
    COMMANDS,
    loadCommands,
    commandPayloads,
};
