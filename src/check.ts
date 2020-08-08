import { Action } from "./index";

const epic: Action<any, any> = async (_, { any }) => {
  const [a, r1] = await any("aaa");
  const [, r2] = await any("bbb");
};
