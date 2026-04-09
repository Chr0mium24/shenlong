const clone = (value) => structuredClone(value);
const ENDING_TRANSITION_NEXT = '__resume_pending_ending__';
const DIALOGUE_VERBS = [
  '问',
  '答',
  '怒道',
  '笑骂',
  '说道',
  '高喊',
  '叹',
  '道',
  '夸',
  '冷笑',
  '点点头',
  '长叹',
  '哄笑',
  '起哄',
  '接话'
];

export class StoryEngine {
  #pack;
  #nodesById;
  #state;
  #history;
  #listeners;
  #virtualNode;
  #pendingEndingNodeId;

  constructor(pack) {
    if (!pack?.nodes?.length) {
      throw new Error('Invalid pack: nodes are required.');
    }

    this.#pack = pack;
    this.#nodesById = new Map(pack.nodes.map((node) => [node.id, node]));
    this.#listeners = new Set();
    this.#history = [];
    this.#state = clone(pack.initialState);
    this.#virtualNode = null;
    this.#pendingEndingNodeId = null;

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
    this.#virtualNode = null;
    this.#pendingEndingNodeId = null;
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

    if (this.#virtualNode && choice.next === ENDING_TRANSITION_NEXT) {
      const pendingId = this.#pendingEndingNodeId;
      if (!pendingId) {
        return this.getSnapshot();
      }
      this.#pendingEndingNodeId = null;
      this.#virtualNode = null;
      this.#enterNode(pendingId);
      return this.getSnapshot();
    }

    this.#applyEffects(choice.effects);
    this.#history.push({
      nodeId: node.id,
      nodeTitle: node.title,
      choiceId: choice.id,
      choiceText: choice.text
    });

    if (this.#shouldTriggerEndingTransition(choice.next)) {
      this.#pendingEndingNodeId = choice.next;
      this.#virtualNode = this.#buildEndingTransitionNode();
      this.#notify();
      return this.getSnapshot();
    }

    this.#enterNode(choice.next);
    return this.getSnapshot();
  }

  getCurrentNode() {
    if (this.#virtualNode) {
      return this.#virtualNode;
    }
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
      presentation: clone(this.#pack.presentation || {}),
      node,
      lineCues: this.#buildLineCues(node),
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
    this.#virtualNode = null;
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

  #shouldTriggerEndingTransition(targetNodeId) {
    if (!this.#pack.endingTransition) return false;
    const targetNode = this.#nodesById.get(targetNodeId);
    return Boolean(targetNode?.ending);
  }

  #buildEndingTransitionNode() {
    const transition = this.#pack.endingTransition;
    return {
      id: '__ending_transition__',
      kind: 'ending_transition',
      act: transition.act || '终幕',
      title: transition.title || '戏台之下',
      durationMs: transition.durationMs || this.#pack.presentation?.endingTransition?.durationMs || 3600,
      lines: transition.lines || [],
      choices: [
        {
          id: 'ending_transition_continue',
          text: transition.continueText || '看清此局',
          next: ENDING_TRANSITION_NEXT
        }
      ]
    };
  }

  #buildLineCues(node) {
    const lines = Array.isArray(node.lines) ? node.lines : [];
    const cast = this.#pack.presentation?.cast || [];

    return lines.map((line, index) => {
      if (typeof line === 'object' && line !== null) {
        return {
          id: line.id || `${node.id}-line-${index}`,
          text: line.text || '',
          style: line.style || 'narration',
          speaker: line.speaker || null,
          speed: line.speed || 1,
          portrait: line.portrait || null
        };
      }

      return this.#parseLineCue(node.id, line, index, cast);
    });
  }

  #parseLineCue(nodeId, line, index, cast) {
    const text = String(line || '').trim();
    const cue = {
      id: `${nodeId}-line-${index}`,
      text,
      style: 'narration',
      speaker: null,
      speed: 1,
      portrait: null
    };

    if (!text) return cue;

    if (/^【.+】$/.test(text)) {
      cue.style = 'verse';
      cue.speed = 1.2;
      return cue;
    }

    if (/^\[.+\]/.test(text)) {
      cue.style = 'note';
      cue.speed = 1.1;
    }

    const direct = text.match(/^([^：]{1,14})(?:（[^）]+）)?[:：]\s*(.+)$/);
    if (direct) {
      cue.style = 'dialogue';
      cue.speaker = direct[1].trim();
      cue.text = direct[2].trim();
      cue.speed = 1.3;
      cue.portrait = this.#resolvePortrait(cue.speaker, cast);
      return cue;
    }

    const dialogueByVerb = new RegExp(`^([^，。：“”]{1,14})(?:${DIALOGUE_VERBS.join('|')})[:：]?`);
    const verbMatch = text.match(dialogueByVerb);
    if (verbMatch && /“.+”/.test(text)) {
      cue.style = 'dialogue';
      cue.speaker = verbMatch[1].trim();
      const quote = text.match(/“([^”]+)”/);
      cue.text = quote ? `“${quote[1]}”` : text;
      cue.speed = 1.25;
      cue.portrait = this.#resolvePortrait(cue.speaker, cast);
      return cue;
    }

    if (/^“.+”$/.test(text)) {
      cue.style = 'dialogue';
      cue.speed = 1.18;
    }

    return cue;
  }

  #resolvePortrait(speaker, cast) {
    if (!speaker || !Array.isArray(cast)) return null;
    const target = cast.find((item) => {
      const aliases = Array.isArray(item.aliases) ? item.aliases : [];
      const keys = [item.name, ...aliases].filter(Boolean);
      return keys.some((key) => speaker.includes(key) || key.includes(speaker));
    });
    return target?.portrait || null;
  }
}
