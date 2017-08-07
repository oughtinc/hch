// @flow

import { human } from "./agent";
import { HCH } from "./hch";
import { parseMessage } from "./parser";

const hch = new HCH(human, 10e6);
const startMessage = parseMessage(
  "How many (ping pong balls) fit into a (Boeing 747)"
);
const result = hch.act(startMessage);
console.log(result.action.toString());
