// @flow

import _ from "lodash";

import type {
  TimedHuman,
  TimedStringResponse,
  StringWithTimeBudget
} from "./agent";

import { StatelessAgent } from "./agent";
import { HCH } from "./hch";
import { parseMessage } from "./parser";

export type Context = {|
  observations: Array<StringWithTimeBudget>,
  actions: Array<TimedStringResponse>
|};

export type FinalState = {| isFinal: true, result: string |};

export type IntermediateState = {|
  isFinal: false,
  context: Context,
  rerun: () => AsyncState
|};

export type AsyncState = FinalState | IntermediateState;

export type Respond = (context: Context) => TimedStringResponse;

export class HaltHCH extends Error {
  context: Context;

  constructor(message: string, context: Context) {
    super(message);
    this.context = context;
  }
}

class AsyncHCH {
  respond: Respond;
  agent: TimedHuman;

  constructor(respond: Respond) {
    this.respond = context => respond(context);
    this.agent = new StatelessAgent(this.respondOrHalt.bind(this));
  }

  run(root: string, budgetInMS: number): AsyncState {
    const hch = HCH(this.agent, budgetInMS);
    const startMessage = parseMessage(root);
    let result = null;
    try {
      result = hch.act(startMessage);
    } catch (e) {
      if (e instanceof HaltHCH) {
        return {
          isFinal: false,
          context: e.context,
          rerun: () => this.run(root, budgetInMS)
        };
      }
      throw e;
    }
    return {
      isFinal: true,
      result: result.action.text.toString()
    };
  }

  respondOrHalt(
    observations: Array<StringWithTimeBudget>,
    actions: Array<TimedStringResponse>
  ): TimedStringResponse {
    const response = this.respond({ actions, observations });
    if (response) {
      if (
        !(typeof response.text === "string") ||
        !_.isNumber(response.msElapsed)
      ) {
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
