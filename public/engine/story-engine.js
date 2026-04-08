const clone = (value) => structuredClone(value);

export class StoryEngine {
  #pack;
  #nodesById;
  #state;
  #history;
  #listeners;

  constructor(pack) {
    if (!pack?.nodes?.length) {
      throw new Error('Invalid pack: nodes are required.');
    }

    this.#pack = pack;
    this.#nodesById = new Map(pack.nodes.map((node) => [node.id, node]));
    this.#listeners = new Set();
    this.#history = [];
    this.#state = clone(pack.initialState);

    this.#enterNode(this.#state.currentNode);
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.#listeners.delete(listener);
  }

  reset() {
    this.#history = [];
    this.#state = clone(this.#pack.initialState);
    this.#enterNode(this.#state.currentNode);
    return this.getSnapshot();
  }

  choose(choiceId) {
    const node = this.getCurrentNode();
    const choice = this.getVisibleChoices(node).find((item) => item.id === choiceId);
    if (!choice) {
      return this.getSnapshot();
    }

    if (choice.reset) {
      return this.reset();
    }

    this.#applyEffects(choice.effects);
    this.#history.push({
      nodeId: node.id,
      nodeTitle: node.title,
      choiceId: choice.id,
      choiceText: choice.text
    });

    this.#enterNode(choice.next);
    return this.getSnapshot();
  }

  getCurrentNode() {
    return this.#mustNode(this.#state.currentNode);
  }

  getVisibleChoices(node = this.getCurrentNode()) {
    return (node.choices || []).filter((choice) => this.#conditionOk(choice.visibleIf));
  }

  getSnapshot() {
    const node = this.getCurrentNode();
    return {
      packId: this.#pack.id,
      title: this.#pack.title,
      stats: this.#pack.stats,
      statOrder: this.#pack.statOrder || Object.keys(this.#pack.stats || {}),
      node,
      choices: this.getVisibleChoices(node),
      state: clone(this.#state),
      history: clone(this.#history)
    };
  }

  #notify() {
    const snapshot = this.getSnapshot();
    this.#listeners.forEach((listener) => listener(snapshot));
  }

  #mustNode(nodeId) {
    const node = this.#nodesById.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    return node;
  }

  #enterNode(nodeId, visited = new Set()) {
    if (!nodeId) {
      throw new Error('Node transition target is empty.');
    }
    if (visited.has(nodeId)) {
      throw new Error(`Auto transition loop detected at: ${nodeId}`);
    }
    visited.add(nodeId);

    const node = this.#mustNode(nodeId);
    this.#state.currentNode = nodeId;
    this.#applyEffects(node.enterEffects);

    if (node.autoNext?.length) {
      const nextRule = node.autoNext.find((rule) => this.#conditionOk(rule.if));
      if (nextRule?.next) {
        this.#enterNode(nextRule.next, visited);
        return;
      }
    }

    this.#notify();
  }

  #applyEffects(effects = {}) {
    Object.entries(effects).forEach(([key, delta]) => {
      this.#state[key] = (this.#state[key] ?? 0) + delta;
    });
  }

  #conditionOk(condition) {
    if (!condition) return true;
    const value = this.#state[condition.stat] ?? 0;
    if (typeof condition.gte === 'number' && value < condition.gte) return false;
    if (typeof condition.gt === 'number' && value <= condition.gt) return false;
    if (typeof condition.lte === 'number' && value > condition.lte) return false;
    if (typeof condition.lt === 'number' && value >= condition.lt) return false;
    if (typeof condition.eq === 'number' && value !== condition.eq) return false;
    return true;
  }
}
