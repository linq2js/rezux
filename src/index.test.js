import { renderHook, act, cleanup } from "@testing-library/react-hooks";
import rezux from "./index";

const delay = (ms = 0, value) =>
  new Promise((resolve) => setTimeout(resolve, ms, value));

const INCREASE_ACTION = "increase";
const DECREASE_ACTION = "decrease";
const CounterStoreFunction = (state = 1, action, by = 1) => {
  switch (action) {
    case INCREASE_ACTION:
      return state + by;
    case DECREASE_ACTION:
      return state - by;
    default:
      return state;
  }
};
const CounterStoreObject = {
  initial: 1,
  [INCREASE_ACTION]: (state, by = 1) => state + by,
  [DECREASE_ACTION]: (state, by = 1) => state - by,
};

afterEach(cleanup);

beforeEach(() => {
  delete CounterStoreFunction.__store;
  delete CounterStoreObject.__store;
});

async function counterStoreTests(result) {
  act(() => result.current.dispatch(INCREASE_ACTION));

  expect(result.current.state()).toBe(2);

  act(() => result.current.dispatch(DECREASE_ACTION));

  expect(result.current.state()).toBe(1);

  act(() => result.current.dispatch(DECREASE_ACTION, 2));

  expect(result.current.state()).toBe(-1);
}

test("store can be function", () => {
  const { result } = renderHook(() => rezux(CounterStoreFunction));

  counterStoreTests(result);
});

test("store can be reducer list", () => {
  const { result } = renderHook(() => rezux(CounterStoreObject));

  counterStoreTests(result);
});

test("wait for future action dispatching", async () => {
  const callback = jest.fn();
  const epic = async (_, { any }) => {
    const [r1] = await any(INCREASE_ACTION);
    callback(r1);
    const [r2] = await any(DECREASE_ACTION);
    callback(r2);
  };
  const { result } = renderHook(() => rezux(CounterStoreFunction));
  result.current.dispatch(epic);

  await act(async () => {
    result.current.dispatch(INCREASE_ACTION, 5);
    result.current.dispatch(INCREASE_ACTION, 5);
    result.current.dispatch(INCREASE_ACTION, 5);
    result.current.dispatch(INCREASE_ACTION, 5);
    await delay();
  });

  expect(callback).toBeCalledTimes(1);

  await act(async () => {
    result.current.dispatch(DECREASE_ACTION, 6);
    result.current.dispatch(DECREASE_ACTION, 6);
    await delay();
  });

  expect(callback).toBeCalledTimes(2);
  expect(callback.mock.calls).toEqual([[5], [6]]);
});
