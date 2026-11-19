/**
 * Draws an order receipt onto a canvas and saves it as a PNG.
 * No libraries: works offline, and the ৳ sign renders with the system font.
 * Product photos are included; if one can't be loaded (e.g. the image host
 * blocks cross-origin use) a neutral placeholder is drawn instead, so the
 * download never fails because of a picture.
 */

export interface ReceiptLine {
  name: string;
  variantLabel?: string;
  qty: number;
  price: number;
  imageUrl?: string;
  emoji?: string;
}

import {
  deliveryRow,
  deliveryRowText,
  discountRow,
} from "@/lib/delivery/breakdown";

export interface ReceiptData {
  storeName: string;
  orderLabel: string;
  createdAt: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  area?: string;
  payment: string;
  subtotal: number;
  delivery: number;
  /** Optional: orders saved before Delivery Settings have none of these. */
  discount?: number;
  deliveryZone?: string;
  deliveryBase?: number;
  deliveryWaived?: boolean;
  total: number;
  lines: ReceiptLine[];
}

const money = (n: number) => `৳${n.toLocaleString("en-US")}`;
const FONT = '"Inter", "Segoe UI", system-ui, -apple-system, Arial, sans-serif';
const W = 420;
const PAD = 28;
const SCALE = 2;
const THUMB = 52;
const GAP = 12;

/** Cuts text with "…" so it fits `max` pixels. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

/** Splits text into lines that each fit `max` pixels. */
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const word of text.split(/\s+/)) {
    const next = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(next).width > max && cur) {
      out.push(cur);
      cur = word;
    } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

/** Loads a photo for the canvas. Resolves null on any failure or after 6s. */
function loadImage(url?: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // needed, or the canvas can't be exported
    const timer = setTimeout(() => resolve(null), 6000);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws a photo cropped to a square ("cover"), or a placeholder. */
function drawThumb(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  line: ReceiptLine,
  x: number,
  y: number,
) {
  ctx.save();
  roundRect(ctx, x, y, THUMB, THUMB, 10);
  ctx.clip();
  if (img && img.naturalWidth > 0) {
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - s) / 2;
    const sy = (img.naturalHeight - s) / 2;
    ctx.drawImage(img, sx, sy, s, s, x, y, THUMB, THUMB);
  } else {
    ctx.fillStyle = "#f1f1f1";
    ctx.fillRect(x, y, THUMB, THUMB);
    ctx.fillStyle = "#999";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `22px ${FONT}`;
    ctx.fillText(line.emoji || (line.name.trim()[0] ?? "•").toUpperCase(), x + THUMB / 2, y + THUMB / 2 + 1);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
  ctx.strokeStyle = "#e3e3e3";
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, THUMB - 1, THUMB - 1, 10);
  ctx.stroke();
}

/** Lays out and draws the receipt. Returns the y where it ended. */
function draw(
  ctx: CanvasRenderingContext2D,
  d: ReceiptData,
  imgs: (HTMLImageElement | null)[],
  H: number,
): number {
  const inner = W - PAD * 2;
  const textX = PAD + THUMB + GAP;
  const textW = W - PAD - textX - 74; // leave room for the price

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";

  const dash = (y: number) => {
    ctx.strokeStyle = "#c9c9c9";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  const row = (label: string, value: string, y: number, bold = false, color = "#111") => {
    ctx.font = `${bold ? "700 15px" : "13px"} ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.fillText(label, PAD, y);
    ctx.textAlign = "right";
    ctx.fillText(value, W - PAD, y);
  };

  let y = PAD + 14;
  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.font = `700 18px ${FONT}`;
  ctx.fillText(fit(ctx, d.storeName, inner), W / 2, y);
  y += 24;
  ctx.font = `700 12px ${FONT}`;
  ctx.fillText("ORDER RECEIPT", W / 2, y);
  y += 18;
  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = "#666";
  ctx.fillText(`#${d.orderLabel}`, W / 2, y);
  y += 16;
  ctx.fillText(
    new Date(d.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }),
    W / 2,
    y,
  );
  y += 18;
  dash(y);
  y += 24;

  ctx.textAlign = "left";
  ctx.fillStyle = "#111";
  ctx.font = `700 12px ${FONT}`;
  ctx.fillText("DELIVER TO", PAD, y);
  y += 18;
  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = "#333";
  ctx.fillText(`${d.name} · ${d.phone}`, PAD, y);
  const addr = wrap(ctx, [d.address, d.area, d.city].filter(Boolean).join(", "), inner);
  for (const a of addr) {
    y += 17;
    ctx.fillText(a, PAD, y);
  }
  y += 18;
  dash(y);
  y += 18;

  d.lines.forEach((l, i) => {
    ctx.font = `600 13px ${FONT}`;
    const title = wrap(ctx, l.name, textW).slice(0, 3);
    const textH = title.length * 17 + (l.variantLabel ? 16 : 0) + 16;
    const rowH = Math.max(THUMB, textH);

    drawThumb(ctx, imgs[i], l, PAD, y);

    ctx.textAlign = "left";
    ctx.font = `600 13px ${FONT}`;
    ctx.fillStyle = "#111";
    title.forEach((t, k) => ctx.fillText(t, textX, y + 13 + k * 17));
    let ty = y + 13 + (title.length - 1) * 17;
    if (l.variantLabel) {
      ty += 16;
      ctx.font = `11px ${FONT}`;
      ctx.fillStyle = "#777";
      ctx.fillText(fit(ctx, l.variantLabel, textW), textX, ty);
    }
    ctx.font = `11px ${FONT}`;
    ctx.fillStyle = "#777";
    ctx.fillText(`Qty ${l.qty} × ${money(l.price)}`, textX, ty + 16);

    ctx.textAlign = "right";
    ctx.font = `600 13px ${FONT}`;
    ctx.fillStyle = "#111";
    ctx.fillText(money(l.price * l.qty), W - PAD, y + 13);

    y += rowH + 14;
  });
  dash(y - 4);
  y += 22;

  row("Subtotal", money(d.subtotal), y);
  y += 22;
  const dRow = deliveryRow(d, money);
  row(dRow.label, deliveryRowText(dRow), y);
  y += 22;
  const dsRow = discountRow(d, money);
  if (dsRow) {
    row(dsRow.label, dsRow.value, y);
    y += 22;
  }
  y += 4;
  row("Total", money(d.total), y, true);
  y += 22;
  row("Payment", d.payment, y, false, "#666");
  y += 28;
  dash(y);
  y += 26;
  ctx.textAlign = "center";
  ctx.fillStyle = "#666";
  ctx.font = `12px ${FONT}`;
  ctx.fillText("Thank you for your order!", W / 2, y);
  return y + PAD;
}

export async function renderReceipt(d: ReceiptData): Promise<HTMLCanvasElement> {
  const imgs = await Promise.all(d.lines.map((l) => loadImage(l.imageUrl)));

  // Pass 1 finds the height, pass 2 draws on a canvas of exactly that height.
  const probe = document.createElement("canvas");
  probe.width = W;
  probe.height = 4000;
  const H = Math.ceil(draw(probe.getContext("2d")!, d, imgs, 4000));

  const c = document.createElement("canvas");
  c.width = W * SCALE;
  c.height = H * SCALE;
  const ctx = c.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  draw(ctx, d, imgs, H);
  return c;
}

/** Saves the receipt as `receipt-<order>.png`. */
export async function downloadReceipt(d: ReceiptData): Promise<void> {
  const canvas = await renderReceipt(d);
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Could not create the receipt image."));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${d.orderLabel.replace(/[^\w-]+/g, "")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, "image/png");
  });
}
