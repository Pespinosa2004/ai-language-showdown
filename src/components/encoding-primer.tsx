"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Binary, Hash, Layers, Type } from "lucide-react";

const SAME_NUMBER = [
  { dec: "10", bin: "0000 1010", hex: "0x0A", ascii: "LF" },
  { dec: "32", bin: "0010 0000", hex: "0x20", ascii: "space" },
  { dec: "48", bin: "0011 0000", hex: "0x30", ascii: "0" },
  { dec: "65", bin: "0100 0001", hex: "0x41", ascii: "A" },
  { dec: "97", bin: "0110 0001", hex: "0x61", ascii: "a" },
  { dec: "255", bin: "1111 1111", hex: "0xFF", ascii: "—" },
];

const POWERS = Array.from({ length: 8 }, (_, bit) => ({
  bit: String(bit),
  weight: String(2 ** bit),
  lamps: (1 << bit).toString(2).padStart(8, "0").replace(/(.{4})/g, "$1 ").trim(),
}));

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

function Sheet({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-xl border border-white/10 bg-black/25 p-3 ${className}`}
    >
      {children}
    </article>
  );
}

function Head({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-sm text-zinc-200">
      <Icon className="size-4 text-amber-300" />
      {title}
    </div>
  );
}

export function EncodingPrimer() {
  return (
    <section
      id="encoding-bench"
      className="rounded-xl border border-white/10 bg-black/20 p-4 sm:p-5"
    >
      <p className="font-mono text-[10px] tracking-[0.22em] text-amber-200/80">
        ENCODING BENCH
      </p>
      <h2 className="mt-2 text-xl font-medium text-zinc-50">How the glyphs read</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
        Every card is one number written as binary lamps, a hex digit string, or
        an ASCII character. Easy rounds print that translation on the card foot.
        Medium keeps the flavor line. Hard hides it — use this bench before you
        sit.
      </p>

      <Sheet className="mt-5">
        <Head icon={Layers} title="Same number · three writings" />
        <p className="mb-3 text-xs leading-5 text-zinc-500">
          Read left to right: decimal value, 8-bit binary, hex, and the ASCII
          glyph when that code is a character. 65 is the capital A; 48 is the
          character 0, not the value zero.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] table-fixed border-collapse font-mono text-[11px]">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="w-[18%] border-b border-white/10 py-1.5 pr-3 font-medium">
                  Decimal
                </th>
                <th className="w-[28%] border-b border-white/10 py-1.5 pr-3 font-medium">
                  Binary
                </th>
                <th className="w-[18%] border-b border-white/10 py-1.5 pr-3 font-medium">
                  Hex
                </th>
                <th className="w-[36%] border-b border-white/10 py-1.5 font-medium">
                  ASCII
                </th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {SAME_NUMBER.map((row) => (
                <tr key={row.dec}>
                  <td className="border-b border-white/5 py-1 pr-3">{row.dec}</td>
                  <td className="border-b border-white/5 py-1 pr-3">{row.bin}</td>
                  <td className="border-b border-white/5 py-1 pr-3">{row.hex}</td>
                  <td className="border-b border-white/5 py-1">{row.ascii}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sheet>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Sheet>
          <Head icon={Binary} title="Binary · powers of two" />
          <p className="mb-3 text-xs leading-5 text-zinc-500">
            Each lamp is worth twice the one on its right. 13 is 8 + 4 + 1, so
            the 4-bit reading is 1101. Spaces in a glyph are only grouping;
            they do not change the value.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[16rem] table-fixed border-collapse font-mono text-[11px]">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="w-[22%] border-b border-white/10 py-1.5 pr-3 font-medium">
                    Bit
                  </th>
                  <th className="w-[28%] border-b border-white/10 py-1.5 pr-3 font-medium">
                    Value
                  </th>
                  <th className="w-[50%] border-b border-white/10 py-1.5 font-medium">
                    8-bit mask
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {POWERS.map((row) => (
                  <tr key={row.bit}>
                    <td className="border-b border-white/5 py-1 pr-3">{row.bit}</td>
                    <td className="border-b border-white/5 py-1 pr-3">
                      {row.weight}
                    </td>
                    <td className="border-b border-white/5 py-1">{row.lamps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sheet>

        <Sheet>
          <Head icon={Hash} title="Hex · one nibble is one digit" />
          <p className="mb-3 text-xs leading-5 text-zinc-500">
            Four lamps make one hex digit. After 9 the glyphs are A = 10, B =
            11, C = 12, D = 13, E = 14, F = 15. Prefix 0x marks hex, not
            binary.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[16rem] table-fixed border-collapse font-mono text-[11px]">
              <thead>
                <tr className="text-left text-zinc-500">
                  <th className="w-[28%] border-b border-white/10 py-1.5 pr-3 font-medium">
                    Dec
                  </th>
                  <th className="w-[40%] border-b border-white/10 py-1.5 pr-3 font-medium">
                    Binary
                  </th>
                  <th className="w-[32%] border-b border-white/10 py-1.5 font-medium">
                    Hex
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {NIBBLES.map((row) => (
                  <tr key={row.decimal}>
                    <td className="border-b border-white/5 py-1 pr-3">
                      {row.decimal}
                    </td>
                    <td className="border-b border-white/5 py-1 pr-3">
                      {row.binary}
                    </td>
                    <td className="border-b border-white/5 py-1">{row.hex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sheet>
      </div>

      <Sheet className="mt-4">
        <Head icon={Hash} title="Letter lamps · A = 00001, not ASCII" />
        <p className="mb-3 text-xs leading-5 text-zinc-500">
          Some prompts hide a letter in five bits. A is 1, B is 2, up to Z is
          26. That is not ASCII. ASCII A is 65 / 0x41 / 0100 0001.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[16rem] table-fixed border-collapse font-mono text-[11px]">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="w-[28%] border-b border-white/10 py-1.5 pr-3 font-medium">
                  Letter
                </th>
                <th className="w-[22%] border-b border-white/10 py-1.5 pr-3 font-medium">
                  N
                </th>
                <th className="w-[50%] border-b border-white/10 py-1.5 font-medium">
                  5-bit
                </th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {LETTER_CODES.map((row) => (
                <tr key={row.letter}>
                  <td className="border-b border-white/5 py-1 pr-3">
                    {row.letter}
                  </td>
                  <td className="border-b border-white/5 py-1 pr-3">{row.n}</td>
                  <td className="border-b border-white/5 py-1">{row.lamps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sheet>

      <Sheet className="mt-4">
        <Head icon={Type} title="ASCII · character = code" />
        <p className="mb-3 text-xs leading-5 text-zinc-500">
          A capital is 65. Add 32 and it becomes lowercase. Digit characters
          start at 48, which is the glyph 0.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] table-fixed border-collapse font-mono text-[11px]">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="w-[34%] border-b border-white/10 py-1.5 pr-3 font-medium">
                  Glyph
                </th>
                <th className="w-[33%] border-b border-white/10 py-1.5 pr-3 font-medium">
                  Decimal
                </th>
                <th className="w-[33%] border-b border-white/10 py-1.5 font-medium">
                  Hex
                </th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {ASCII_ROWS.map((row) => (
                <tr key={row.glyph}>
                  <td className="border-b border-white/5 py-1 pr-3">
                    {row.glyph}
                  </td>
                  <td className="border-b border-white/5 py-1 pr-3">
                    {row.decimal}
                  </td>
                  <td className="border-b border-white/5 py-1">{row.hex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sheet>
    </section>
  );
}
