import { METHODS } from "../constants";
import { IMessage } from "../structures.shared";

export const ROUTE_CAPTURED = "stop route";

interface IRoutedMessageHolder {
  routedMessage: IMessage;
}

const VALID_METHODS = Object.keys(METHODS);
export function createInvalidMethodError (message: IMessage): IRoutedMessageHolder & Error {
  const error = new Error(`Invalid method ${message.method} valid methods are ${VALID_METHODS}`);
  (<IRoutedMessageHolder & Error> error).routedMessage = message;
  return <IRoutedMessageHolder & Error> error;
}

export function createNotExpectingIDError (message: IMessage): IRoutedMessageHolder & Error {
  const error = new Error(`message ${message.id} was not expected for method ${message.method}`);
  (<IRoutedMessageHolder & Error> error).routedMessage = message;
  return <IRoutedMessageHolder & Error> error;
}

export function createDuplicateRegisterError (message: IMessage): IRoutedMessageHolder & Error {
  const error = new Error(`message ${message.id} has already been registered`);
  (<IRoutedMessageHolder & Error> error).routedMessage = message;
  return <IRoutedMessageHolder & Error> error;
}

export function createNonStreamResponder (message: IMessage): IRoutedMessageHolder & Error {
  const error = new Error(`message ${message.id} targets a non stream responder`);
  (<IRoutedMessageHolder & Error> error).routedMessage = message;
  return <IRoutedMessageHolder & Error> error;
}

export function createAlreadyEndedError (message: IMessage): IRoutedMessageHolder & Error {
  const error = new Error(`message ${message.id} has already ended`);
  (<IRoutedMessageHolder & Error> error).routedMessage = message;
  return <IRoutedMessageHolder & Error> error;
}
