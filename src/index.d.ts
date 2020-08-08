export default function <TState>(
  store: StoreFunction<TState> | StoreObject<TState>
): Store<TState>;
export default function <TState, TResult>(
  store: StoreFunction<TState> | StoreObject<TState>,
  selector: (store: Store<TState>) => TResult
): TResult;

type StoreFunction<TState> = (
  state: TState,
  action?: string,
  payload?: any
) => TState;

type StoreObject<TState> = {
  initial: TState;
  [key: string]: TState | ((state?: TState, payload?: any) => TState);
};

interface Store<TState> extends Function {
  subscribe(
    subscription: DispatchSubscription,
    action: string | Action<any, any, any>
  ): Unsubscribe;
  subscribe(subscription: ChangeSubscription): Unsubscribe;
  dispatch(action: string, payload?: any);
  dispatch<TAction extends Action<any, any, any>>(
    action: TAction,
    payload?: any
  ): ReturnType<TAction>;
  all(...actions: (string | Action<any, any, any>)[]): Promise<any[]>;
  any(
    ...actions: (string | Action<any, any, any>)[]
  ): Promise<[string | Function, any]>;

  /**
   * get current state
   */
  state(): TState;
}

export type Action<TPayload, TState, TResult = any> = (
  payload?: TPayload,
  store?: Store<TState>
) => TResult;

interface SubscriptionArgs {
  store: Store<any>;
  action: string | Function;
  payload: any;
}

type ChangeSubscription = (args: SubscriptionArgs) => any;

type DispatchSubscription = (args: SubscriptionArgs) => any;

type Unsubscribe = () => void;
