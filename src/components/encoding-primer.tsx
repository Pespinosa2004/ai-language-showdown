"use client";

import { Binary, Hash, Type } from "lucide-react";

const NIBBLES = Array.from({ length: 16 }, (_, value) => ({
  decimal: String(value),
  binary: value.toString(2).padStart(4, "0"),
  hex: value.toString(16).toUpperCase(),
}));

const ASCII_ROWS = [
  ...Array.from({ length: 26 }, (_, index) => {
    const upper = String.fromCharCode(65 + index);
    const lower = String.fromCharCode(97 + index);
    return {
      glyph: `${upper} / ${lower}`,
      decimal: `${65 + index} / ${97 + index}`,
      hex: `0x${(65 + index).toString(16).toUpperCase()} / 0x${(97 + index).toString(16).toUpperCase()}`,
    };
  }),
  { glyph: "0–9", decimal: "48–57", hex: "0x30–0x39" },
  { glyph: "space", decimal: "32", hex: "0x20" },
];

const LETTER_CODES = Array.from({ length: 26 }, (_, index) => {
  const letter = String.fromCharCode(65 + index);
  const n = index + 1;
  return {
    letter,
    lamps: n.toString(2).padStart(5, "0"),
    n: String(n),
  };
});

export function EncodingPrimer() {
  return (
    <section className="rounded-xl border border-white/10 bg-black/20 p-4 sm:p-5">
      <p className="font-mono text-[10px] tracking-[0.22em] text-amber-200/80">
        ENCODING BENCH
      </p>
      <h2 className="mt-2 text-xl font-medium text-zinc-50">How the glyphs read</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
        Cards on this table are the same number written three ways. Binary counts
        in powers of 2. Hex groups those bits into digits 0–9 then A–F. ASCII
        maps a number onto a character. Study this before you sit; hard rounds
        hide the footnotes on the cards.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-white/10 bg-black/25 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm text-zinc-200">
            <Binary className="size-4 text-amber-300" />
            Nibble sheet · decimal, 4-bit, hex
          </div>
          <p className="mb-3 text-xs leading-5 text-zinc-500">
            Four lamps make one hex digit. 1010 is A, which is 10. Stack two
            nibbles and you have a byte.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[16rem] border-collapse font-mono text-[11px]">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="border-b border-white/10 py-1.5 pr-3 font-medium">Dec</th>
                  <th className="border-b border-white/10 py-1.5 pr-3 font-medium">Binary</th>
                  <th className="border-b border-white/10 py-1.5 font-medium">Hex</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {NIBBLES.map((row) => (
                  <tr key={row.decimal}>
                    <td className="border-b border-white/5 py-1 pr-3">{row.decimal}</td>
                    <td className="border-b border-white/5 py-1 pr-3">{row.binary}</td>
                    <td className="border-b border-white/5 py-1">{row.hex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-white/10 bg-black/25 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm text-zinc-200">
            <Hash className="size-4 text-amber-300" />
            Letter lamps · A = 00001
          </div>
          <p className="mb-3 text-xs leading-5 text-zinc-500">
            Some prompts hide a letter in five bits, not ASCII. A is 1, B is 2,
            up to Z is 26.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[16rem] border-collapse font-mono text-[11px]">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="border-b border-white/10 py-1.5 pr-3 font-medium">Letter</th>
                  <th className="border-b border-white/10 py-1.5 pr-3 font-medium">N</th>
                  <th className="border-b border-white/10 py-1.5 font-medium">5-bit</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {LETTER_CODES.map((row) => (
                  <tr key={row.letter}>
                    <td className="border-b border-white/5 py-1 pr-3">{row.letter}</td>
                    <td className="border-b border-white/5 py-1 pr-3">{row.n}</td>
                    <td className="border-b border-white/5 py-1">{row.lamps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <article className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
        <div className="mb-3 flex items-center gap-2 text-sm text-zinc-200">
          <Type className="size-4 text-amber-300" />
          ASCII · character = code
        </div>
        <p className="mb-3 text-xs leading-5 text-zinc-500">
          A capital is 65. Add 32 and it becomes lowercase. Digit characters
          start at 48, which is the glyph 0, not the value zero.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse font-mono text-[11px]">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="border-b border-white/10 py-1.5 pr-3 font-medium">Glyph</th>
                <th className="border-b border-white/10 py-1.5 pr-3 font-medium">Decimal</th>
                <th className="border-b border-white/10 py-1.5 font-medium">Hex</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {ASCII_ROWS.map((row) => (
                <tr key={row.glyph}>
                  <td className="border-b border-white/5 py-1 pr-3">{row.glyph}</td>
                  <td className="border-b border-white/5 py-1 pr-3">{row.decimal}</td>
                  <td className="border-b border-white/5 py-1">{row.hex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
