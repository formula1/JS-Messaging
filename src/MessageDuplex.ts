import {IMessage } from "./structures.shared";
import { IMessageWriter } from "./Writer/structures";
import { IMessageRouter } from "./Router/structures";
import MessageRouter from "./Router/MessageRouter";
import MessageWriter from "./Writer/MessageWriter";
import { EventEmitter } from "events";
import { Duplex } from "stream";
import { createIsDetroyedError } from "./errors";

enum DUPLEX_STATES {
  READY,
  PAUSED,
  DESTROYED,
}

class DuplexWriter extends MessageWriter {
  private owner: MessageDuplex;
  constructor(owner: MessageDuplex) {
    super();
    this.owner = owner;
  }
  public rawSend(message: IMessage) {
    this.owner.rawSend(message);
  }
}
class DuplexRouter extends MessageRouter {
  private owner: MessageDuplex;
  constructor(owner: MessageDuplex) {
    super();
    this.owner = owner;
  }
  public rawSend(message: IMessage) {
    this.owner.rawSend(message);
  }
}

abstract class MessageDuplex extends Duplex implements IMessageWriter, IMessageRouter {
  public ee: EventEmitter;
  private writer: DuplexWriter;
  private router: DuplexRouter;
  private state: DUPLEX_STATES;
  constructor() {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
      allowHalfOpen: false,
    });
    this.ee = new EventEmitter();
    this.writer = new DuplexWriter(this);
    this.router = new DuplexRouter(this);
  }
  public _write(message: IMessage, encoding: string, callback) {
    this.guardDestroyed();
    if (!this.returnMessage(message)) {
      this.routeMessage(message).then(function(){
        callback();
      }, function(routeError){
        callback();
      });
    }
  }
  public _read() {
    return false;
  }
  public onTrigger(path, fn) {
    this.guardDestroyed();
    return this.router.onTrigger(path, fn);
  }
  public onRequest(path, fn) {
    this.guardDestroyed();
    return this.router.onRequest(path, fn);
  }
  public onStream(path, fn) {
    this.guardDestroyed();
    return this.router.onStream(path, fn);
  }
  public use(path, fn) {
    this.guardDestroyed();
    return this.router.use(path, fn);
  }
  public removeRoute(route) {
    this.guardDestroyed();
    this.router.removeRoute(route);
  }
  public routeMessage(message) {
    return this.router.routeMessage(message);
  }
  public returnMessage(message): boolean {
    return this.writer.returnMessage(message);
  }
  public trigger(path, data) {
    this.guardDestroyed();
    return this.writer.trigger(path, data);
  }
  public request(path, data) {
    this.guardDestroyed();
    return this.writer.request(path, data);
  }
  public stream(path, data) {
    this.guardDestroyed();
    return this.writer.stream(path, data);
  }
  public destroy() {
    if (this.state === DUPLEX_STATES.DESTROYED) {
      return;
    }
    this.end();
    this.push(null);
    this.state = DUPLEX_STATES.DESTROYED;
    this.emit("destroy");
  }
  public rawSend(message: IMessage) {
    if (this.state === DUPLEX_STATES.DESTROYED) {
      return;
    }
    this.push(message);
  }
  private guardDestroyed() {
    if (this.state === DUPLEX_STATES.DESTROYED) {
      throw createIsDetroyedError();
    }
  }

};

export default MessageDuplex;
