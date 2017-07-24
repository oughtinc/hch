// @flow

import { Message } from "./message";
import { human } from "./agent";
import { HCH, parseMessage } from "./hch";

const hch = new HCH(human, 10e6);
const startMessage = parseMessage("What is the reverse of (1 (2 (3)))?");
const result = hch.act(startMessage);
console.log(result.action.toString());
