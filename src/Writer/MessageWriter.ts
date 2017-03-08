import {
  IMessageWriter,
} from "./structures";
import { IMessage } from "../structures.shared";
import { uniqueId } from "../util";
import RequestPromiseWritable from "./writer-messages/request";
import MessageWritableStream from "./writer-messages/stream";
import { Duplex } from "stream";
import { METHODS } from "../constants";
import MessageWriterRouter from "./MessageWriterRouter";

abstract class MessageWriter implements IMessageWriter {
  private pendingRouter: MessageWriterRouter;
  constructor() {
    this.pendingRouter = new MessageWriterRouter();
  }
  public trigger(path: string, data: any): void {
    this.rawSend({
      data : data,
      error: false,
      id : uniqueId(),
      method : METHODS.TRIGGER,
      path : path,
    });
  }
  public request(path: string, data: any): Promise<any> {
    let id: string = uniqueId();
    let message: IMessage = {
      data : data,
      error: false,
      id : id,
      method : METHODS.REQUEST,
      path : path,
    };
    let reqPromiseWritable = new RequestPromiseWritable({
      abort : this.handleAbort.bind(this, message),
    });
    this.pendingRouter.handleOutgoingMessage(message.id, reqPromiseWritable);
    this.rawSend(message);
    return reqPromiseWritable.toPromise();
  }
  public stream(path, data): Duplex {
    let message: IMessage = {
      data : data,
      error: false,
      id : uniqueId(),
      method : METHODS.STREAM_START,
      path : path,
    };
    let messenger = new MessageWritableStream(message, {
      abort : this.handleAbort.bind(this, message),
      rawSend : this.rawSend.bind(this),
    });
    this.pendingRouter.handleOutgoingMessage(message.id, messenger);
    this.rawSend(message);
    return messenger.toStream();
  }
  public abstract rawSend(message: IMessage): void;
  public returnMessage(message: IMessage): boolean {
    if (!this.pendingRouter.canHandleMessage(message)) {
      return false;
    }
    this.pendingRouter.handleIncomingMessage(message);
    return true;
  }
  private handleAbort(message: IMessage) {
    this.rawSend({
      data : null,
      error: false,
      id : message.id,
      method : METHODS.ABORT,
      path : message.path,
    });
  }
}

export default MessageWriter;
