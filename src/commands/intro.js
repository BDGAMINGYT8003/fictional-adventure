import { commandData } from '../brain/command-schema.js';
import { randomColor } from '../lib/random.js';

export default {
  data: commandData({
    name: 'intro',
    description: 'Internal component handler for the mention introduction.',
  }),
  hidden: true,
  async execute(context, state) {
    const isFeatures = state.customId === 'intro:features';
    await context.responder.reply({
      embeds: [{
        title: isFeatures ? '🔍 ▸ Core Features' : '🛠️ ▸ Support & Usage',
        description: isFeatures
          ? '• Direct Discord HTTP API v10 and Gateway v10 integration\n• Modular provider fallback network\n• Searchable command directory\n• Native URL and attachment delivery'
          : '• Use `/help` to browse categories\n• Use `/invite` for the installation link\n• Use `/ping` for connection and host diagnostics\n• Server media commands require an age-restricted channel',
        color: randomColor(),
      }],
      flags: 64,
    });
  },
};
