// @flow

import * as assert from "assert";
import { NotImplementedError, last, interleave } from "./utils";

// A Referent is anything that can be referred to in a message,
// including Messages, Pointers, and Channels
export class Referent {
  static symbol = "?";

  instantiate(xs: Array<Referent>) {
    throw new NotImplementedError();
  }

  toString(): string {
    throw new NotImplementedError();
  }

  symbol() {
    return this.constructor.symbol;
  }
}

// A Message consists of text interspersed with Referents
export class Message extends Referent {
  text: Array<string>;
  args: Array<Referent>;

  static symbol = "#";

  constructor(text: string | Array<string>, ...args: Array<Referent>) {
    super();
    if (typeof text === "string") {
      text = text.split("[]");
    }
    this.text = text;
    this.args = args;
  }

  size(): number {
    return this.args.length;
  }

  concat(other: Message): Message {
    const joined = last(this.text) + other.text[0];
    const text = this.text
      .slice(0, this.text.length - 1)
      .concat([joined])
      .concat(other.text.slice(1));
    const args = this.args.concat(other.args);
    return new Message(text, ...args);
  }

  format(names: Array<string>) {
    return interleave(this.text, names).join("");
  }

  formatWithIndices(indices: Array<number>) {
    assert.equal(indices.length, this.args.length);
    const names = indices.map((index, i) => `${this.args[i].symbol()}${index}`);
    return this.format(names);
  }

  instantiate(xs: Array<Referent>) {
    return new Message(this.text, ...this.args.map(arg => arg.instantiate(xs)));
  }

  toString(): string {
    return this.format(
      this.args.map(arg => {
        return `(${arg.toString()})`;
      })
    );
  }
}

// A Channel is a wrapper around an Agent, that lets it be pointed to
// in messages
export class Channel<AgentType> extends Referent {
  agent: AgentType;

  static symbol = "@";

  constructor(agent: AgentType) {
    super();
    this.agent = agent;
  }

  instantiate(xs: Array<Referent>) {
    throw new Error("should not try to instantiate a channel");
  }
}

export function withSender<AgentType>(
  sender: AgentType,
  message: Message
): Message {
  const m = new Message("[]: ", new Channel(sender));
  return m.concat(message);
}

// A Pointer is an abstract variable, which can be instantiated given
// a list of arguments
export class Pointer extends Referent {
  n: number;
  type: Class<Referent>;

  constructor(n: number, type: Class<Referent> = Referent) {
    super();
    this.n = n;
    this.type = type;
  }

  instantiate(xs: Array<Referent>): Referent {
    return xs[this.n];
  }

  symbol() {
    return `${this.type.symbol}->`;
  }

  toString() {
    return `${this.symbol()}${this.n.toString()}`;
  }
}
