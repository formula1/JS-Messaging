import StreamResponder from "./router-messages/stream";

import {
  createNotExpectingIDError,
  createDuplicateRegisterError,
  createNonStreamResponder,
} from "./errors";

import { IMessage, IAbortableInitiator } from "../structures.shared";

import { IMessageState, IMessageResponder } from "./structures";
import { METHODS } from "../constants";

class ResponderManager {
  private responders: Map<string, IMessageResponder & IAbortableInitiator> = new Map<string, IMessageResponder & IAbortableInitiator>();

  public abort(message: IMessage): Promise<IMessageState> {
    try {
      const responder = this.requireMessage(message);
      this.responders.delete(message.id);
      (<IMessageResponder & IAbortableInitiator> responder).abort();
      responder.isEnded = true;
      return Promise.resolve({
        message: message,
        isEnded: true,
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public streamPush(message: IMessage): Promise<IMessageState> {
    try {
      const maybeStream = this.requireMessage(message);
      if (maybeStream.initiator.method !== METHODS.STREAM_START) {
        throw createNonStreamResponder(message);
      }
      (<StreamResponder> maybeStream).push(message.data);
      return Promise.resolve({
        message: message,
        isEnded: true,
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public streamEnd(message: IMessage): Promise<IMessageState> {
    try {
      const maybeStream = this.requireMessage(message);
      if (maybeStream.initiator.method !== METHODS.STREAM_START) {
        throw createNonStreamResponder(message);
      }
      (<StreamResponder> maybeStream).push(null);
      maybeStream.isEnded = true;
      this.responders.delete(message.id);
      return Promise.resolve({
        message: message,
        isEnded: true,
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public cleanupResponder(message: IMessage): (IMessageResponder & IAbortableInitiator) | null {
    const messageid = message.id;
    if (message.method === METHODS.TRIGGER) {
      return;
    }
    if (!this.responders.has(messageid)) {
      // we are all clean, no errors necessary
      return;
    }
    let responder = this.responders.get(messageid);
    if (
      message.method === METHODS.STREAM_START &&
      !(<StreamResponder> responder).streamEnded &&
      responder.isEnded
    ) {
      return;
    }

    this.responders.delete(messageid);
    return responder;
  }

  public guardResponder(message: IMessage) {
    if (this.responders.has(message.id)) {
      throw createDuplicateRegisterError(message);
    }
  }

  public registerResponder(message, responder) {
    switch (message.method) {
      case METHODS.REQUEST:
      case METHODS.STREAM_START:
        return this.responders.set(message.id, responder);
      default:
        // case METHODS.TRIGGER:
        // This should never be anything but a listenable message
        // since createResponder guards it otherwise
        return;
    }
  }

  private requireMessage(message): IMessageResponder {
    if (!this.responders.has(message.id)) {
      throw createNotExpectingIDError(message);
    }
    return this.responders.get(message.id);
  }
}

export default ResponderManager;
