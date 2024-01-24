module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		client.user.setActivity('Sea Waves', { type: 'LISTENING' });
		client.user.setUsername("Cytokine Harmony");
		console.log(`Cytokine Harmony... ONLINE as ${client.user.tag}`);
	},
};