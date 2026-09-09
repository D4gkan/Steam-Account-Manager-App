/**
 * Temporary, session-only, per-manager-run selection state. Never persisted
 * to disk and never restored across app restarts (per spec section 4:
 * "Website selection is temporary... Do not implement... last-used website
 * restoration.").
 */
export interface SelectionState {
  selectedAccountId: string | null; // sole click-to-select launch target
  checkedAccountIds: string[]; // multi-select additions
  websiteSelectionOrder: string[]; // website IDs, click order
}

export const initialSelectionState: SelectionState = {
  selectedAccountId: null,
  checkedAccountIds: [],
  websiteSelectionOrder: [],
};

export type SelectionAction =
  | { type: "SELECT_ACCOUNT"; accountId: string }
  | { type: "TOGGLE_ACCOUNT_CHECK"; accountId: string }
  | { type: "TOGGLE_WEBSITE"; websiteId: string }
  | { type: "REMOVE_WEBSITE"; websiteId: string }
  | { type: "MOVE_WEBSITE_LEFT"; index: number }
  | { type: "MOVE_WEBSITE_RIGHT"; index: number }
  | { type: "CLEAR_WEBSITE_SELECTION" };

export function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case "SELECT_ACCOUNT":
      return { ...state, selectedAccountId: action.accountId, checkedAccountIds: [action.accountId] };

    case "TOGGLE_ACCOUNT_CHECK": {
      const isChecked = state.checkedAccountIds.includes(action.accountId);
      return {
        ...state,
        checkedAccountIds: isChecked
          ? state.checkedAccountIds.filter((id) => id !== action.accountId)
          : [...state.checkedAccountIds, action.accountId],
      };
    }

    case "TOGGLE_WEBSITE": {
      const exists = state.websiteSelectionOrder.includes(action.websiteId);
      if (exists) {
        // Deselecting removes it and implicitly renumbers the rest, since
        // order is derived purely from array position.
        return {
          ...state,
          websiteSelectionOrder: state.websiteSelectionOrder.filter((id) => id !== action.websiteId),
        };
      }
      // Selecting (including re-selecting after removal) appends to the end.
      return { ...state, websiteSelectionOrder: [...state.websiteSelectionOrder, action.websiteId] };
    }

    case "REMOVE_WEBSITE":
      return {
        ...state,
        websiteSelectionOrder: state.websiteSelectionOrder.filter((id) => id !== action.websiteId),
      };

    case "MOVE_WEBSITE_LEFT": {
      if (!Number.isInteger(action.index) || action.index <= 0 || action.index >= state.websiteSelectionOrder.length) return state;
      const next = [...state.websiteSelectionOrder];
      [next[action.index - 1], next[action.index]] = [next[action.index], next[action.index - 1]];
      return { ...state, websiteSelectionOrder: next };
    }

    case "MOVE_WEBSITE_RIGHT": {
      if (!Number.isInteger(action.index) || action.index < 0 || action.index >= state.websiteSelectionOrder.length - 1) return state;
      const next = [...state.websiteSelectionOrder];
      [next[action.index + 1], next[action.index]] = [next[action.index], next[action.index + 1]];
      return { ...state, websiteSelectionOrder: next };
    }

    case "CLEAR_WEBSITE_SELECTION":
      return { ...state, websiteSelectionOrder: [] };

    default:
      return state;
  }
}
