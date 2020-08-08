import { useState, useRef, useEffect } from "react";
const noop = () => {};
export default function (reducer, selector) {
  const store = initStore(reducer),
    ref = useRef({});
  Object.assign(ref.current, {
    prev: typeof selector === "function" ? selector(store) : store,
    refresh: useState()[1],
    hook: (context) =>
      store.subscribe(() => {
        const next = typeof selector === "function" ? selector(store) : store,
          comparer = (key) => next[key] === context.prev[key];
        if (
          context.unmount ||
          next === context.prev ||
          (typeof next === "object" &&
            !Array.isArray(next) &&
            typeof context.prev === "object" &&
            !Array.isArray(context.prev) &&
            Object.keys(next).every(comparer) &&
            Object.keys(context.prev).every(comparer))
        )
          return;
        context.refresh({});
      }),
  });
  useEffect(() => () => (ref.current.unount = true), []);
  useEffect(() => ref.current.hook(ref.current), [reducer]);
  return ref.current.prev;
}
function initStore(reducer) {
  if (reducer.__store) return reducer.__store;
  let current =
      typeof reducer === "function"
        ? reducer(undefined, "@@init")
        : reducer.initial,
    temp,
    actionCache = new Map(),
    allSubscriptions = new Map(),
    getSubscriptions = (action) => {
      let subscriptions = allSubscriptions.get(action);
      if (!subscriptions)
        allSubscriptions.set(action, (subscriptions = new Set()));
      return subscriptions;
    },
    changingSubscriptions = getSubscriptions(),
    wrapDispatching = (args, func) => {
      let isAsync = false;
      try {
        const result = func();
        if (result && typeof result.then === "function") {
          isAsync = true;
          return result.finally(() => wrapDispatching(args, noop));
        }
        return result;
      } finally {
        if (!isAsync) {
          getSubscriptions(args.action).forEach((x) => x(args));
          getSubscriptions("*").forEach((x) => x(args));
        }
      }
    },
    store = (reducer.__store = Object.assign(
      (action) =>
        actionCache.get(action) ||
        ((temp = (payload) => store.dispatch(action, payload)),
        actionCache.set(action, temp),
        temp),
      {
        state: () => current,
        subscribe(subscription, action) {
          const subscriptions = getSubscriptions(action);
          subscriptions.add(subscription);
          return () => subscriptions.delete(subscription);
        },
        all(...actions) {
          return new Promise((resolve) => {
            const results = new Map();
            new Set(actions).forEach((action, key, set) => {
              const unsubscribe = store.subscribe(({ payload }) => {
                unsubscribe();
                results.set(action, payload);
                set.delete(action);
                !set.size && resolve(actions.map((x) => results.get(x)));
              }, action);
            });
          });
        },
        any: (...actions) =>
          new Promise((resolve) => {
            const unsubscribes = [];
            new Set(actions).forEach((action) => {
              const unsubscribe = store.subscribe(({ payload }) => {
                unsubscribes.forEach((x) => x());
                resolve([payload, action]);
              }, action);
              unsubscribes.push(unsubscribe);
            });
          }),
        dispatch(action, payload) {
          const args = { store, action, payload };
          return wrapDispatching(args, () => {
            if (typeof action === "function") return action(payload, store);
            const next =
              typeof reducer === "function"
                ? reducer(current, action, payload)
                : reducer[action](current, payload);
            if (next === current) return;
            current = next;
            changingSubscriptions.forEach((x) => x(args));
          });
        },
      }
    ));
  return store;
}
