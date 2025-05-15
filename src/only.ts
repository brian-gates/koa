type AnyObject = { [key: string]: any };

function only(obj: AnyObject, keys: string[]): AnyObject {
  const ret: AnyObject = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (obj[key] == null) continue;
    ret[key] = obj[key];
  }
  return ret;
}

export default only;
