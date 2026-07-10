const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { fetchABD, fetchNekoBot } = require('../utils/api');
const { logInfo } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('feet')
        .setDescription('Delivers a random NSFW feet Image/GIF')
        .setIntegrationTypes(0, 1)
        .setContexts(0, 1, 2)
        .setNSFW(true)
        .addStringOption(option =>
            option.setName('style')
                .setDescription('Select the style (Anime or Real)')
                .setRequired(false)
                .addChoices(
                    { name: 'Anime', value: 'Anime' },
                    { name: 'Real', value: 'Real' }
                )
        ),
    async execute(interaction, isButton = false, savedStyle = null) {
        if (!isButton) {
            await interaction.deferReply();
        } else {
            await interaction.deferUpdate();
        }

        const style = savedStyle || (interaction.options ? interaction.options.getString('style') : null);
        const animeSources = [ { id: 'abd', endpoint: 'https://api.n-sfw.com/nsfw/feet' } ];
        const realSources = [ { id: 'nekobot', type: 'feet' } ];

        let pool = [];
        if (style === 'Anime') {
            pool = animeSources;
        } else if (style === 'Real') {
            pool = realSources;
        } else {
            pool = [...animeSources, ...realSources];
        }

        if (pool.length === 0) pool = [...animeSources, ...realSources];

        const activePool = process.env.WAIFU_PICS === 'false' ? pool.filter(src => src.id !== 'waifupics') : pool;
        const sourceObj = activePool.length > 0 ? activePool[Math.floor(Math.random() * activePool.length)] : pool[0];

        let imageData = null;

        if (sourceObj.id === 'purrbot') {
            logInfo(`[/feet] Selected API Source: Purrbot (${sourceObj.endpoint})`);
            imageData = await fetchPurrbot(sourceObj.endpoint);
        } else if (sourceObj.id === 'abd') {
            logInfo(`[/feet] Selected API Source: ABD (${sourceObj.endpoint})`);
            imageData = await fetchABD(sourceObj.endpoint);
        } else if (sourceObj.id === 'waifupics') {
            if (process.env.WAIFU_PICS !== 'false') {
                logInfo(`[/feet] Selected API Source: Waifu.pics (${sourceObj.endpoint})`);
                imageData = await fetchWaifu(sourceObj.endpoint);
            }
        } else if (sourceObj.id === 'waifuim') {
            logInfo(`[/feet] Selected API Source: Waifu.im (tag: ${sourceObj.tag})`);
            imageData = await fetchWaifuIm(sourceObj.tag, true);
        } else if (sourceObj.id === 'oboobs') {
            logInfo(`[/feet] Selected API Source: Oboobs`);
            imageData = await fetchBoobs(null);
        } else if (sourceObj.id === 'obutts') {
            logInfo(`[/feet] Selected API Source: Obutts`);
            imageData = await fetchAss(null);
        } else if (sourceObj.id === 'nekobot') {
            logInfo(`[/feet] Selected API Source: NekoBot (type: ${sourceObj.type})`);
            imageData = await fetchNekoBot(sourceObj.type);
        }

        if (!imageData || imageData.error) {
            let errorMsg = 'Failed to fetch image.';
            if (imageData && imageData.error === 'TIMEOUT') {
                errorMsg = 'API Timeout: The request took longer than 15 seconds to fulfill. Please try again later.';
            }
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ ▸ Error')
                .setDescription(errorMsg)
                .setColor('Red');

            return await interaction.editReply({ embeds: [errorEmbed], components: [] });
        }

        const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

        const embed = new EmbedBuilder()
            .setTitle(`🔞 ▸ NSFW Feet Image`)
            .setImage(imageData.url)
            .setColor(`#${randomColor}`)
            .setFooter({
                text: `${interaction.user.username} | Today at ${new Date().toLocaleTimeString()}`,
                iconURL: interaction.user.displayAvatarURL()
            });

        const customIdBase = style ? `refresh_feet_${style}` : `refresh_feet`;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(customIdBase)
                    .setLabel('🔄 ▸ Refresh')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setLabel('📎 ▸ Link')
                    .setURL(imageData.url)
                    .setStyle(ButtonStyle.Link)
            );

        const attachment = imageData.buffer ? new AttachmentBuilder(imageData.buffer, { name: 'nsfw.gif' }) : null;
        if (attachment) embed.setImage('attachment://nsfw.gif');
        await interaction.editReply({ embeds: [embed], components: [row], files: attachment ? [attachment] : [] });
    },
};
