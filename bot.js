//Module Load
const {
	REST
} = require('@discordjs/rest');
const {
	Routes
} = require('discord-api-types/v9');
const {
	Client,
	Intents,
	Collection
} = require('discord.js');
const wait = require('util').promisify(setTimeout);
const dotenv = require("dotenv");
const fs = require('fs');

dotenv.config();

//Variable Initialization
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_PRESENCES,
		Intents.FLAGS.GUILD_VOICE_STATES,
	]
});
client.commands = new Collection();

const clientId = 	process.env.CLIENT_ID; //Discord Application Client ID

var commands = [];

const rest = new REST({
	version: '9'
}).setToken(process.env.TOKEN);

//Command Handling
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
	client.commands.set(command.data.name, command);
}

//Event Handling
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	} else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}

//Commands and Interactions
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({
			content: 'There was an error while executing this command!',
			ephemeral: true
		});
	}
});

//Loading Slash Commands
(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

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

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();

// Client Setup
client.login(process.env.TOKEN);

// Module export
// exports.Client = client;