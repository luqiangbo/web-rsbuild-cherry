// valtio：轻量状态 + 本地持久化（深合并校验）
import { proxy, subscribe, snapshot } from "valtio";

const STORAGE_KEY = "store";
const canUseStorage =
  typeof window !== "undefined" && typeof localStorage !== "undefined";
const initialJson = canUseStorage
  ? localStorage.getItem(STORAGE_KEY) || ""
  : "";
let lastSavedJson = initialJson;
const defaultState = {
  token: "",
  userInfo: { name: "张三", age: 18 },
};

const parse = (s, fallback = null) => {
  try {
    return s ? JSON.parse(s) : fallback;
  } catch {
    return fallback;
  }
};

const merge = (defs, inc) => {
  if (Array.isArray(defs)) return Array.isArray(inc) ? inc : defs.slice();
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  if (!isObj(defs)) return typeof inc === typeof defs ? inc : defs;
  const base = isObj(inc) ? inc : {};
  const out = { ...base };
  for (const k of Object.keys(defs)) {
    out[k] = merge(defs[k], base[k]);
  }
  return out;
};

export const store = proxy(merge(defaultState, parse(initialJson, {})));

let pending = false;
const schedule = () => {
  if (pending) return;
  pending = true;
  queueMicrotask(() => {
    pending = false;
    try {
      if (!canUseStorage) return;
      const json = JSON.stringify(snapshot(store));
      if (json !== lastSavedJson) {
        localStorage.setItem(STORAGE_KEY, json);
        lastSavedJson = json;
      }
    } catch {
      // ignore
    }
  });
};

subscribe(store, schedule);

// 跨标签页同步：当其他标签更新同一 key 时，合并并更新本标签内存，不重复写回
if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("storage", (e) => {
    const nextJson = e.newValue || "";
    if (e.key !== STORAGE_KEY || nextJson === lastSavedJson) return; // 早退
    Object.assign(store, merge(defaultState, parse(nextJson, {})));
    lastSavedJson = nextJson; // 防环写
  });
}
// 非持久化的公共状态，例如 loading 等易变字段
export const publicState = proxy({
  loading: 0,
});
