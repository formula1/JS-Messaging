import { IMessage, IRawSend } from "../../structures.shared";
import { ITriggerResponder } from "../structures";
import { createAlreadyEndedError } from "../errors";

class TriggerResponder implements ITriggerResponder {
  public isEnded = false;
  public initiator: IMessage;
  private owner: IRawSend;
  constructor(initiator: IMessage, owner: IRawSend) {
    this.initiator = initiator;
    this.owner = owner;
  }
  public capture() {
    if (this.isEnded) {
      throw createAlreadyEndedError(this.initiator);
    }
    this.isEnded = true;
    return;
  }
}

export default TriggerResponder;
