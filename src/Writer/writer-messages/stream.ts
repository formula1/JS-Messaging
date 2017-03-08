import { IAbortableInitiator, IMessage, IRawSend } from "../../structures.shared";
import { Duplex, Transform } from "stream";

import { METHODS } from "../../constants";

class RequestStream extends Duplex implements IAbortableInitiator {
  private owner: MessageWritableStream;
  constructor(owner: MessageWritableStream) {
    super({
      readableObjectMode : true,
      writableObjectMode : true,
      allowHalfOpen: false,
    });
    this.owner = owner;
    this.wrap(owner);
    this.on("finish", () => {
      this.owner.finish();
    });
  }

  public _write(object, encoding, callback) {
    this.owner.consumeData(object);
    callback();
  }
  public abort() {
    this.owner.abort();
  }
}

class MessageWritableStream extends Transform implements IAbortableInitiator {
  private initiator: IMessage;
  private owner: IAbortableInitiator & IRawSend;
  private alreadyEnded = false;
  constructor(initiator: IMessage, owner: IAbortableInitiator & IRawSend) {
    super({
      readableObjectMode : true,
      writableObjectMode : true,
    });
    this.owner = owner;

    this.initiator = initiator;
  }
  public toStream() {
    return new RequestStream(this);
  }
  public finish() {
    if (this.endGuard()) {
      return;
    }
    this.rawSend({
      data : null,
      error: false,
      id : this.initiator.id,
      method : METHODS.STREAM_END,
      path : this.initiator.path,
    });
    this.push(null);
  }

  public consumeData(data) {
    if (this.alreadyEnded) {
      return;
    }
    this.rawSend({
      data : data,
      error: false,
      id : this.initiator.id,
      method : METHODS.STREAM_PART,
      path : this.initiator.path,
    });
  }
  public abort() {
    if (this.endGuard()) {
      return;
    }
    this.owner.abort();
    this.push(null);
  }
  protected _transform(message: IMessage, encoding, callback) {
    if (message.method === METHODS.STREAM_END) {
      if (!this.endGuard()) {
        this.push(null);
      }
      callback();
      return;
    }
    if (message.error) {
      this.emit("error", message.data);
    } else {
      this.push(message.data);
    }
    callback();
  }
  private rawSend(message: IMessage) {
    this.owner.rawSend(message);
  }
  private endGuard() {
    if (this.alreadyEnded) {
      return true;
    }
    this.alreadyEnded = true;
    return false;
  }
}

export default MessageWritableStream;
