// @flow

import peg from "pegjs";
import grammar from "./grammar.pegjs";

// Parser environment:
import * as CommandModule from "./commands";
import * as MessageModule from "./message";
import * as UtilsModule from "./utils";

const { Command, MalformedCommand } = CommandModule;
const { Message } = MessageModule;

const messageParser = peg.generate(grammar, {
  allowedStartRules: ["Message"]
});

const commandParser = peg.generate(grammar, {
  allowedStartRules: ["Command"]
});

const parseEnv = {
  commands: CommandModule,
  message: MessageModule,
  utils: UtilsModule
};

export function parseMessage(text: string): Message {
  try {
    return messageParser.parse(text, parseEnv);
  } catch (e) {
    console.error(e);
    return new Message("<<malformed message>>");
  }
}

export function parseCommand(text: string): Command {
  try {
    return commandParser.parse(text, parseEnv);
  } catch (e) {
    console.error(e);
    return new MalformedCommand();
  }
}
