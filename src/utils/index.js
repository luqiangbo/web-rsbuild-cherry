export function getPersistedToken() {
  try {
    const raw = localStorage.getItem("store");
    if (!raw) return "";
    const data = JSON.parse(raw);
    // 兼容多种常见结构
    const candidates = [
      data?.token,
      data?.state?.token,
      data?.value?.token,
      data?.persistedState?.token,
    ];
    for (const t of candidates) {
      if (typeof t === "string" && t) return t;
    }
    return "";
  } catch {
    return "";
  }
}
