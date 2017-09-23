// @flow

import type { Budget } from "./agent";
import type { BudgetedHCH } from "./hch";
import { NotImplementedError } from "./utils";
import { Message, Channel, Pointer, withSender } from "./message";

type IntermediateExecutionResult = {|
  done: false,
  observation: Message,
  returnValue: null,
  spending: Budget
|};

type FinalExecutionResult = {|
  done: true,
  observation: null,
  returnValue: Message,
  spending: Budget
|};

export type ExecutionResult =
  | IntermediateExecutionResult
  | FinalExecutionResult;

export class Command {
  execute(env: BudgetedHCH, budget: Budget): ExecutionResult {
    throw new NotImplementedError();
  }
}

export class MalformedCommand extends Command {
  execute(env: BudgetedHCH, budget: Budget): IntermediateExecutionResult {
    return {
      observation: new Message(
        "the valid commands are 'reply', 'ask', 'note', 'reflect', 'view', and 'ask@N'"
      ),
      done: false,
      returnValue: null,
      spending: 0
    };
  }
}

export class Reflect extends Command {
  execute(env: BudgetedHCH, budget: Budget): IntermediateExecutionResult {
    return {
      observation: new Message("you are []", new Channel(env)),
      done: false,
      returnValue: null,
      spending: 0
    };
  }
}

export class View extends Command {
  message: Message;

  constructor(message: Message) {
    super();
    this.message = message;
  }

  execute(env: BudgetedHCH, budget: Budget): IntermediateExecutionResult {
    return {
      observation: this.message.instantiate(env.args),
      done: false,
      returnValue: null,
      spending: 0
    };
  }
}

export class Note extends Command {
  message: Message;

  constructor(message: Message) {
    super();
    this.message = message;
  }

  execute(env: BudgetedHCH, budget: Budget): IntermediateExecutionResult {
    return {
      observation: this.message,
      done: false,
      returnValue: null,
      spending: 0
    };
  }
}

export class Reply extends Command {
  message: Message;

  constructor(message: Message) {
    super();
    this.message = message;
  }

  execute(env: BudgetedHCH, budget: Budget): FinalExecutionResult {
    return {
      observation: null,
      done: true,
      returnValue: this.message.instantiate(env.args),
      spending: 0
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
        throw new Error("Recipient pointer must point to channel");
      }
      return channel.agent;
    }
    return env.child();
  }

  execute(env: BudgetedHCH, budget: Budget): IntermediateExecutionResult {
    const defaultBudget = budget / 3;
    const proposedBudget = this.budget != null ? this.budget : defaultBudget;
    const maxBudget = budget - 1;
    const subBudget = Math.min(maxBudget, proposedBudget);
    const message = withSender(env, this.message.instantiate(env.args));
    const recipient = this.recipient(env);
    const {
      agent: responder,
      action: response,
      budget: remaining
    } = recipient.act(message, subBudget);
    return {
      observation: withSender(responder, response),
      done: false,
      returnValue: null,
      spending: subBudget - remaining
    };
  }
}
