# wangBot
Utilities for managing the World Cups

## Dependencies

node.js: `16.0.0+`

MongoDB: `5.0.0+`

## Running your own version

- Install the dependencies above
- Clone the project:
    ```bash
    git clone https://github.com/LeoFLT/wangBot.git
    ```
- Install the project dependencies:
     ```bash
     cd ./wangBot && npm i
     ```
- Optionally, install pm2 as a process manager:
    ```bash
    npm i pm2
    ```
- Set the correct Environment Variables in the .env file:
    - `PREFIX`: The prefix used by the bot
    - `MONGO_PATH`: MongoDB database path for the project
    - `DISCORD_TOKEN`: The Discord Bot Token
- Start the bot:
    - With pm2:
        ```bash
        pm2 start index.js
        ```
    - Without pm2:
        ```bash
        node index.js
        ```
- Make the bot join your Guild using an invite link in (roughly) this format, where YOUR_APPLICATION_ID is the ID assigned to the Discord Application on the [Discord Developer Portal](https://discord.com/developers/applications "Discord"):
`https://discord.com/api/oauth2/authorize?client_id=YOUR_APPLICATION_ID&permissions=2416363603&scope=bot`
    - The bot needs to have its highest role set as a role that is higher than the roles it will assign/remove others.
    
Feel free to tweak the permissions for yourpurposes. Keep in mind, however, that not all features will work if you don't give it all the permissions listed on the link above (e.g. no Manage Channels permission will result in `move_channels` giving out an error).
