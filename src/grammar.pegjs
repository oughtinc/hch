{

  const { View, Reflect, Reply, Note, Ask } = options.commands;
  const { Message, Pointer, Channel } = options.message;
  const { assert, unweave, flatten } = options.utils;
  
}

Expression
  = Command

_ "Whitespace"
  = [ \t\n\r]*

Prose
  = [A-Za-z0-9 ,!?+-/*.;:_<>=&%{}\[\]\'\"]+ { 
    return text();
  }

ProseOrEmpty
  = Prose / "" {
    return text();
  }

Integer
  = [0-9]+ { return parseInt(text(), 10); }

Referent
  = AgentReferent / MessageReferent

AgentReferent
  = "@" num:Integer {
    return new Pointer(num, Channel);
  }

MessageReferent
  = "#" num:Integer {
    return new Pointer(num, Message);
  }

SubMessage
  = "(" message:Message ")" {
    return message;
  }

Argument
  = SubMessage / AgentReferent / MessageReferent

LiteralMessage
  = prefix:ProseOrEmpty pairs:(Argument ProseOrEmpty)* {
    const value = [prefix].concat(flatten(pairs));
    const [text, args] = unweave(value);
    return { text, args };
  }

Message
  = value:(MessageReferent / LiteralMessage) {
    if (value instanceof Pointer) {
      return value;
    } else {
      assert.ok(typeof value == "object", `Expected object, got ${JSON.stringify(value)}`);
      const { text, args } = value;      
      return new Message(text, ...args);
    }
  }
  
TargetModifier
  = "@" num:Integer {
      return { recipient: new Pointer(num, Channel) }
    }

BudgetModifier
  = "$" num:Integer {
    return { budget: num }
  }

AskModifiers = modifiers:((TargetModifier / BudgetModifier)*) {
    return Object.assign({}, ...modifiers)
  }

AskCommand = "ask" modifiers:AskModifiers _ message:Message {
    return new Ask(message, modifiers);
  }

ReplyCommand = "reply" _ message:Message {
    return new Reply(message);
  }

NoteCommand = "note" _ message:Message {
    return new Note(message);
  }

ReflectCommand = "reflect" {
    return new Reflect();
  }

ViewCommand = "view" _ message:Message {
    return new View(message);
  }
  
Command = AskCommand / ReplyCommand / ReflectCommand / ViewCommand / NoteCommand