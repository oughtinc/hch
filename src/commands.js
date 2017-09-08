// @flow

import type { Budget } from "./agent";
import type { BudgetedHCH } from "./hch";
import { NotImplementedError } from "./utils";
import { Message, Channel, Pointer, withSender } from "./message";

export type ExecutionResult = {
  obs: ?Message,
  done: boolean,
  returnValue: ?Message,
  spending: Budget
};

export class Command {
  execute(env: BudgetedHCH, budget: Budget): ExecutionResult {
    throw new NotImplementedError();
  }
}

export class MalformedCommand extends Command {
  execute(env: BudgetedHCH, budget: Budget): ExecutionResult {
    return {
      obs: new Message(
        "the valid commands are 'reply', 'ask', 'note', 'reflect', 'view', and 'ask@N'"
      ),
      done: false,
      returnValue: null,
      spending: 1
    };
  }
}

export class Reflect extends Command {
  execute(env: BudgetedHCH, budget: Budget): ExecutionResult {
    return {
      obs: new Message("you are []", new Channel(env)),
      done: false,
      returnValue: null,
      spending: 1
    };
  }
}

export class View extends Command {
  message: Message;

  constructor(message: Message) {
    super();
    this.message = message;
  }

  execute(env: BudgetedHCH, budget: Budget): ExecutionResult {
    return {
      obs: this.message.instantiate(env.args),
      done: false,
      returnValue: null,
      spending: 1
    };
  }
}

export class Note extends Command {
  message: Message;

  constructor(message: Message) {
    super();
    this.message = message;
  }

  execute(env: BudgetedHCH, budget: Budget): ExecutionResult {
    return {
      obs: this.message,
      done: false,
      returnValue: null,
      spending: 1
    };
  }
}

export class Reply extends Command {
  message: Message;

  constructor(message: Message) {
    super();
    this.message = message;
  }

  execute(env: BudgetedHCH, budget: Budget): ExecutionResult {
    return {
      obs: null,
      done: true,
      returnValue: this.message.instantiate(env.args),
      spending: 1
    };
  }
}

type Modifiers = {
  budget?: Budget,
  recipient?: Pointer
};

export class Ask extends Command {
  message: Message;
  recipientChannelPointer: ?Pointer;
  budget: ?Budget;

  constructor(message: Message, modifiers: Modifiers) {
    super();
    this.message = message;
    this.recipientChannelPointer = modifiers.recipient;
    this.budget = modifiers.budget;
  }

  recipient(env: BudgetedHCH): BudgetedHCH {
    if (this.recipientChannelPointer) {
      const channel = this.recipientChannelPointer.instantiate(env.args);
      if (!(channel instanceof Channel)) {
        throw new Error("recipient pointer must point to channel");
      }
      return channel.agent;
    }
    return env.child();
  }

  execute(env: BudgetedHCH, budget: Budget): ExecutionResult {
    const defaultBudget = budget / 10;
    const maxBudget = budget - 1;
    const subBudget = Math.min(
      maxBudget,
      this.budget != null ? this.budget : defaultBudget
    );
    const message = withSender(env, this.message.instantiate(env.args));
    const recipient = this.recipient(env);
    const {
      agent: responder,
      action: response,
      budget: remaining
    } = recipient.act(message, subBudget);
    return {
      obs: withSender(responder, response),
      done: false,
      returnValue: null,
      spending: subBudget - remaining + 1 // +1?
    };
  }
}
