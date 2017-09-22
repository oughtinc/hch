// @flow

import type {
  Human,
  Budget,
  TimedHuman,
  StringWithTimeElapsed,
  StringWithTimeBudget
} from "./agent";
import { Budgeter, BudgetedAgent } from "./agent";
import { Message, Referent } from "./message";
import { parseCommand, parseMessage } from "./parser";
import { range } from "./utils";

// HCH transforms an Agent (human) that operates on text into a
// better-resourced BudgetedAgent that operates on messages.
// The total bandwidth of HCH(H) is limited by the bandwidth of H.
export class BudgetedHCH extends BudgetedAgent<Message, Message> {
  h: TimedHuman;
  args: Array<Referent>;
  childBase: BudgetedHCH;

  constructor(
    h: TimedHuman,
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
    if (budget < 0) {
      throw new Error("It shouldn't be possible to get to < 0 budget here.");
    }
    const state = {
      text: this.viewMessage(message),
      budgetInMS: budget
    };
    const { action: response, agent: newH } = this.h.act(state);
    const successor = new BudgetedHCH(
      newH,
      this.childBase,
      this.args.concat(message.args)
    );
    const intermediateBudget = budget - response.msElapsed;
    if (intermediateBudget <= 0) {
      return {
        action: parseMessage("Out of budget."),
        agent: successor,
        budget: 0
      };
    }
    const command = parseCommand(response.text);
    const { observation, done, returnValue, spending } = command.execute(
      successor,
      budget
    );
    const newBudget = intermediateBudget - spending;
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
    if (!(observation instanceof Message)) {
      throw new Error("observation should always be Message while not done");
    }
    return successor.act(observation, newBudget);
  }

  viewMessage(message: Message): string {
    const n = this.args.length;
    const k = message.size();
    return message.formatWithIndices(range(n, n + k));
  }
}

export function HCH(
  h: TimedHuman,
  budgetInMS: Budget
): Budgeter<Message, Message> {
  return new Budgeter(new BudgetedHCH(h), budgetInMS);
}
