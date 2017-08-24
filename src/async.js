// @flow

import { StatelessAgent } from "./agent";
import { HCH } from "./hch";
import { parseMessage } from "./parser";

export type Context = {|
  observations: Array<string>,
  actions: Array<string>
|};

export type FinalState = {| isFinal: true, result: string |};

export type IntermediateState = {|
  isFinal: false,
  context: Context,
  rerun: () => AsyncState
|};

export type AsyncState = FinalState | IntermediateState;

export type Respond = (context: Context) => string;

export class HaltHCH extends Error {
  context: Context;

  constructor(message: string, context: Context) {
    super(message);
    this.context = context;
  }
}

class AsyncHCH {
  respond: Respond;
  agent: StatelessAgent<string, string>;

  constructor(respond: Respond) {
    this.respond = context => respond(context);
    this.agent = new StatelessAgent(this.respondOrHalt.bind(this));
  }

  run(root: string, budget: number): AsyncState {
    const hch = HCH(this.agent, budget);
    const startMessage = parseMessage(root);
    let result = null;
    try {
      result = hch.act(startMessage);
    } catch (e) {
      if (e instanceof HaltHCH) {
        return {
          isFinal: false,
          context: e.context,
          rerun: () => this.run(root, budget)
        };
      }
      throw e;
    }
    return {
      isFinal: true,
      result: result.action.toString()
    };
  }

  respondOrHalt(observations: Array<string>, actions: Array<string>): string {
    const response = this.respond({ actions, observations });
    if (response) {
      if (!(typeof response === "string")) {
        throw new Error(
          `Wrong response type: ${typeof response} (got ${JSON.stringify(
            response
          )})`
        );
      }
      return response;
    }
    throw new HaltHCH("Encountered new context", { actions, observations });
  }
}

export default AsyncHCH;
