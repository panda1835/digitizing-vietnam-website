import type { KieuSnapshot } from "./contracts";

// These functions run inside opaque-origin sandboxed documents. Keep them self-contained.
function dataRuntime(channel: string, snapshot: KieuSnapshot | null) {
  const pending = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  let sequence = 0;
  window.addEventListener("message", (event) => {
    const message = event.data;
    if (
      event.source !== parent ||
      !message ||
      message.channel !== channel ||
      message.type !== "kieu-result"
    )
      return;
    const entry = pending.get(message.id);
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.delete(message.id);
    if (message.error)
      entry.reject(new Error("Truyện Kiều data could not be loaded."));
    else entry.resolve(message.result);
  });
  const request = async (input: {
    method: string;
    version?: string;
    page?: number;
    query?: string;
  }) => {
    if (snapshot) {
      const versions = Object.keys(snapshot);
      if (input.method === "listVersions")
        return versions.map((version) => ({
          version,
          title: `Truyện Kiều ${version}`,
          totalPages: snapshot[version].length,
        }));
      if (!versions.includes(input.version!))
        throw new Error("Unknown edition");
      const pages = snapshot[input.version!];
      if (input.method === "getPage") {
        if (
          !Number.isInteger(input.page) ||
          input.page! < 1 ||
          input.page! > pages.length
        )
          throw new Error("Invalid page");
        return pages[input.page! - 1];
      }
      if (input.method === "search") {
        const needle = input.query
          ?.trim()
          .normalize("NFC")
          .toLocaleLowerCase("vi");
        if (!needle || needle.length > 100) throw new Error("Invalid query");
        return pages
          .flatMap((page) =>
            page.lines
              .filter((line) =>
                `${line.nom} ${line.quocNgu}`
                  .normalize("NFC")
                  .toLocaleLowerCase("vi")
                  .includes(needle)
              )
              .map((line) => ({
                version: page.version,
                page: page.page,
                ...line,
                sourceUrl: page.sourceUrl,
              }))
          )
          .slice(0, 30);
      }
      throw new Error("Unknown method");
    }
    if (pending.size >= 10) throw new Error("Too many pending data requests");
    return new Promise((resolve, reject) => {
      const id = String(++sequence);
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error("Data request timed out"));
      }, 15000);
      pending.set(id, { resolve, reject, timer });
      parent.postMessage({ type: "kieu-request", channel, id, input }, "*");
    });
  };
  Object.defineProperty(window, "kieu", {
    writable: false,
    configurable: false,
    value: Object.freeze({
      listVersions: () => request({ method: "listVersions" }),
      getPage: (version: string, page: number) =>
        request({ method: "getPage", version, page }),
      search: (version: string, query: string) =>
        request({ method: "search", version, query }),
    }),
  });
}

function frameRuntime(html: string, channel: string) {
  const frame = document.querySelector("iframe")!;
  window.addEventListener("message", (event) => {
    if (!event.data || event.data.channel !== channel) return;
    if (
      event.source === frame.contentWindow &&
      event.data.type === "kieu-request"
    )
      parent.postMessage(event.data, "*");
    if (event.source === parent && event.data.type === "kieu-result")
      frame.contentWindow?.postMessage(event.data, "*");
  });
  frame.srcdoc = html;
}

function scriptJson(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function createPreviewDocument(
  html: string,
  channel: string,
  snapshot: KieuSnapshot | null = null
) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll(
      "meta, base, link, iframe, frame, frameset, object, embed, portal"
    )
    .forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (
        name.startsWith("on") ||
        [
          "nonce",
          "srcdoc",
          "href",
          "xlink:href",
          "action",
          "formaction",
          "target",
          "ping",
          "srcset",
          "poster",
          "background",
        ].includes(name)
      )
        element.removeAttribute(attribute.name);
      if (
        name === "src" &&
        !(
          element.tagName === "IMG" &&
          /^data:image\/(png|jpeg|gif|webp);base64,/i.test(attribute.value)
        )
      )
        element.removeAttribute(attribute.name);
    }
  });
  doc.querySelectorAll("script").forEach((script) => {
    script.setAttribute("nonce", nonce);
    script.removeAttribute("defer");
    script.removeAttribute("async");
  });
  const policy = doc.createElement("meta");
  policy.httpEquiv = "Content-Security-Policy";
  policy.content = `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;
  const charset = doc.createElement("meta");
  charset.setAttribute("charset", "utf-8");
  const viewport = doc.createElement("meta");
  viewport.name = "viewport";
  viewport.content = "width=device-width, initial-scale=1";
  const bootstrap = doc.createElement("script");
  bootstrap.setAttribute("nonce", nonce);
  bootstrap.textContent = `(${dataRuntime.toString()})(${scriptJson(
    channel
  )},${scriptJson(snapshot)});`;
  doc.head.prepend(policy, charset, viewport, bootstrap);
  const innerHtml = "<!DOCTYPE html>" + doc.documentElement.outerHTML;

  // A trusted outer sandbox restricts the inner frame's navigations as well as its fetches.
  // No generated code runs in the outer document or the host page.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; frame-src about:; base-uri 'none'; form-action 'none'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Truyện Kiều playground</title><style>html,body{margin:0;width:100%;height:100%;background:#fff}iframe{display:block;width:100%;height:100vh;border:0}</style></head><body><iframe title="Generated website" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe><script nonce="${nonce}">(${frameRuntime.toString()})(${scriptJson(
    innerHtml
  )},${scriptJson(channel)});</script></body></html>`;
}
