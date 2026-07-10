export async function registerCommands({ rest, clientId, guildId, mode, commands, logger }) {
  const payload = [...commands.values()]
    .filter((command) => !command.hidden)
    .map((command) => command.data);
  if (mode === 'global' || mode === 'both') {
    await rest.put(`/applications/${clientId}/commands`, { body: payload });
    logger.info('Refreshed global application commands.', { count: payload.length });
  }
  if (mode === 'guild' || mode === 'both') {
    const guildPayload = payload.map(({ integration_types: _integrationTypes, contexts: _contexts, ...command }) => command);
    await rest.put(`/applications/${clientId}/guilds/${guildId}/commands`, { body: guildPayload });
    logger.info('Refreshed guild application commands.', { count: payload.length, guildId });
  }
}
