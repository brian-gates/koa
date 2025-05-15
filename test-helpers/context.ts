import { Duplex, Readable, Writable } from "stream";
import Application from "../src/application";

type Request = Partial<Readable> & {
  headers?: Record<string, string>;
  socket?: any;
  [key: string]: any;
};

type Response = Partial<Writable> & {
  _headers?: Record<string, string>;
  socket?: any;
  getHeader?: (k: string) => string | undefined;
  setHeader?: (k: string, v: string) => void;
  removeHeader?: (k: string) => void;
  [key: string]: any;
};

const createContext = (
  req: Request = {},
  res: Response = {},
  app?: Application
) => {
  const socket = new Duplex();
  req = Object.assign({ headers: {}, socket }, Readable.prototype, req);
  res = Object.assign({ _headers: {}, socket }, Writable.prototype, res);
  req.socket.remoteAddress = req.socket.remoteAddress || "127.0.0.1";
  const koaApp = app || new Application();

  res.getHeader = (k) => res._headers?.[k.toLowerCase()];
  res.setHeader = (k, v) => {
    if (res._headers) res._headers[k.toLowerCase()] = v;
  };
  res.removeHeader = (k) => {
    if (res._headers) delete res._headers[k.toLowerCase()];
  };

  return koaApp.createContext(req as any, res as any);
};

export const request = (
  req: Request = {},
  res: Response = {},
  app?: Application
) => createContext(req, res, app).request;

export const response = (
  req: Request = {},
  res: Response = {},
  app?: Application
) => createContext(req, res, app).response;

export default createContext;
