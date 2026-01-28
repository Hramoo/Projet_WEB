const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
const FETCH_TIMEOUT_MS = 8000;

function isHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function downloadImageFromUrl(imageUrl) {
  if (!imageUrl) return { buffer: null, mime: null };
  if (!isHttpUrl(imageUrl)) throw new Error("URL invalide");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const res = await fetch(imageUrl, { signal: controller.signal });
  clearTimeout(timeout);

  if (!res.ok) throw new Error("Téléchargement impossible");

  const mime = res.headers.get("content-type") || "";
  if (!mime.startsWith("image/")) throw new Error("Le lien ne pointe pas vers une image");

  const arr = await res.arrayBuffer();
  if (arr.byteLength > MAX_IMAGE_BYTES) throw new Error("Image trop lourde (max 2MB)");

  return { buffer: Buffer.from(arr), mime };
}

function toDataUrl(image_data, image_mime) {
  if (!image_data || !image_mime) return null;
  return `data:${image_mime};base64,${image_data.toString("base64")}`;
}

function parseDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || "");
  if (!m) return null;
  return { mime: m[1], b64: m[2] };
}

/**
 * Accepte :
 * - image_data_url : "data:image/png;base64,..."
 * - image_data_base64 + image_mime
 * - image_hex + image_mime
 */
function imageFromBody(body) {
  const { image_data_url, image_data_base64, image_hex, image_mime } = body || {};

  if (image_data_url) {
    const parsed = parseDataUrl(image_data_url);
    if (!parsed) throw new Error("image_data_url invalide");
    return { buffer: Buffer.from(parsed.b64, "base64"), mime: parsed.mime };
  }

  if (image_data_base64) {
    if (!image_mime) throw new Error("image_mime requis avec image_data_base64");
    return { buffer: Buffer.from(image_data_base64, "base64"), mime: image_mime };
  }

  if (image_hex) {
    if (!image_mime) throw new Error("image_mime requis avec image_hex");
    if (!/^[0-9a-fA-F]+$/.test(image_hex) || image_hex.length % 2 !== 0) {
      throw new Error("image_hex invalide");
    }
    return { buffer: Buffer.from(image_hex, "hex"), mime: image_mime };
  }

  return { buffer: null, mime: null };
}

function validateImageBuffer(buffer, mime) {
  if (!buffer && !mime) return;
  if (!buffer || !mime) throw new Error("Image incomplète (buffer/mime)");
  if (!mime.startsWith("image/")) throw new Error("MIME invalide (image/*)");
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error("Image trop lourde (max 2MB)");
}


async function resolveIncomingImage({ body, imageUrl }) {
  const fromBody = imageFromBody(body);
  if (fromBody.buffer) {
    validateImageBuffer(fromBody.buffer, fromBody.mime);
    return { imageData: fromBody.buffer, imageMime: fromBody.mime };
  }

  if (imageUrl) {
    const img = await downloadImageFromUrl(imageUrl);
    validateImageBuffer(img.buffer, img.mime);
    return { imageData: img.buffer, imageMime: img.mime };
  }

  return { imageData: null, imageMime: null };
}

module.exports = {
  toDataUrl,
  resolveIncomingImage,
};
