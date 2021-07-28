require("dotenv").config();
const fs = require("fs");
const globalPrefix = process.env.PREFIX;
const Discord = require("discord.js");
const { mongoose } = require("./db.js");
const ReactionListener = require("./models/reaction_listener");
const { parseCmd } = require("./functions.js");
const client = new Discord.Client({
  //partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});
client.commands = new Discord.Collection();
const db = require("./db.js");

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  process.stdout.write(
    `${new Date().toISOString().replace("T", " ")} - INFO:\tLoading ${file}...`
  );
  try {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    process.stdout.write(" OK!\n");
  } catch (e) {
    process.stdout.write(`\nError: ${e.message}\nStack: ${e.stack}\n`);
  }
}

client.login();

client.once("ready", async () => {
  console.log(
    `${new Date().toISOString().replace("T", " ")} - INFO:\tConnected as "${
      client.user.tag
    }"`
  );
  const dbConnection = mongoose();
  let allMessages = [];
  try {
    await dbConnection;
    process.stdout.write(
      `${new Date()
        .toISOString()
        .replace("T", " ")} - INFO:\tFetching messages from DB...`
    );
    const messageList = await ReactionListener.find({
      is_ongoing: true,
    });
    process.stdout.write(" OK!\n");
    allMessages = [...messageList];
  } catch (e) {
    process.stdout.write(`\nError: ${e.message}\nStack: ${e.stack}\n`);
  } finally {
    (await dbConnection)
      .disconnect()
      .then(
        console.log(
          `${new Date()
            .toISOString()
            .replace("T", " ")} - INFO:\tDisconnected from DB\n`
        )
      );
  }
  allMessages.forEach(async (msg) => {
    const channel = client.guilds.cache
      .get(msg.guild)
      .channels.cache.get(msg.channel.id);
    await channel.messages.fetch(msg.message.id);
  });
});

client.on("ready", async () => {
  client.user.setPresence({
    activity: { name: "most of the time", type: "WATCHING" },
    status: "online",
  });
  console.log(
    `${new Date()
      .toISOString()
      .replace(
        "T",
        " "
      )} - INFO:\tSet presence status to 'WATCHING most of the time'`
  );
});

client.on("messageReactionAdd", async (reaction, user) => {
  console.log(
    `${user.tag} reacted with ${reaction.emoji} on message ${reaction.message.id}`
  );
  const member = reaction.message.guild.members.cache.find(
    (member) => member.user.id === user.id
  );
  if (!member) return;

  const dbConnection = mongoose();
  let message;
  try {
    await dbConnection;
    process.stdout.write(
      `${new Date()
        .toISOString()
        .replace("T", " ")} - INFO:\tFetching message from DB...`
    );
    messageQuery = await ReactionListener.findOne({
      is_ongoing: true,
      message: {
        id: reaction.message.id,
      },
    });
    process.stdout.write(messageQuery ? " (Found)\n" : " (Not Found)\n");
    const roleToApply = messageQuery.roles.find(
      (el) => el.reaction === reaction.emoji.name
    );
    if (!messageQuery.allow_dupes) {
      const currUser = messageQuery.users.find(
        (user) => user.role_id === roleToApply.id
      );
      // role already applied, remove and reapply
      if (currUser) {
        console.log("currUser");
        console.log({ currUser });
        try {
          member.roles
            .remove(currUser.role_id)
            .then((m) =>
              m.roles
                .add(roleToApply.id)
                .then((m2) =>
                  console.log(
                    `Added role to ${m2.tag}`,
                    `Removed/Added via message: https://discord.com/channels/${messageQuery.channel.guild}/${messageQuery.channel.id}/${messageQuery.message.id}`
                  )
                )
            )
            .then(() => {
              updateUser.role_id = roleToApply.id;
              updateUser.role_name = roleToApply.name;
              ReactionListener.updateOne(
                {
                  message: {
                    id: reaction.message.id,
                  },
                },
                {}
              );
            });
        } catch (e) {
          console.log(e);
        }
      } else {
        member.roles.add(
          roleToApply.id,
          `Added via message: https://discord.com/channels/${messageQuery.channel.guild}/${messageQuery.channel.id}/${messageQuery.message.id}`
        );
      }
    } else {
      // dupes allowed: we don't care about role logging
      try {
        member.roles
          .add(
            roleToApply.id,
            `Added via message: https://discord.com/channels/${messageQuery.channel.guild}/${messageQuery.channel.id}/${messageQuery.message.id}`
          )
          .then(() => {
            console.log("yo else");
            console.log(
              "yo",
              messageQuery.users[
                messageQuery.findIndex((users) => user.id === user.id)
              ]
            );
          });
      } catch (e) {
        console.log({ e });
      }
    }
    //if (messageQuery.users.some(el => el.role_id ===))
    /*messageList.update({
      $push: {
        users: {
          _id: user.id,
          id: user.id,
          role_id: "role_id!",
          role_name: "role_name!",
        },
      },
    });*/
    //console.log(messageQuery);
  } catch (e) {
    process.stdout.write(`\nError: ${e.message}\nStack: ${e.stack}\n`);
  } finally {
    (await dbConnection)
      .disconnect()
      .then(
        console.log(
          `${new Date()
            .toISOString()
            .replace("T", " ")} - INFO:\tDisconnected from DB\n`
        )
      );
  }
  //console.log(member.roles.add());
});

client.on("message", async (message) => {
  if (message.author.bot || !message.content.startsWith(globalPrefix)) return;
  if (message.channel instanceof Discord.DMChannel) return;
  const prefix = globalPrefix;
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();
  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    );
  if (!command) return;
  if (command.args && !args.length) {
    let reply = "No arguments were provided";
    if (command.usage) reply += `\nUsage:${command.usage}`;
    return message.channel.send(reply);
  }
  try {
    // pass db
    if (command.usesDb)
      command.execute(
        message,
        args,
        mongoose
      );
    else
      command.execute(
        message,
        args
      );
  } catch (e) {
    console.error(
      `${new Date()
        .toISOString()
        .replace("T", " ")} - ERROR:\tcommandName: ${commandName}\nmessage: ${
        e.message
      }\nError: ${{ e }}`
    );
    message.reply("there was an error trying to execute that command");
  }
});
