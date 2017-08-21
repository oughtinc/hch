// @flow

import readlineSync from "readline-sync";

import type { Human } from "./agent";

import { HCH } from "./hch";
import { StatelessAgent } from "./agent";
import { interleave } from "./utils";
import { parseMessage } from "./parser";

function elicitInput(
  observations: Array<string>,
  actions: Array<string>
): string {
  clearScreen();
  const lines = interleave(
    observations,
    actions.map(action => `>>> ${action}`)
  );
  console.log(lines.join("\n\n"));
  return readlineSync.question("\n>>> ");
}

function clearScreen(): void {
  console.log("\x1b[2J\x1b[H");
}

function main() {
  const human = new StatelessAgent(elicitInput);
  const hch = new HCH(human, 10e6);
  const startMessage = parseMessage(
    "How many ping pong balls fit into a Boeing 747"
  );
  const result = hch.act(startMessage);
  console.log(result.action.toString());
}

main();
