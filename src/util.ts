
let counter = 0;
export function uniqueId(): string {
  return Date.now().toString(32) +
    (counter++).toString(32) +
    Math.random().toString(32).substring(2);
};

export function strEnum<T extends string>(o: Array<T>): {[K in T]: K} {
  return o.reduce((res, key) => {
    res[key] = key;
    return res;
  }, Object.create(null));
}

export function isFunction(value): value is Function {
  return typeof value === "function";
}
