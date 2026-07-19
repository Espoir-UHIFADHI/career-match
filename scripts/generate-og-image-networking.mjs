/**
 * Génère public/og-image-networking.png (1200×630) sans dépendance externe.
 * Thème : Networking AI — trouver les bons contacts dans n'importe quelle entreprise.
 */

import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const W = 1200;
const H = 630;

// ─── Helpers couleur ──────────────────────────────────────────────────────────
function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ─── Canvas pixel buffer ──────────────────────────────────────────────────────
const pixels = new Uint8Array(W * H * 3);

function setPixel(x, y, r, g, b) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 3;
    pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b;
}

function fillRect(x0, y0, x1, y1, r, g, b) {
    for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++)
            setPixel(x, y, r, g, b);
}

function fillRoundRect(x0, y0, x1, y1, radius, r, g, b) {
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            const dx = Math.min(x - x0, x1 - x);
            const dy = Math.min(y - y0, y1 - y);
            if (dx < radius && dy < radius) {
                if ((dx - radius) ** 2 + (dy - radius) ** 2 > radius ** 2) continue;
            }
            setPixel(x, y, r, g, b);
        }
    }
}

function fillGradient(x0, y0, x1, y1, colorA, colorB) {
    const [r1, g1, b1] = colorA;
    const [r2, g2, b2] = colorB;
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            const t = (x - x0) / (x1 - x0 || 1);
            setPixel(x, y,
                Math.round(r1 + (r2 - r1) * t),
                Math.round(g1 + (g2 - g1) * t),
                Math.round(b1 + (b2 - b1) * t)
            );
        }
    }
}

function drawCircle(cx, cy, radius, r, g, b) {
    for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
            if ((x - cx) ** 2 + (y - cy) ** 2 <= radius * radius) {
                setPixel(x, y, r, g, b);
            }
        }
    }
}

function drawCircleOutline(cx, cy, radius, thickness, r, g, b) {
    for (let y = cy - radius - thickness; y <= cy + radius + thickness; y++) {
        for (let x = cx - radius - thickness; x <= cx + radius + thickness; x++) {
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist >= radius && dist <= radius + thickness) {
                setPixel(x, y, r, g, b);
            }
        }
    }
}

function drawLine(x0, y0, x1, y1, thickness, r, g, b) {
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(len);
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = Math.round(x0 + dx * t);
        const py = Math.round(y0 + dy * t);
        for (let ty = -thickness; ty <= thickness; ty++)
            for (let tx = -thickness; tx <= thickness; tx++)
                setPixel(px + tx, py + ty, r, g, b);
    }
}

// ─── Rendu texte bitmap (police 5×7 px) ──────────────────────────────────────
const FONT_5x7 = {
    ' ': [0x00,0x00,0x00,0x00,0x00],
    'A': [0x7E,0x09,0x09,0x09,0x7E],
    'B': [0x7F,0x49,0x49,0x49,0x36],
    'C': [0x3E,0x41,0x41,0x41,0x22],
    'D': [0x7F,0x41,0x41,0x22,0x1C],
    'E': [0x7F,0x49,0x49,0x49,0x41],
    'F': [0x7F,0x09,0x09,0x09,0x01],
    'G': [0x3E,0x41,0x49,0x49,0x7A],
    'H': [0x7F,0x08,0x08,0x08,0x7F],
    'I': [0x00,0x41,0x7F,0x41,0x00],
    'J': [0x20,0x40,0x41,0x3F,0x01],
    'K': [0x7F,0x08,0x14,0x22,0x41],
    'L': [0x7F,0x40,0x40,0x40,0x40],
    'M': [0x7F,0x02,0x0C,0x02,0x7F],
    'N': [0x7F,0x04,0x08,0x10,0x7F],
    'O': [0x3E,0x41,0x41,0x41,0x3E],
    'P': [0x7F,0x09,0x09,0x09,0x06],
    'Q': [0x3E,0x41,0x51,0x21,0x5E],
    'R': [0x7F,0x09,0x19,0x29,0x46],
    'S': [0x46,0x49,0x49,0x49,0x31],
    'T': [0x01,0x01,0x7F,0x01,0x01],
    'U': [0x3F,0x40,0x40,0x40,0x3F],
    'V': [0x1F,0x20,0x40,0x20,0x1F],
    'W': [0x3F,0x40,0x38,0x40,0x3F],
    'X': [0x63,0x14,0x08,0x14,0x63],
    'Y': [0x07,0x08,0x70,0x08,0x07],
    'Z': [0x61,0x51,0x49,0x45,0x43],
    'a': [0x20,0x54,0x54,0x54,0x78],
    'b': [0x7F,0x48,0x44,0x44,0x38],
    'c': [0x38,0x44,0x44,0x44,0x20],
    'd': [0x38,0x44,0x44,0x48,0x7F],
    'e': [0x38,0x54,0x54,0x54,0x18],
    'f': [0x08,0x7E,0x09,0x01,0x02],
    'g': [0x0C,0x52,0x52,0x52,0x3E],
    'h': [0x7F,0x08,0x04,0x04,0x78],
    'i': [0x00,0x44,0x7D,0x40,0x00],
    'j': [0x20,0x40,0x44,0x3D,0x00],
    'k': [0x7F,0x10,0x28,0x44,0x00],
    'l': [0x00,0x41,0x7F,0x40,0x00],
    'm': [0x7C,0x04,0x18,0x04,0x78],
    'n': [0x7C,0x08,0x04,0x04,0x78],
    'o': [0x38,0x44,0x44,0x44,0x38],
    'p': [0x7C,0x14,0x14,0x14,0x08],
    'q': [0x08,0x14,0x14,0x18,0x7C],
    'r': [0x7C,0x08,0x04,0x04,0x08],
    's': [0x48,0x54,0x54,0x54,0x20],
    't': [0x04,0x3F,0x44,0x40,0x20],
    'u': [0x3C,0x40,0x40,0x20,0x7C],
    'v': [0x1C,0x20,0x40,0x20,0x1C],
    'w': [0x3C,0x40,0x30,0x40,0x3C],
    'x': [0x44,0x28,0x10,0x28,0x44],
    'y': [0x0C,0x50,0x50,0x50,0x3C],
    'z': [0x44,0x64,0x54,0x4C,0x44],
    '0': [0x3E,0x51,0x49,0x45,0x3E],
    '1': [0x00,0x42,0x7F,0x40,0x00],
    '2': [0x42,0x61,0x51,0x49,0x46],
    '3': [0x21,0x41,0x45,0x4B,0x31],
    '4': [0x18,0x14,0x12,0x7F,0x10],
    '5': [0x27,0x45,0x45,0x45,0x39],
    '6': [0x3C,0x4A,0x49,0x49,0x30],
    '7': [0x01,0x71,0x09,0x05,0x03],
    '8': [0x36,0x49,0x49,0x49,0x36],
    '9': [0x06,0x49,0x49,0x29,0x1E],
    '.': [0x00,0x60,0x60,0x00,0x00],
    ',': [0x00,0x50,0x30,0x00,0x00],
    '!': [0x00,0x00,0x5F,0x00,0x00],
    '?': [0x02,0x01,0x51,0x09,0x06],
    ':': [0x00,0x36,0x36,0x00,0x00],
    '-': [0x08,0x08,0x08,0x08,0x08],
    '+': [0x08,0x08,0x3E,0x08,0x08],
    '/': [0x20,0x10,0x08,0x04,0x02],
    '%': [0x23,0x13,0x08,0x64,0x62],
    '(': [0x00,0x1C,0x22,0x41,0x00],
    ')': [0x00,0x41,0x22,0x1C,0x00],
    '#': [0x14,0x7F,0x14,0x7F,0x14],
    '@': [0x3E,0x41,0x5D,0x55,0x1E],
    "'": [0x00,0x05,0x03,0x00,0x00],
    '"': [0x03,0x00,0x03,0x00,0x00],
    'é': [0x38,0x55,0x55,0x55,0x18],
    'è': [0x38,0x56,0x55,0x54,0x18],
    'ê': [0x38,0x55,0x56,0x55,0x18],
    'à': [0x20,0x55,0x56,0x55,0x78],
    'ô': [0x38,0x45,0x46,0x45,0x38],
    'û': [0x3C,0x41,0x42,0x41,0x7C],
    'î': [0x00,0x45,0x7E,0x44,0x00],
};

function drawChar(ch, x, y, scale, r, g, b) {
    const glyph = FONT_5x7[ch] || FONT_5x7[' '];
    for (let col = 0; col < 5; col++) {
        const colData = glyph[col];
        for (let row = 0; row < 7; row++) {
            if (colData & (1 << row)) {
                fillRect(
                    x + col * scale, y + row * scale,
                    x + col * scale + scale - 1, y + row * scale + scale - 1,
                    r, g, b
                );
            }
        }
    }
}

function drawText(text, x, y, scale, r, g, b) {
    let cx = x;
    for (const ch of text) {
        drawChar(ch, cx, y, scale, r, g, b);
        cx += (5 + 1) * scale;
    }
    return cx;
}

function textWidth(text, scale) {
    return text.length * (5 + 1) * scale;
}

function drawTextCentered(text, y, scale, r, g, b) {
    const w = textWidth(text, scale);
    drawText(text, Math.round((W - w) / 2), y, scale, r, g, b);
}

// ─── RENDU ────────────────────────────────────────────────────────────────────

// 1. Fond dégradé slate-900 → violet-950 (thème networking, différent du cv-ats)
fillGradient(0, 0, W - 1, H - 1,
    hexToRgb('#0f172a'),  // slate-900
    hexToRgb('#2e1065')   // violet-950
);

// 2. Bande décorative gauche (accent violet)
fillRect(0, 0, 6, H - 1, ...hexToRgb('#8b5cf6'));

// 3. Halo décoratif haut-droit (violet)
const hx = 980, hy = 120;
for (let radius = 200; radius > 0; radius -= 3) {
    const alpha = 1 - radius / 200;
    const intensity = Math.round(alpha * 55);
    for (let y = hy - radius; y <= hy + radius; y++) {
        for (let x = hx - radius; x <= hx + radius; x++) {
            if ((x - hx) ** 2 + (y - hy) ** 2 <= radius * radius) {
                const i = (y * W + x) * 3;
                if (x >= 0 && x < W && y >= 0 && y < H) {
                    pixels[i]     = Math.min(255, pixels[i] + Math.round(intensity * 0.6));
                    pixels[i + 1] = Math.min(255, pixels[i + 1] + Math.round(intensity * 0.3));
                    pixels[i + 2] = Math.min(255, pixels[i + 2] + Math.round(intensity * 1.8));
                }
            }
        }
    }
}

// 4. Graphe de réseau — nœud central + satellites + connexions
const nodeCenter = { x: 960, y: 340 };
const satellites = [
    { x: 840, y: 220, label: 'DRH' },
    { x: 1070, y: 200, label: 'Tech' },
    { x: 1120, y: 360, label: 'CEO' },
    { x: 1050, y: 480, label: 'RH' },
    { x: 860, y: 470, label: 'Mgr' },
];

// Connexions (lignes)
for (const sat of satellites) {
    drawLine(nodeCenter.x, nodeCenter.y, sat.x, sat.y, 1, ...hexToRgb('#4c1d95'));
}

// Nœuds satellites
for (const sat of satellites) {
    drawCircle(sat.x, sat.y, 28, ...hexToRgb('#1e1b4b'));
    drawCircleOutline(sat.x, sat.y, 28, 2, ...hexToRgb('#7c3aed'));
    const lw = textWidth(sat.label, 2);
    drawText(sat.label, sat.x - Math.round(lw / 2), sat.y - 5, 2, ...hexToRgb('#c4b5fd'));
}

// Nœud central (vous)
drawCircle(nodeCenter.x, nodeCenter.y, 40, ...hexToRgb('#5b21b6'));
drawCircleOutline(nodeCenter.x, nodeCenter.y, 40, 3, ...hexToRgb('#a78bfa'));
const youLabel = 'Vous';
const youW = textWidth(youLabel, 2);
drawText(youLabel, nodeCenter.x - Math.round(youW / 2), nodeCenter.y - 5, 2, ...hexToRgb('#ffffff'));

// 5. Logo texte "Career Match"
drawText('Career Match', 60, 80, 5, ...hexToRgb('#ffffff'));

// 6. Ligne de séparation sous le logo
fillRect(60, 130, 60 + textWidth('Career Match', 5), 133, ...hexToRgb('#8b5cf6'));

// 7. Headline principale
drawText('Trouvez le bon contact', 60, 200, 6, ...hexToRgb('#ffffff'));
drawText('en 30 secondes', 60, 260, 6, ...hexToRgb('#c4b5fd'));

// 8. Sous-titre
drawText('Recruteurs, managers, DRH — directement dans votre cible.', 60, 360, 2, ...hexToRgb('#94a3b8'));

// 9. Badges en bas
const badges = ['3 credits offerts', 'Sans carte bancaire', 'Resultats immediats'];
let bx = 60;
for (const badge of badges) {
    const bw = textWidth(badge, 2) + 24;
    fillRoundRect(bx, 430, bx + bw, 476, 10, ...hexToRgb('#1e1b4b'));
    fillRoundRect(bx, 430, bx + bw + 1, 477, 10, ...hexToRgb('#3b0764'));
    drawText(badge, bx + 12, 446, 2, ...hexToRgb('#e2e8f0'));
    bx += bw + 20;
}

// 10. URL en bas
drawText('careermatch.fr/lp/networking', 60, 530, 3, ...hexToRgb('#475569'));

// 11. Ligne décorative bas
fillRect(0, H - 5, W - 1, H - 1, ...hexToRgb('#8b5cf6'));

// ─── ENCODAGE PNG ─────────────────────────────────────────────────────────────

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        table[i] = c;
    }
    for (const byte of buf) crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function uint32BE(n) {
    return Buffer.from([n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
}

function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const len = uint32BE(data.length);
    const crc = uint32BE(crc32(Buffer.concat([typeBytes, data])));
    return Buffer.concat([len, typeBytes, data, crc]);
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8;
ihdr[9] = 2;
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

// Scanlines
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    for (let x = 0; x < W; x++) {
        const si = (y * W + x) * 3;
        const di = y * (1 + W * 3) + 1 + x * 3;
        raw[di] = pixels[si];
        raw[di + 1] = pixels[si + 1];
        raw[di + 2] = pixels[si + 2];
    }
}

const compressed = deflateSync(raw, { level: 6 });

const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
]);

const outPath = join(__dirname, '..', 'public', 'og-image-networking.png');
writeFileSync(outPath, png);
console.log(`og-image-networking.png generated: ${W}x${H} — ${(png.length / 1024).toFixed(1)} kB`);
