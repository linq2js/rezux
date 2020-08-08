# Rezux

React state management. One API rule them all.

## Counter App

```jsx harmony
import useStore from "rezux";

// define action types
const INCREASE = "increase";
const DECREASE = "decrease";

// define store, store is just pure function, it works like Redux reducer
const initialState = 1;
const Store = (state = initialState, action, payload = 1) => {
  if (action === INCREASE) return state + payload;
  if (action === DECREASE) return state - payload;
  return state;
};

// display store state
// this component will be re-rendered when store state changed
const CounterValue = () => {
  const count = useStore(Store, (store) => store.state());
  return <h1>{count}</h1>;
};

// dispatch store actions
// this component renders once
const CounterActions = () => {
  // retrieve dispatch method from store
  const { dispatch } = useStore(Store);
  return (
    <>
      <button onClick={() => dispatch(INCREASE)}>Increase</button>
      <button onClick={() => dispatch(INCREASE, 2)}>Increase by 2</button>
      <button onClick={() => dispatch(DECREASE)}>Decrease</button>
    </>
  );
};
```

## Handling state changing and action dispatching

```jsx harmony
import { useEffect } from "react";
import useStore from "rezux";

const Store = () => {};
const handleAnyActionDispatching = () => {};
const handleStateChanging = ({ store }) => {
  localStorage.setItem("appData", JSON.stringify(store.state()));
};
const handleIncreaseActionDispatching = () => {
  console.log("increase");
};

const App = () => {
  const store = useStore(Store);

  useEffect(() => {
    store.subscribe(handleStateChanging);
    store.subscribe(handleAnyActionDispatching, "*");
    store.subscribe(handleIncreaseActionDispatching, "increase");
  }, []);
};
```

## Advanced Usages

### Async dispatching

```jsx harmony
import useStore from "rezux";
const INCREASE = "increase";
const DECREASE = "decrease";
const INCREASE_ASYNC = async (by, store) => {
  await delay(1000);
  store.dispatch(INCREASE, by);
};
// define store, store is just pure function, it works like Redux reducer
const initialState = 1;
const Store = (state = initialState, action, payload = 1) => {
  if (action === INCREASE) return state + payload;
  if (action === DECREASE) return state - payload;
  return state;
};

const CounterActions = () => {
  // retrieve dispatch method from store
  const { dispatch } = useStore(Store);
  return (
    <>
      <button onClick={() => dispatch(INCREASE_ASYNC)}>Increase Async</button>
    </>
  );
};
```

### Listening future action dispatching

```jsx harmony
const SEARCH_PRODUCT = "search_product";
const SEARCH_PRODUCT_SUCCESS = "search_product_success";
const UPDATE_PRODUCT_LIST = "update_product_list";
const CANCEL = "cancel";
const SEARCH_PRODUCT_EPIC = async (_, { dispatch, any }) => {
  // run forever
  while (true) {
    const [keyword] = await any(SEARCH_PRODUCT);
    dispatch(SEARCH_PRODUCT_API, keyword);
    // listen SEARCH_PRODUCT_SUCCESS or CANCEL
    const [payload, action] = await any(SEARCH_PRODUCT_SUCCESS, CANCEL);
    // user cancels search progress before SEARCH_PRODUCT_SUCCESS dispatched
    if (action === CANCEL) {
      // do nothing and continue listening
      continue;
    }
    // update product list when SEARCH_PRODUCT_SUCCESS dispatched
    dispatch(UPDATE_PRODUCT_LIST, payload);
  }
};

const SEARCH_PRODUCT_API = async (keyword, { dispatch }) => {
  const response = await axios("api-url");
  dispatch(SEARCH_PRODUCT_SUCCESS, response.data);
};
```

### Action dispatcher

```jsx harmony
const { increase, decrease } = useStore(Store, (store) => ({
  // store is function, so if you pass action type to store, it returns memoized action dispatcher
  increase: store(INCREASE),
  decrease: store(DECREASE),
}));

increase(100);
decrease(99);
```

### Using reducer map as store declaration

```jsx harmony
const INCREASE = "increase";
const DECREASE = "decrease";
const Store = {
  initial: 1,
  [INCREASE]: (state, by = 1) => state + by,
  [DECREASE]: (state, by = 1) => state - by,
};
```
