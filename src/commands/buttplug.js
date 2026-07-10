import { defineMediaCommand } from '../brain/media-command.js';

export default defineMediaCommand({
  name: 'buttplug',
  description: 'Delivers a random Buttplug image',
  title: 'NSFW Buttplug Image',
  sources: [
    { provider: 'abd', endpoint: 'https://api.n-sfw.com/nsfw/buttplug' },
  ],
});
