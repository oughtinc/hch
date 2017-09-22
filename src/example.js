// @flow

import _ from "lodash";
import prettyMs from "pretty-ms";

// $FlowFixMe
import readlineSync from "readline-sync"; // eslint-disable-line

import type { StringWithTimeBudget, StringWithTimeElapsed } from "./agent";

import { HCH } from "./hch";
import { StatelessAgent } from "./agent";
import { interleave } from "./utils";
import { parseMessage } from "./parser";

function clearScreen(): void {
  console.log("\x1b[2J\x1b[H");
}

function elicitInput(
  observations: Array<StringWithTimeBudget>,
  actions: Array<StringWithTimeElapsed>
): StringWithTimeElapsed {
  clearScreen();
  const lines = interleave(
    observations.map(observation => observation.text),
    actions.map(action => `>>> ${action.text}`)
  );
  console.log(lines.join("\n\n"));
  const startTime = new Date();
  const budgetRemaining = _.last(observations).budgetInMS;
  const prompt = `\n>>> [${prettyMs(budgetRemaining, {
    secDecimalDigits: 0
  })}] `;
  const text = readlineSync.question(prompt);
  const msElapsed = new Date() - startTime;
  return { text, msElapsed };
}

function main() {
  const human = new StatelessAgent(elicitInput);
  const hch = new HCH(human, 60 * 5 * 1000);
  const startMessage = parseMessage(
    "How many ping pong balls fit into a Boeing 747"
  );
  const result = hch.act(startMessage);
  console.log(result.action.toString());
}

main();
