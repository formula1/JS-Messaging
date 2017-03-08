import { strEnum } from "./util";

const LISTENABLE_METHODS = strEnum([
  "TRIGGER",
  "REQUEST",
  "STREAM_START",
  "ALL",
]);

type LISTENABLE_METHODS = keyof typeof LISTENABLE_METHODS;

export {
  LISTENABLE_METHODS
};

const METHODS = strEnum([
  "TRIGGER",
  "REQUEST",
  "STREAM_START",
  "STREAM_PART",
  "STREAM_END",
  "ABORT",
]);

type METHODS = keyof typeof METHODS;

export { METHODS }
