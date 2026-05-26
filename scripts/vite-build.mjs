import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function ensureOff(emitter) {
  if (!emitter) {
    return;
  }

  if (typeof emitter.off !== "function" && typeof emitter.removeListener === "function") {
    emitter.off = emitter.removeListener.bind(emitter);
  }
}

function patchProcessStreamGetter(streamName) {
  const descriptor = Object.getOwnPropertyDescriptor(process, streamName);

  if (!descriptor?.get || descriptor.configurable !== true) {
    ensureOff(process[streamName]);
    return;
  }

  Object.defineProperty(process, streamName, {
    configurable: true,
    enumerable: descriptor.enumerable ?? true,
    get() {
      const stream = descriptor.get.call(process);
      ensureOff(stream);
      return stream;
    },
  });
}

process.env.CI ??= "true";

ensureOff(process);
patchProcessStreamGetter("stdin");
patchProcessStreamGetter("stdout");
patchProcessStreamGetter("stderr");

const viteCliPath = resolve(process.cwd(), "node_modules", "vite", "bin", "vite.js");

await import(pathToFileURL(viteCliPath).href);