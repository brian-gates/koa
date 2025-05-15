declare module "parseurl" {
  function parse(req: any): {
    pathname: string;
    path: string | null;
    search: string | null;
    query: string | null;
  };
  export = parse;
}
