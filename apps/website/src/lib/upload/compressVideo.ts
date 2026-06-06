import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { videoFfmpegArgs, withExtension } from "./strategy";

// Pinned to the installed @ffmpeg/core version. Loaded from CDN as blob URLs:
// the site has no CSP, so this avoids committing ~32 MB of wasm. The worker
// itself is bundled by Turbopack via @ffmpeg/ffmpeg's internal
// `new URL("./worker.js", import.meta.url)` — we do NOT pass classWorkerURL.
const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

let ffmpegPromise: Promise<FFmpeg> | null = null;
let onProgress: ((ratio: number) => void) | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);
      const ffmpeg = new FFmpeg();
      ffmpeg.on("progress", ({ progress }) => {
        if (onProgress && Number.isFinite(progress)) {
          onProgress(Math.min(1, Math.max(0, progress)));
        }
      });
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })().catch((err) => {
      ffmpegPromise = null; // allow a retry on the next attempt
      throw err;
    });
  }
  return ffmpegPromise;
}

/**
 * Transcode a video to 720p, audio-less, fast-start H.264 in the browser.
 * Throws on failure so callers can block the upload (no heavy original ships).
 */
export async function compressVideo(
  file: File,
  progressCb?: (ratio: number) => void,
): Promise<File> {
  let ffmpeg: FFmpeg;
  try {
    ffmpeg = await getFFmpeg();
  } catch {
    throw new Error("Couldn't load the video compressor. Check your connection and try again.");
  }
  const { fetchFile } = await import("@ffmpeg/util");

  const input = "input";
  const output = "output.mp4";
  onProgress = progressCb ?? null;
  try {
    await ffmpeg.writeFile(input, await fetchFile(file));
    await ffmpeg.exec(videoFfmpegArgs(input, output));
    const data = await ffmpeg.readFile(output);
    const bytes = data as Uint8Array;
    if (!bytes.length) throw new Error("empty output");
    const part = new Uint8Array(bytes); // detach from ffmpeg's memory
    return new File([part], withExtension(file.name, "mp4"), {
      type: "video/mp4",
    });
  } catch {
    throw new Error(
      "Couldn't compress this video — try exporting it at 1080p or smaller, then upload again.",
    );
  } finally {
    onProgress = null;
    await ffmpeg.deleteFile(input).catch(() => {});
    await ffmpeg.deleteFile(output).catch(() => {});
  }
}
