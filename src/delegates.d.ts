declare module "delegates" {
  interface Delegator {
    method(name: string): Delegator;
    access(name: string): Delegator;
    getter(name: string): Delegator;
    setter(name: string): Delegator;
    fluent(name: string): Delegator;
  }

  function delegate(proto: object, target: string): Delegator;
  export = delegate;
}
