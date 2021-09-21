
//Module Load
const Discord = require('discord.js');
const { Client, Intents, Collection } = require('discord.js');
const dotenv = require("dotenv");
const fs = require('fs');

dotenv.config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

const token = 'ODg5ODIzMDMyMTU0MTU3MDU2.YUm2Rg.bh1NMpoUWZ9Xoo1MrAO-UCDSk9Y';
const PREFIX ='%';
var servers = {};

const ytdl = require("ytdl-core");

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

client.on('message',message =>{

    let args = message.content.substring(PREFIX.length).split(" ");
    switch(args[0]){
        case 'play':
            
            function play(connection,message){
                var server = servers[message.guild.id];

                server.dispatcher = connection.playStream(ytdl(server.queue[0],{filter: 'audioonly'}));
                server.queue.shift();
                server.dispatcher.on("end",function(){
                    if(server.queue[0]){
                        play(connection,message);
                    }else {
                        connection.disconnect();
                    }
                });

            }

            if(!args[1]){
                message.channel.send("you need to provide a link");
                return;
            }
            if(!message.member.voiceChannel){
                message.channel.send("you must be in a channel to play the bot !");
                return;
            }

            if(!servers[message.guild.id]) servers[message.guild.id]={
                queue :[]
            }
            var server = servers[message.guild.id];

            server.queue.push(args[1]);

            if(!message.guild.voiceConnection) 
            message.member.voiceChannel.join().then(function(connection){
                play(connection,message);
            })

            break;
        case 'skip':
                var server = servers[message.guild.id];
                if(server.dispatcher) server.dispatcher.end();
                message.channel.send("song skipped")
        break;

        case 'stop':
                var server = servers[message.guild.id];
                if(message.guild.voiceConnection){
                    for(var i=server.queue.length -2;i>=0;i--){
                        server.queue.splice(i,1);
                    }
                    server.dispatcher.end();
                    message.channel.send("Ending the queue leaving the voice channel")
                    console.log('stopped the queue')
                }
                if(message.guild.connection) message.guild.voiceConnection.disconnect();
        
        break;
    }
})

//Client Setup
client.login(process.env.TOKEN);