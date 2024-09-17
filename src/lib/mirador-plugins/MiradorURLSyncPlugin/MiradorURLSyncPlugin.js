import { takeEvery, select, put } from "redux-saga/effects";
import {
  getCanvas,
  getCanvases,
  getWindowIds,
} from "mirador/dist/es/src/state/selectors";
import { setCanvas } from "mirador/dist/es/src/state/actions";

/**
 * Add a canvasId query parameter to the URL
 * @param {String} canvasId Canvas id from manifest
 */
function insertCanvasIdIntoURL(canvasId) {
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set("canvasId", canvasId);
  window.history.replaceState(
    {},
    "",
    `${window.location.pathname}?${searchParams.toString()}`
  );
  window.dispatchEvent(new PopStateEvent("popstate")); // manually trigger popstate event
}

/**
 * Will be fired every time the SET_CANVAS action is dispatched
 * This will run on first load, and works in conjunction with a canvasId initialisation option
 * @param {Object} action Payload object
 */
function* onCanvasChange(action) {
  const { canvasId, windowId } = action;
  const windowIds = yield select(getWindowIds);

  // Disregard events from other windows
  // (assumes we: start with/care about, one/the first window)
  // I.e. if user adds resource, SET_CANVAS will be dispatched from here
  // but we don't want to update the URL on those actions
  if (windowId !== windowIds[0]) return;

  // Resolve potentially broken canvasId to first canvas
  const targetCanvas = yield select(getCanvas, { canvasId, windowId });

  if (!targetCanvas) {
    const availableCanvases = yield select(getCanvases, { windowId });
    yield put(setCanvas(windowId, availableCanvases[0].id));
  }

  // Update the URL
  insertCanvasIdIntoURL(action.canvasId);
}

const rootSaga = function* () {
  yield takeEvery("mirador/SET_CANVAS", onCanvasChange);
};

export default {
  component: () => null, // No UI component
  mode: "add",
  saga: rootSaga,
  target: "Window",
};
