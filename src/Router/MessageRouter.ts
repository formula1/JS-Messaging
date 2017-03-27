import { IMessage } from "../structures.shared";
import { LISTENABLE_METHODS, METHODS } from "../constants";
import { isFunction } from "../util";
import { Promise } from "es6-promise";

import {
  createInvalidMethodError,
  ROUTE_CAPTURED,
} from "./errors";

import {
  IMessageState,
  IMessageResponder,
  IMessageRouter,
  IRoute,
  TriggerListener, RequestListener, StreamListener,
} from "./structures";
import TriggerResponder from "./router-messages/trigger";
import RequestResponder from "./router-messages/request";
import StreamResponder from "./router-messages/stream";

import * as pathToRegexp from "path-to-regexp";

import ResponderManager from "./ResponderManager";

abstract class MessageRouter implements IMessageRouter {
  private routes: Array<IRoute>;
  private responderManager: ResponderManager = new ResponderManager();
  constructor() {
    this.routes = [];
  }

  public removeRoute(route: IRoute) {
    let i: number = this.routes.indexOf(route);
    if (i > -1) {
      this.routes.splice(i, 1);
    }
  }
  public onTrigger(path: string | RegExp, fn: TriggerListener): IRoute {
    return this.addRoute(
      path instanceof RegExp ? path : pathToRegexp(path),
      LISTENABLE_METHODS.TRIGGER,
      fn,
    );
  }
  public onRequest(path: string | RegExp, fn: RequestListener): IRoute {
    return this.addRoute(
      path instanceof RegExp ? path : pathToRegexp(path),
      LISTENABLE_METHODS.REQUEST,
      fn,
    );
  }
  public onStream(path: string | RegExp, fn: StreamListener): IRoute {
    return this.addRoute(
      path instanceof RegExp ? path : pathToRegexp(path),
      LISTENABLE_METHODS.STREAM_START,
      fn,
    );
  }
  public use(path: string | RegExp | Function, fn?: Function): IRoute {
    if (isFunction(path)) {
      return this.addRoute(/.*/, LISTENABLE_METHODS.ALL, path);
    }
    return this.addRoute(
      path instanceof RegExp ? path : pathToRegexp(path),
      LISTENABLE_METHODS.ALL,
      fn,
    );
  }

  public routeMessage(message: IMessage): Promise<IMessageState> {
    switch (message.method) {
      case METHODS.ABORT: return this.responderManager.abort(message);
      case METHODS.STREAM_PART:
        // Might want to check if a particular ID had been aborted
        // This can be done much cleaner if we tell the otherside what ID to use (based off timestamp)
        // in this manner they can never use old IDs.
        return this.responderManager.streamPush(message);
      case METHODS.STREAM_END: return this.responderManager.streamEnd(message);
      default:
        /*
          TODO: Handle Abort logic during routing
        */
        let responder: IMessageResponder;
        try {
          this.responderManager.guardResponder(message);
          responder = this.createResponder(message);
          this.responderManager.registerResponder(message, responder);
        } catch (e) {
          return Promise.reject(e);
        }
        return this.routeResponder(message, responder);
    }
  }
  public abstract rawSend(IMessage): void;

  private routeResponder(message, responder): Promise<IMessageState> {
    return this.routes.reduce(function(p, route): Promise<any>{
      if (route.method !== LISTENABLE_METHODS.ALL) {
        if (route.method !== message.method) {
          return p;
        }
      }
      let matches = route.path.exec(message.path);
      if (!matches) {
        return p;
      }
      return p.then(function(){
        return route.fn(message.data, responder, message);
      }).then(function(){
        if (responder && responder.isEnded) {
          throw ROUTE_CAPTURED;
        }
      });
    }, <Promise<any>> Promise.resolve()).then(() => {
      this.responderManager.cleanupResponder(message);
      return {
        message: message,
        isEnded: false,
        responder: responder,
      };
    }, (err) => {
      this.responderManager.cleanupResponder(message);
      if (err === ROUTE_CAPTURED) {
        responder.isEnded = true;
        return {
          message: message,
          isEnded: responder.isEnded,
          responder: responder,
        };
      }
      throw {
        message: message,
        isEnded: responder.isEnded,
        responder: responder,
        error: err,
      };
    });
  }

  private createResponder(message: IMessage): IMessageResponder {
    switch (message.method) {
      case LISTENABLE_METHODS.TRIGGER :
        return new TriggerResponder(message, {
          rawSend : this.rawSend.bind(this),
        });
      case LISTENABLE_METHODS.REQUEST : {
        return new RequestResponder(message, {
          rawSend : this.rawSend.bind(this),
        });
      }
      case LISTENABLE_METHODS.STREAM_START : {
        return new StreamResponder(message, {
          rawSend : this.rawSend.bind(this),
        });
      }
      default :
        throw createInvalidMethodError(message);
    }
  }
  private addRoute(path: RegExp, method: LISTENABLE_METHODS, fn: Function) {
    let r: IRoute = {
      fn : fn,
      method : method,
      path : path,
    };
    this.routes.push(r);
    return r;
  }
}

export default MessageRouter;

export function defaultErrorHandler(routeError: any) {
  if (!isMessageState(routeError)) {
    return;
  }
  const { responder, error } = routeError;
  if (
    error && (
      responder instanceof RequestResponder ||
      responder instanceof StreamResponder
    )
  ) { responder.reject(error); }
}

function isMessageState(routeError: any): routeError is IMessageState {
  if (typeof routeError !== "object") {
    return false;
  }
  if (["responder", "message"].some(function(key){
    return !(key in routeError);
  })) {
    return false;
  }
  return true;
}
