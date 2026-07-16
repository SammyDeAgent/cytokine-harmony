const logger = require('../commands/modules/logger.js')('ready.js');

module.exports = {
	name: 'clientReady',
	once: true,
	execute(client) {
		client.user.setActivity('Sea Waves', { type: 'LISTENING' });
		client.user.setUsername("Cytokine Harmony");
		logger.info(`Cytokine Harmony... ONLINE as ${client.user.tag}`);
	},
};