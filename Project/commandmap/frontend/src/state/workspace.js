import { MAX_HISTORY } from '../data/constants.js';

// The workspace holds every open scenario in memory. Nothing is stored anywhere else:
// the user's own files are the only permanent storage.

export function initWorkspace(firstScenario) {
  return {
    scenarios: { [firstScenario.scenarioId]: firstScenario },
    order: [firstScenario.scenarioId],
    activeId: firstScenario.scenarioId,
    saved: { [firstScenario.scenarioId]: firstScenario.metadata.lastModified },
    past: [],
    future: [],
    lastEdit: null,
  };
}

export const activeScenario = (state) => state.scenarios[state.activeId];

export const isDirty = (state, id = state.activeId) =>
  state.scenarios[id] && state.saved[id] !== state.scenarios[id].metadata.lastModified;

function activate(state, id) {
  return { ...state, activeId: id, past: [], future: [], lastEdit: null };
}

export function workspaceReducer(state, action) {
  switch (action.type) {
    case 'new': {
      const s = action.scenario;
      return activate(
        {
          ...state,
          scenarios: { ...state.scenarios, [s.scenarioId]: s },
          order: [...state.order, s.scenarioId],
          saved: { ...state.saved, [s.scenarioId]: s.metadata.lastModified },
        },
        s.scenarioId,
      );
    }

    case 'open':
      return state.scenarios[action.id] ? activate(state, action.id) : state;

    case 'import': {
      const s = action.scenario;
      const exists = Boolean(state.scenarios[s.scenarioId]);
      return activate(
        {
          ...state,
          scenarios: { ...state.scenarios, [s.scenarioId]: s },
          order: exists ? state.order : [...state.order, s.scenarioId],
          saved: { ...state.saved, [s.scenarioId]: s.metadata.lastModified },
        },
        s.scenarioId,
      );
    }

    case 'edit': {
      const current = state.scenarios[state.activeId];
      const changed = action.fn(current);
      if (changed === current) return state;
      const next = { ...changed, metadata: { ...changed.metadata, lastModified: action.iso } };

      let { past, future, lastEdit } = state;
      if (!action.transient) {
        const merge =
          action.coalesce && lastEdit && lastEdit.key === action.coalesce && action.now - lastEdit.at < 900;
        if (!merge) {
          past = [...past.slice(-(MAX_HISTORY - 1)), current];
          future = [];
        }
        lastEdit = action.coalesce ? { key: action.coalesce, at: action.now } : null;
      }
      return { ...state, scenarios: { ...state.scenarios, [state.activeId]: next }, past, future, lastEdit };
    }

    // Called once when a drag starts, so the whole drag becomes a single undo step.
    case 'gesture': {
      const current = state.scenarios[state.activeId];
      return {
        ...state,
        past: [...state.past.slice(-(MAX_HISTORY - 1)), current],
        future: [],
        lastEdit: null,
      };
    }

    case 'undo': {
      if (!state.past.length) return state;
      const current = state.scenarios[state.activeId];
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        scenarios: { ...state.scenarios, [state.activeId]: previous },
        past: state.past.slice(0, -1),
        future: [current, ...state.future],
        lastEdit: null,
      };
    }

    case 'redo': {
      if (!state.future.length) return state;
      const current = state.scenarios[state.activeId];
      const [nextScenario, ...rest] = state.future;
      return {
        ...state,
        scenarios: { ...state.scenarios, [state.activeId]: nextScenario },
        past: [...state.past, current],
        future: rest,
        lastEdit: null,
      };
    }

    case 'rename': {
      const target = state.scenarios[action.id];
      if (!target) return state;
      const renamed = { ...target, scenarioName: action.name, metadata: { ...target.metadata, lastModified: action.iso } };
      return { ...state, scenarios: { ...state.scenarios, [action.id]: renamed } };
    }

    case 'duplicate': {
      const copy = action.copy;
      const at = state.order.indexOf(action.id);
      const order = [...state.order];
      order.splice(at + 1, 0, copy.scenarioId);
      return {
        ...state,
        scenarios: { ...state.scenarios, [copy.scenarioId]: copy },
        order,
        saved: { ...state.saved, [copy.scenarioId]: null },
      };
    }

    case 'remove': {
      const { [action.id]: _removed, ...rest } = state.scenarios;
      const order = state.order.filter((id) => id !== action.id);
      let scenarios = rest;
      let nextOrder = order;
      let saved = state.saved;
      let activeId = state.activeId;
      if (order.length === 0) {
        scenarios = { [action.fallback.scenarioId]: action.fallback };
        nextOrder = [action.fallback.scenarioId];
        saved = { [action.fallback.scenarioId]: action.fallback.metadata.lastModified };
        activeId = action.fallback.scenarioId;
      } else if (state.activeId === action.id) {
        activeId = order[0];
      }
      const next = { ...state, scenarios, order: nextOrder, saved };
      return activeId === state.activeId ? next : activate(next, activeId);
    }

    case 'markSaved':
      return { ...state, saved: { ...state.saved, [action.id]: action.stamp } };

    default:
      return state;
  }
}
