import { Promise } from "es6-promise";
import { Duplex } from "stream";
import { IMessage, IRawSend } from "../structures.shared";

interface IMessageWriter extends IRawSend {
  trigger(path: string, data: any);
  request(path: string, data: any): Promise<any>;
  stream(path: string, data: any): Duplex;
  returnMessage(message: IMessage): boolean;
}

export { IMessageWriter };
