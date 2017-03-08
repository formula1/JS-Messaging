import { IMessage, IRawSend } from "../../structures.shared";
import { IRequestResponder } from "../structures";
import { createAlreadyEndedError } from "../errors";

class RequestResponder implements IRequestResponder {
  public isEnded = false;
  public initiator: IMessage;
  private owner: IRawSend;
  constructor(initiator: IMessage, owner: IRawSend) {
    this.initiator = initiator;
    this.owner = owner;
  }
  public resolve(value) {
    if (this.isEnded) {
      throw createAlreadyEndedError(this.initiator);
    }
    this.isEnded = true;
    this.returnSend({
      data: value,
      error: false,
      id: this.initiator.id,
      method: this.initiator.method,
      path: this.initiator.path,
    });
    return;
  }
  public reject(error) {
    if (this.isEnded) {
      throw createAlreadyEndedError(this.initiator);
    }
    this.isEnded = true;
    this.returnSend({
      error: true,
      data: error,
      id: this.initiator.id,
      method: this.initiator.method,
      path: this.initiator.path,
    });
  }
  public abort() {
    if (this.isEnded) {
      return;
    }
    this.isEnded = true;
  }
  private returnSend(message: IMessage) {
    this.owner.rawSend(message);
  }
}

export default RequestResponder;
