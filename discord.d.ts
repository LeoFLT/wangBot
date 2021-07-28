declare module "discord.js" {
  export interface Client {
    commands: Collection<unknown, Command>;
  }

  export interface Command {
    name: string;
    description: string;
    aliases: string[];
    args: boolean;
    usage?: string;
    execute: (message: Message, args: string[]) => any | Promise<any>;
  }
}
