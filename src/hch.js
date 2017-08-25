// @flow

import type { Human, Budget } from "./agent";
import { Budgeter, BudgetedAgent } from "./agent";
import { Message, Referent } from "./message";
import { parseCommand, parseMessage } from "./parser";
import { range } from "./utils";

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
    } else if (budget === 0) {
      s += "\n[You have no budget, type a s to reply]";
    } else {
      s += `\n[Remaining budget is ${budget.toString()}]`;
    }
    return s;
  }
}

export function HCH(h: Human, n: Budget): Budgeter<Message, Message> {
  return new Budgeter(new BudgetedHCH(h), n);
}
