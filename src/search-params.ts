import { URLSearchParams } from "url";

type QueryObject = { [key: string]: string | number | Array<string | number> };

const searchParams = {
  stringify: (obj: QueryObject): string => {
    const searchParams = new URLSearchParams();
    const addKey = (
      k: string,
      v: string | number,
      params: URLSearchParams
    ): void => {
      const val = typeof v === "string" || typeof v === "number" ? v : "";
      params.append(k, String(val));
    };

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        const lgth = value.length;
        for (let i = 0; i < lgth; i++) {
          addKey(key, value[i], searchParams);
        }
      } else {
        addKey(key, value, searchParams);
      }
    }
    return searchParams.toString();
  },

  parse: (str: string): QueryObject => {
    const searchParams = new URLSearchParams(str);
    const params: QueryObject = {};

    const push = (key: string, val: string): void => {
      if (params[key]) {
        if (Array.isArray(params[key])) {
          (params[key] as Array<string | number>).push(val);
        } else {
          params[key] = [params[key] as string | number, val];
        }
      } else {
        params[key] = val;
      }
    };
    // eslint-disable-next-line no-unused-vars
    searchParams.forEach((val, key) => push(key, val));
    return params;
  },
};

export = searchParams;
