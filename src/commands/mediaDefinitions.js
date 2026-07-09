'use strict';
const nsfw = p => `https://api.n-sfw.com/nsfw/${p}`;
const purr = p => `https://purrbot.site/api/img/nsfw/${p}/gif`;
const nekos = tag => `https://api.nekosapi.com/v4/images/random?limit=1&rating=explicit,suggestive&tags=${tag}`;
const d = (name, description, title, anime, real = [], hasStyle = false) => ({ name, description, title, anime, real, hasStyle });
module.exports = [
 d('4k','Delivers a random NSFW 4k Image/GIF','🔞 ▸ NSFW 4k Image',[],[{id:'nekobot',type:'4k'}]),
 d('anal','Delivers a random NSFW anal Image/GIF','🔞 ▸ NSFW Anal Image',[{id:'purrbot',endpoint:purr('anal')},{id:'abd',endpoint:nsfw('anal')},{id:'nekobot',type:'hentai_anal'},{id:'nekosv4',endpoint:nekos('anal')}],[{id:'nekobot',type:'anal'}],true),
 d('ass','Delivers a random NSFW ass Image/GIF','🔞 ▸ NSFW Ass Image',[{id:'abd',endpoint:nsfw('ass')},{id:'waifuim',tag:'ass'},{id:'nekobot',type:'hass'}],[{id:'obutts'},{id:'nekobot',type:'ass'}],true),
 d('blowjob','Delivers a random NSFW blowjob Image/GIF','🔞 ▸ NSFW Blowjob Image',[{id:'purrbot',endpoint:purr('blowjob')},{id:'waifupics',endpoint:'https://api.waifu.pics/nsfw/blowjob'},{id:'abd',endpoint:nsfw('blowjob')},{id:'waifuim',tag:'oral'}],[{id:'nekobot',type:'blowjob'}],true),
 d('boobs','Delivers a random NSFW boobs Image/GIF','🔞 ▸ NSFW Boobs Image',[{id:'waifuim',tag:'oppai'},{id:'nekobot',type:'hboobs'}],[{id:'oboobs'},{id:'nekobot',type:'boobs'}],true),
 d('breeding','Delivers a random NSFW breeding Image/GIF','🔞 ▸ NSFW Breeding Image',[{id:'abd',endpoint:nsfw('breeding')}]),
 d('buttplug','Delivers a random NSFW buttplug Image/GIF','🔞 ▸ NSFW Buttplug Image',[{id:'abd',endpoint:nsfw('buttplug')}]),
 d('cages','Delivers a random NSFW cages Image/GIF','🔞 ▸ NSFW Cages Image',[{id:'abd',endpoint:nsfw('cages')}]),
 d('cum','Delivers a random NSFW cum GIF','🔞 ▸ NSFW Cum Image',[{id:'purrbot',endpoint:purr('cum')}]),
 d('ecchi','Delivers a random NSFW ecchi Image/GIF','🔞 ▸ NSFW Ecchi Image',[{id:'abd',endpoint:nsfw('ecchi')},{id:'waifuim',tag:'ecchi'}]),
 d('ero','Delivers a random NSFW ero Image','🔞 ▸ NSFW Ero Image',[{id:'waifuim',tag:'ero'}]),
 d('feet','Delivers a random NSFW feet Image/GIF','🔞 ▸ NSFW Feet Image',[{id:'abd',endpoint:nsfw('feet')},{id:'nekobot',type:'feet'}]),
 d('fuck','Delivers a random NSFW fuck GIF','🔞 ▸ NSFW Fuck Image',[{id:'purrbot',endpoint:purr('fuck')}]),
 d('gonewild','Delivers a random NSFW gonewild Image/GIF','🔞 ▸ NSFW Gonewild Image',[],[{id:'nekobot',type:'gonewild'}]),
 d('hentai','Delivers a random NSFW hentai Image/GIF','🔞 ▸ NSFW Hentai Image',[{id:'waifuim',tag:'hentai'},{id:'nekobot',type:'hentai'}]),
 d('kitsune','Delivers a random NSFW kitsune Image/GIF','🔞 ▸ NSFW Kitsune Image',[{id:'nekobot',type:'hkitsune'}]),
 d('legs','Delivers a random NSFW legs Image/GIF','🔞 ▸ NSFW Legs Image',[{id:'abd',endpoint:nsfw('legs')}]),
 d('maid','Delivers a random NSFW maid Image','🔞 ▸ NSFW Maid Image',[{id:'waifuim',tag:'maid'},{id:'nekosv4',endpoint:nekos('maid')}]),
 d('midriff','Delivers a random NSFW midriff Image/GIF','🔞 ▸ NSFW Midriff Image',[{id:'nekobot',type:'hmidriff'}]),
 d('milf','Delivers a random NSFW milf Image/GIF','🔞 ▸ NSFW Milf Image',[{id:'abd',endpoint:nsfw('milf')},{id:'waifuim',tag:'milf'}]),
 d('neko','Delivers a random NSFW neko Image/GIF','🔞 ▸ NSFW Neko Image',[{id:'purrbot',endpoint:purr('neko')},{id:'purrbot',endpoint:'https://purrbot.site/api/img/nsfw/neko/img'},{id:'waifupics',endpoint:'https://api.waifu.pics/nsfw/neko'},{id:'abd',endpoint:nsfw('neko')},{id:'nekobot',type:'lewdneko'},{id:'nekosv4',endpoint:nekos('catgirl')}]),
 d('paizuri','Delivers a random NSFW paizuri Image/GIF','🔞 ▸ NSFW Paizuri Image',[{id:'abd',endpoint:nsfw('paizuri')},{id:'waifuim',tag:'paizuri'},{id:'nekobot',type:'paizuri'}]),
 d('petgirls','Delivers a random NSFW petgirls Image/GIF','🔞 ▸ NSFW Petgirls Image',[{id:'abd',endpoint:nsfw('petgirls')}]),
 d('pussy','Delivers a random NSFW pussy Image/GIF','🔞 ▸ NSFW Pussy Image',[{id:'nekobot',type:'pussy'},{id:'nekosv4',endpoint:nekos('pussy')}]),
 d('pussylick','Delivers a random NSFW pussylick GIF','🔞 ▸ NSFW Pussylick Image',[{id:'purrbot',endpoint:purr('pussylick')}]),
 d('selfie','Delivers a random NSFW selfie Image/GIF','🔞 ▸ NSFW Selfie Image',[{id:'abd',endpoint:nsfw('selfie')},{id:'waifuim',tag:'selfies'}]),
 d('smothering','Delivers a random NSFW smothering Image/GIF','🔞 ▸ NSFW Smothering Image',[{id:'abd',endpoint:nsfw('smothering')}]),
 d('socks','Delivers a random NSFW socks Image/GIF','🔞 ▸ NSFW Socks Image',[{id:'abd',endpoint:nsfw('socks')}]),
 d('solo','Delivers a random NSFW solo GIF','🔞 ▸ NSFW Solo Image',[{id:'purrbot',endpoint:purr('solo')},{id:'purrbot',endpoint:purr('solo_male')},{id:'nekosv4',endpoint:nekos('masturbating')}]),
 d('tentacle','Delivers a random NSFW tentacle Image/GIF','🔞 ▸ NSFW Tentacle Image',[{id:'nekobot',type:'tentacle'}]),
 d('thigh','Delivers a random NSFW thigh Image/GIF','🔞 ▸ NSFW Thigh Image',[{id:'nekobot',type:'hthigh'}],[{id:'nekobot',type:'thigh'}],true),
 d('uniform','Delivers a random Uniform image','🔞 ▸ NSFW Uniform Image',[{id:'waifuim',tag:'uniform'}]),
 d('waifu','Delivers a random Waifu image','🔞 ▸ NSFW Waifu Image',[{id:'waifupics',endpoint:'https://api.waifu.pics/nsfw/waifu'},{id:'waifuim',tag:'waifu'}]),
 d('yuri','Delivers a random NSFW yuri Image/GIF','🔞 ▸ NSFW Yuri Image',[{id:'purrbot',endpoint:purr('yuri')},{id:'abd',endpoint:nsfw('yuri')},{id:'nekobot',type:'hyuri'},{id:'nekosv4',endpoint:nekos('yuri')}])
];
