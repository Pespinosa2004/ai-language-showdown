"use client";

import { XIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ASCII_ROWS = [
  {
    glyph: "A",
    meaning: "Capital A — the first uppercase letter",
    decimal: "65",
    binary: "0100 0001",
    hex: "0x41",
    octal: "101",
  },
  {
    glyph: "a",
    meaning: "Lowercase a — the same letter, written small",
    decimal: "97",
    binary: "0110 0001",
    hex: "0x61",
    octal: "141",
  },
] as const;

function CellHead({ children }: { children: string }) {
  return (
    <th className="border-b border-white/15 px-2 py-2 text-left text-[10px] font-medium tracking-[0.16em] text-amber-200/70">
      {children}
    </th>
  );
}

function Cell({
  children,
  mono = false,
}: {
  children: string;
  mono?: boolean;
}) {
  return (
    <td
      className={`border-b border-white/10 px-2 py-2 text-sm text-zinc-200 ${mono ? "font-mono tabular-nums" : ""}`}
    >
      {children}
    </td>
  );
}

export function EncodingHelp({
  open,
  heldSeconds,
  onClose,
}: {
  open: boolean;
  heldSeconds?: number | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/75 supports-backdrop-filter:backdrop-blur-sm"
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        className="flex max-h-[min(90vh,760px)] w-full max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden bg-[#10151c] p-0 text-zinc-100 ring-amber-200/20 sm:max-w-3xl"
      >
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-3 right-3 z-10 text-zinc-100 hover:bg-white/10 hover:text-white"
            aria-label="Close help"
          >
            <XIcon className="size-4" />
          </Button>
        </DialogClose>
        <DialogHeader className="shrink-0 border-b border-white/10 px-5 py-4 pr-14">
          <p className="font-mono text-[10px] tracking-[0.22em] text-amber-200/80">
            ROUND PAUSED
            {heldSeconds != null && heldSeconds > 0
              ? ` · ${heldSeconds}s HELD`
              : ""}
          </p>
          <DialogTitle className="mt-1 text-xl text-zinc-50">
            Encoding help
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-zinc-400">
            Binary, hex, octal, and ASCII in everyday numbers. Close the panel
            with the X to start the clock again.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <IntroCard
              title="Binary"
              kicker="Base 2"
              body="Only two digits: 0 and 1. Each step to the left is worth twice as much: 1, 2, 4, 8, 16, 32, 64, 128."
              example="1010 = 8 + 2 = 10"
            />
            <IntroCard
              title="Hexadecimal"
              kicker="Base 16"
              body="Sixteen symbols: 0–9, then A = 10, B = 11, C = 12, D = 13, E = 14, F = 15. Each step left is worth 16 times as much. 0x means hex."
              example="0x41 = 4 × 16 + 1 = 65"
            />
            <IntroCard
              title="Octal"
              kicker="Base 8"
              body="Eight digits: 0–7. Each step to the left is worth eight times as much: 1, 8, 64, 512."
              example="101₈ = 1 × 64 + 1 = 65"
            />
          </div>

          <section className="mt-6">
            <h3 className="text-sm font-medium text-zinc-100">
              ASCII · the letter A and the letter a
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Computers store letters as numbers. Capital{" "}
              <span className="text-zinc-200">A starts at 65</span>. Lowercase{" "}
              <span className="text-zinc-200">a starts at 97</span>. That is 32
              apart: a = A + 32. The same number can be written in binary, hex,
              or octal — it is still 65 or 97 in everyday counting.
            </p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[40rem] border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <CellHead>LETTER</CellHead>
                    <CellHead>WHAT IT IS</CellHead>
                    <CellHead>DECIMAL</CellHead>
                    <CellHead>BINARY</CellHead>
                    <CellHead>HEX</CellHead>
                    <CellHead>OCTAL</CellHead>
                  </tr>
                </thead>
                <tbody>
                  {ASCII_ROWS.map((row) => (
                    <tr key={row.glyph}>
                      <Cell mono>{row.glyph}</Cell>
                      <Cell>{row.meaning}</Cell>
                      <Cell mono>{row.decimal}</Cell>
                      <Cell mono>{row.binary}</Cell>
                      <Cell mono>{row.hex}</Cell>
                      <Cell mono>{row.octal}</Cell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-medium text-zinc-100">
              How to turn those writings into a decimal number
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Decimal is ordinary counting: 10, 65, 97. Add up each digit times
              its place value.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <ConvertCard
                title="Binary → decimal"
                places="0100 0001"
                steps={[
                  "Places from the right: 1, 2, 4, 8, 16, 32, 64, 128",
                  "Keep the places that are 1: 64 and 1",
                  "64 + 1 = 65, which is A",
                ]}
              />
              <ConvertCard
                title="Hex → decimal"
                places="0x41"
                steps={[
                  "0x means hex. 4 is in the sixteens place, 1 is in the ones",
                  "A–F would count as 10–15 if you see them",
                  "4 × 16 + 1 = 65, which is A",
                ]}
              />
              <ConvertCard
                title="Octal → decimal"
                places="101₈"
                steps={[
                  "Places from the right: 1, 8, 64",
                  "1×64 + 0×8 + 1×1",
                  "64 + 1 = 65, which is A",
                ]}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Lowercase a is the same idea: 97 = 64 + 32 + 1, so binary{" "}
              <span className="font-mono text-zinc-200">0110 0001</span>, hex{" "}
              <span className="font-mono text-zinc-200">0x61</span>, octal{" "}
              <span className="font-mono text-zinc-200">141</span>.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IntroCard({
  title,
  kicker,
  body,
  example,
}: {
  title: string;
  kicker: string;
  body: string;
  example: string;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/30 p-3">
      <p className="font-mono text-[10px] tracking-[0.18em] text-amber-200/70">
        {kicker}
      </p>
      <h3 className="mt-1 text-sm font-medium text-zinc-50">{title}</h3>
      <p className="mt-2 text-sm leading-5 text-zinc-400">{body}</p>
      <p className="mt-3 font-mono text-xs text-amber-100/90">{example}</p>
    </article>
  );
}

function ConvertCard({
  title,
  places,
  steps,
}: {
  title: string;
  places: string;
  steps: string[];
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/30 p-3">
      <h4 className="text-sm font-medium text-zinc-50">{title}</h4>
      <p className="mt-1 font-mono text-xs text-amber-100/90">{places}</p>
      <ol className="mt-2 grid gap-1.5 text-sm leading-5 text-zinc-400">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </article>
  );
}
