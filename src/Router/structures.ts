import { Duplex } from "stream";
import { IMessage, IAbortableInitiator } from "../structures.shared";
import { LISTENABLE_METHODS } from "../constants";

interface IMessageResponder {
  initiator: IMessage;
  isEnded: boolean;
}

interface IRejectableResponder {
  reject(error: any): void;
}

interface ICaptureResponder {
  capture(): void;
}

interface ITriggerResponder extends ICaptureResponder,  IMessageResponder {}

interface IRequestResponder extends IAbortableInitiator, IMessageResponder {
  resolve(data: any): void;
}

interface IStreamResponder extends
  Duplex,
  IAbortableInitiator,
  ICaptureResponder,
  IMessageResponder {}

export {
  ITriggerResponder, IRequestResponder, IStreamResponder,
  IRejectableResponder, IMessageResponder,
};

type TriggerListener = (data: any, responder: ITriggerResponder) => any;
type RequestListener = (data: any, responder: IRequestResponder) => any;
type StreamListener = (data: any, responder: IStreamResponder) => any;

export {
  TriggerListener, RequestListener, StreamListener
}

interface IRoute {
  path: RegExp;
  method: LISTENABLE_METHODS;
  fn: Function;
}

interface IMessageState extends IMessageResponder {
  message: IMessage;
  responder: IMessageResponder;
  error?: any;
}

interface IMessageRouter {
  onTrigger(path: string | RegExp, callback: TriggerListener): IRoute;
  onRequest(path: string | RegExp, callback: RequestListener): IRoute;
  onStream(path: string | RegExp, callback: StreamListener): IRoute;
  use(path: string | RegExp | Function, callback?: Function): IRoute;
  removeRoute(route: IRoute);
  routeMessage(message: IMessage): Promise<IMessageState>;
}

export { IMessageState, IRoute, IMessageRouter };
