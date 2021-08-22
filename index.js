require('dotenv').config();
const fs = require('fs');
const { Client, Collection } = require('discord.js');
const { connect } = require('./db');
require('./ExtendedMessage');

const client = new Client({
  partials: ['USER', 'MESSAGE', 'REACTION']
});
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./events').filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  process.stdout.write(
    `${new Date().toISOString().replace('T', ' ')} - INFO: Loading ./commands/${file}... `,
  );
  try {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    process.stdout.write('OK!\n');
  } catch (e) {
    console.log(e.stack);
  }
}

for (const file of eventFiles) {
  process.stdout.write(
    `${new Date().toISOString().replace('T', ' ')} - INFO: Loading ./events/${file}... `,
  );
  try {
    const event = require(`./events/${file}`);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    process.stdout.write('OK!\n');
  } catch (e) {
    console.log(e.stack);
  }
}

(async () => {
  process.stdout.write(`${
    new Date()
      .toISOString()
      .replace('T', ' ')} - INFO: Connecting to database... `);
  try {
    await connect();
    process.stdout.write('OK!\n');
    return client.login();
  } catch (e) {
    console.log(e.stack);
  }
})();
