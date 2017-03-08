import { IMessage, IRawSend } from "../../structures.shared";
import { IStreamResponder } from "../structures";
import { Duplex } from "stream";

import { METHODS } from "../../constants";
import { createAlreadyEndedError } from "../errors";

class StreamResponder extends Duplex implements IStreamResponder {
  public isEnded = false;
  public streamEnded = false;
  public initiator: IMessage;
  private owner: IRawSend;
  private sendEnd = true;
  constructor(initiator: IMessage, owner: IRawSend) {
    super({
      readableObjectMode : true,
      writableObjectMode : true,
      allowHalfOpen: false,
    });
    this.initiator = initiator;
    this.once("prefinish", () => {
      this.streamEnded = true;
      this.isEnded = true;
      if (this.sendEnd) {
        this.owner.rawSend({
          data: void 0,
          error: false,
          id : this.initiator.id,
          method : METHODS.STREAM_END,
          path : this.initiator.path,
        });
      }
      this.push(null);
    });
    this.owner = owner;
  }
  public _read() {
    return false;
  }
  public _write(data, encoding, callback) {
    this.owner.rawSend({
      data : data,
      error: false,
      id : this.initiator.id,
      method : METHODS.STREAM_PART,
      path : this.initiator.path,
    });
    callback();
  }
  public capture() {
    if (this.isEnded) {
      throw createAlreadyEndedError(this.initiator);
    }
    this.isEnded = true;
  }
  public abort() {
    if (this.streamEnded) {
      return;
    }
    this.sendEnd = false;
    this.end();
  }
  public reject(error: any) {
    if (this.streamEnded) {
      throw createAlreadyEndedError(this.initiator);
    }
    this.owner.rawSend({
      data : error,
      error : true,
      id : this.initiator.id,
      method : METHODS.STREAM_PART,
      path : this.initiator.path,
    });
    this.end();
  }
}

export default StreamResponder;
