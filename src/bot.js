// Module Load
const {
	REST
} = require('@discordjs/rest');
const { getVoiceConnection } = require('@discordjs/voice');
const {
	Routes
} = require('discord-api-types/v9');
const {
	Client,
	GatewayIntentBits,
	// Intents,
	Collection
} = require('discord.js');
const wait = require('util').promisify(setTimeout);
const dotenv = require("dotenv");
const fs = require('fs');
const logger = require('./commands/modules/logger.js')('bot.js');

dotenv.config();

// Variable Initialization
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences
		// Intents.FLAGS.GUILDS,
		// Intents.FLAGS.GUILD_MESSAGES,
		// Intents.FLAGS.GUILD_MEMBERS,
		// Intents.FLAGS.GUILD_PRESENCES,
		// Intents.FLAGS.GUILD_VOICE_STATES,
	]
});
client.commands = new Collection();
var commands = [];

// Build Mode Initialization
const build = process.env.BUILD;
const clientId = (build == "DEV") ? process.env.CLIENT_ID_DEV : (build == "PROD") ? process.env.CLIENT_ID_PROD : null;
const token = (build == "DEV") ? process.env.TOKEN_DEV : (build == "PROD") ? process.env.TOKEN_PROD : null;
if(clientId == null || token == null) throw new Error("INVALID BUILD MODE");

/* logger.info(`BUILD MODE: ${build}`);
logger.info(`CLIENT ID: ${clientId}`);
logger.info(`TOKEN: ${token.substring(0, 10)}...`);
 */

const rest = new REST({
	version: '9'
}).setToken(token);

// Command Handling
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
	client.commands.set(command.data.name, command);
}

// Event Handling
const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	} else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}

// Commands and Interactions
client.on('interactionCreate', async interaction => {

	//await interaction.deferReply();

	if (!interaction.isCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;
	try {
		await command.execute(interaction);
	} catch (error) {
		logger.error(error);
		try{
		await interaction.editReply({
			content: 'There was an error while executing this command!',
			ephemeral: true
		})}
		catch (err) {
			logger.error(err);
		}
	}
});

// Loading Slash Commands
(async () => {
	try {
		logger.info('Started refreshing application (/) commands.');

		// //Guild Command *Enable this for faster deployment
		// await rest.put(
		// 	Routes.applicationGuildCommands(clientId, guildId), {
		// 		body: commands
		// 	},
		// );

		// Global Command *Deployment on all server, this function is slow
		await rest.put(
			Routes.applicationCommands(clientId), {
			body: commands
		},
		);

		logger.info('Successfully reloaded application (/) commands.');
	} catch (error) {
		logger.error(error);
	}
})();

// Client Setup
client.login(token);

// Module export
// exports.Client = client;