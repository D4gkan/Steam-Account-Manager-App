import { describe, expect, it } from "vitest";
import { initialSelectionState, selectionReducer } from "../src/renderer/state/store";

describe("selectionReducer", () => {
  it("ignores invalid reorder indexes without corrupting selection", () => {
    const state = { ...initialSelectionState, websiteSelectionOrder: ["w1", "w2"] };
    for (const index of [-1, 2, 100, NaN, 0.5]) {
      expect(selectionReducer(state, { type: "MOVE_WEBSITE_LEFT", index })).toEqual(state);
      expect(selectionReducer(state, { type: "MOVE_WEBSITE_RIGHT", index })).toEqual(state);
    }
  });
  it("selecting an account makes it the sole launch target", () => {
    let state = selectionReducer(initialSelectionState, { type: "TOGGLE_ACCOUNT_CHECK", accountId: "a1" });
    state = selectionReducer(state, { type: "SELECT_ACCOUNT", accountId: "a2" });
    expect(state.selectedAccountId).toBe("a2");
    expect(state.checkedAccountIds).toEqual(["a2"]);
  });

  it("toggling a website twice returns to unselected with no leftover order", () => {
    let state = selectionReducer(initialSelectionState, { type: "TOGGLE_WEBSITE", websiteId: "w1" });
    state = selectionReducer(state, { type: "TOGGLE_WEBSITE", websiteId: "w1" });
    expect(state.websiteSelectionOrder).toEqual([]);
  });

  it("re-selecting a removed website appends it at the end, not its old position", () => {
    let state = initialSelectionState;
    for (const id of ["w1", "w2", "w3"]) {
      state = selectionReducer(state, { type: "TOGGLE_WEBSITE", websiteId: id });
    }
    state = selectionReducer(state, { type: "REMOVE_WEBSITE", websiteId: "w1" });
    expect(state.websiteSelectionOrder).toEqual(["w2", "w3"]);
    state = selectionReducer(state, { type: "TOGGLE_WEBSITE", websiteId: "w1" });
    expect(state.websiteSelectionOrder).toEqual(["w2", "w3", "w1"]);
  });

  it("move left/right swap adjacent entries and are no-ops at the boundaries", () => {
    let state = initialSelectionState;
    for (const id of ["w1", "w2", "w3"]) {
      state = selectionReducer(state, { type: "TOGGLE_WEBSITE", websiteId: id });
    }
    state = selectionReducer(state, { type: "MOVE_WEBSITE_RIGHT", index: 0 });
    expect(state.websiteSelectionOrder).toEqual(["w2", "w1", "w3"]);
    state = selectionReducer(state, { type: "MOVE_WEBSITE_LEFT", index: 0 });
    expect(state.websiteSelectionOrder).toEqual(["w2", "w1", "w3"]); // no-op at left boundary
  });

  it("clear empties the website selection but leaves account selection untouched", () => {
    let state = selectionReducer(initialSelectionState, { type: "SELECT_ACCOUNT", accountId: "a1" });
    state = selectionReducer(state, { type: "TOGGLE_WEBSITE", websiteId: "w1" });
    state = selectionReducer(state, { type: "CLEAR_WEBSITE_SELECTION" });
    expect(state.websiteSelectionOrder).toEqual([]);
    expect(state.selectedAccountId).toBe("a1");
  });
});
