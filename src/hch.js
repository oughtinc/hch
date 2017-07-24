// @flow

import path from "path";
import fs from "fs";
import peg from "pegjs";
import type { Human, Budget } from "./agent";
import { Agent, Budgeter, BudgetedAgent } from "./agent";
import { Message, Pointer, Channel, Referent, withSender } from "./message";
import { Command, MalformedCommand } from "./commands";
import { assert, range } from "./utils";

// For parser environment:
import * as CommandModule from "./commands";
import * as MessageModule from "./message";
import * as UtilsModule from "./utils";

export function HCH(h: Human, n: Budget): Budgeter<Message, Message> {
  return new Budgeter(new BudgetedHCH(h), n);
}

// HCH transforms an Agent (human) that operates on text into a
// better-resourced BudgetedAgent that operates on messages.
// The total bandwidth of HCH(H) is limited by the bandwidth of H.
export class BudgetedHCH extends BudgetedAgent<Message, Message> {
  h: Human;
  args: Array<Referent>;
  childBase: BudgetedHCH;

  constructor(
    h: Human,
    childBase: ?BudgetedHCH = null,
    args: Array<Referent> = []
  ) {
    super();
    this.h = h;
    this.childBase = childBase || this; // by default, children are copies of self
    this.args = args;
  }

  child(): BudgetedHCH {
    return this.childBase;
  }

  act(
    message: Message,
    budget: Budget
  ): {
    action: Message,
    +agent: BudgetedHCH,
    budget: Budget
  } {
    const s = this.viewMessage(message, budget);
    const { action: response, agent: newH } = this.h.act(s);
    const successor = new BudgetedHCH(
      newH,
      this.childBase,
      this.args.concat(message.args)
    );
    if (budget <= 0) {
      return {
        action: parseMessage(response),
        agent: successor,
        budget: 0
      };
    }
    const command = parseCommand(response);
    const { obs, done, returnValue, spending } = command.execute(
      successor,
      budget
    );
    const newBudget = budget - spending;
    if (done) {
      if (!(returnValue instanceof Message)) {
        throw new Error("returnValue should always be Message when done");
      }
      return {
        action: returnValue,
        agent: successor,
        budget: newBudget
      };
    }
    if (!(obs instanceof Message)) {
      throw new Error("obs should always be Message while not done");
    }
    return successor.act(obs, newBudget);
  }

  viewMessage(message: Message, budget: Budget): string {
    const n = this.args.length;
    const k = message.size();
    let s = message.formatWithIndices(range(n, n + k));
    if (budget < 0) {
      throw new Error("It shouldn't be possible to get to < 0 budget.");
    } else if (budget == 0) {
      s += "\n[You have no budget, type a s to reply]";
    } else {
      s += `\n[Remaining budget is ${budget.toString()}]`;
    }
    return s;
  }
}

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
