
import { EventEmitter } from "events";

class Readable extends EventEmitter {
  pipe(): void {}
  read(): any {}
  destroy(): void {}

  get readable(): boolean {
    return true;
  }

  get readableObjectMode(): boolean {
    return false;
  }

  get destroyed(): boolean {
    return false;
  }
}

export { Readable };
