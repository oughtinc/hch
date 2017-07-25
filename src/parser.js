// @flow

import path from "path";
import fs from "fs";
import peg from "pegjs";
import { Command, MalformedCommand } from "./commands";
import { Message } from "./message";

// Parser environment:
import * as CommandModule from "./commands";
import * as MessageModule from "./message";
import * as UtilsModule from "./utils";

const grammar = fs.readFileSync(path.join(__dirname, "../src/grammar.pegjs"), {
  encoding: "utf8"
});

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
