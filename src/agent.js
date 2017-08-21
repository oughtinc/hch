// @flow

import { NotImplementedError } from "./utils";

// An immutable representation of a (stateful) policy
export class Agent<O, A> {
  act(obs: O): { action: A, +agent: Agent<O, A> } {
    throw new NotImplementedError();
  }
}

export type Policy<O, A> = (observations: Array<O>, actions: Array<A>) => A;

export class StatelessAgent<O, A> extends Agent<O, A> {
  observations: Array<O>;
  actions: Array<A>;
  policy: Policy<O, A>;

  constructor(
    policy: Policy<O, A>,
    observations: Array<O> = [],
    actions: Array<A> = []
  ) {
    super();
    this.observations = observations;
    this.actions = actions;
    this.policy = policy;
  }

  act(obs: O): { action: A, +agent: StatelessAgent<O, A> } {
    const observations = this.observations.concat([obs]);
    const action = this.policy(observations, this.actions);
    const actions = this.actions.concat([action]);
    const agent = new StatelessAgent(this.policy, observations, actions);
    return { action, agent };
  }

  set(observations: Array<O>, actions: Array<A>): StatelessAgent<O, A> {
    return new StatelessAgent(this.policy, observations, actions);
  }
}

export type Human = StatelessAgent<string, string>;

export type Budget = number;

// Like an Agent, but tracks resource constraints.
export class BudgetedAgent<O, A> {
  act(
    obs: O,
    budget: Budget
  ): {
    action: A,
    +agent: BudgetedAgent<O, A>,
    budget: Budget
  } {
    throw new NotImplementedError();
  }
}

// Turns a BudgetedAgent into an Agent by specifying what its per-step budget should be.
export class Budgeter<O, A> extends Agent<O, A> {
  budgetedAgent: BudgetedAgent<O, A>;
  budget: Budget;

  constructor(budgetedAgent: BudgetedAgent<O, A>, budget: Budget) {
    super();
    this.budgetedAgent = budgetedAgent;
    this.budget = budget;
  }

  act(obs: O): { action: A, +agent: Budgeter<O, A> } {
    const { action, agent } = this.budgetedAgent.act(obs, this.budget);
    return {
      action,
      agent: new Budgeter(this.budgetedAgent, this.budget)
    };
  }
}
