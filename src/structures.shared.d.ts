import { METHODS } from "./constants";

interface IMessage {
  id: string;
  method: METHODS;
  path: string;
  data: any;
  error: boolean;
}

export {IMessage};

interface IRawSend {
  rawSend(message: IMessage): void;
}

export { IRawSend };

interface IAbortableInitiator {
  abort(): void;
}

export { IAbortableInitiator };
