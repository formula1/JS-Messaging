import { EventEmitter } from "events";
import { Transform, Writable } from "stream";
import { IMessage } from "../structures.shared";

class MessageWriterRouter {
  private expectedReturns: Map<string, Transform | Writable> = new Map<string, Transform | Writable>();
  public canHandleMessage(message: IMessage): boolean {
    return this.expectedReturns.has(message.id);
  }
  public handleIncomingMessage(message: IMessage): void {
    this.expectedReturns.get(message.id).write(message);
  }
  public handleOutgoingMessage(messageid: string, messageHandle: Writable | Transform) {
    this.expectedReturns.set(messageid, messageHandle);
    (<EventEmitter> messageHandle).once("finish", () => {
      this.expectedReturns.delete(messageid);
    });
  }
}

export default MessageWriterRouter;
