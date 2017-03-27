import { Promise } from "es6-promise";
import { IAbortableInitiator, IMessage } from "../../structures.shared";
import { Writable } from "stream";

class RequestPromiseWritable extends Writable {
  public ret: Array<any>;
  public errorTriggered: any = false;
  public ended: boolean = false;
  private owner: IAbortableInitiator;
  constructor(owner: IAbortableInitiator) {
    super({ objectMode : true });
    this.owner = owner;
    this.ret = [];
    this.once("error", this.errorListener = this.errorListener.bind(this));
    this.once("finish", this.finishListener = this.finishListener.bind(this));
  }
  public abort() {
    this.owner.abort();
  }
  public toPromise(): Promise<any> & IAbortableInitiator {
    const p: Promise<any> = new Promise((res, rej) => {
      this.once("promise-finish", function(){
        if (this.errorTriggered) {
          return rej(this.errorTriggered);
        } else {
          res(this.ret[0]);
        }
      });
    });
    (<Promise<any> & IAbortableInitiator> p).abort = this.abort.bind(this);
    return (<Promise<any> & IAbortableInitiator> p);
  }
  public _write(data: IMessage, encoding, callback) {
    if (data.error) {
      this.emit("error", data.data);
    } else {
      this.ret.push(data.data);
    }
    this.end();
    callback();
  }
  private finishListener() {
    this.ended = true;
    this.removeListener("error", this.errorListener);
    this.emit("promise-finish");
  }
  private errorListener(e) {
    this.errorTriggered = e;
    this.ended = true;
    this.removeListener("finish", this.finishListener);
    this.emit("promise-finish");
  }
}

export default RequestPromiseWritable;
