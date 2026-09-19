export function spokenBotName(name: string): string {
  return name.replace(/-/g, " ").replace(/Ptr/g, " pointer");
}

export function eliminationLine(name: string, remaining: number): string {
  const n = Math.max(0, remaining);
  const players = n === 1 ? "player" : "players";
  return `${spokenBotName(name)} eliminated, ${n} ${players} remaining`;
}

export function winLine(): string {
  return "You win.";
}

export function loseLine(): string {
  return "You lose.";
}

export function questionLine(text: string): string {
  return text.trim();
}

type SeatSnap = {
  id: string;
  name: string;
  isHuman: boolean;
  eliminated: boolean;
  health: number;
};

export function eliminationAnnouncements(
  prev: SeatSnap[],
  next: SeatSnap[],
): string[] {
  const wasOut = new Set(
    prev.filter((player) => player.eliminated).map((player) => player.id),
  );
  const newly = next.filter(
    (player) => !player.isHuman && player.eliminated && !wasOut.has(player.id),
  );
  let remaining = next.filter((player) => !player.eliminated).length + newly.length;
  return newly.map((bot) => {
    remaining -= 1;
    return eliminationLine(bot.name, remaining);
  });
}

export function heartLossCount(prev: SeatSnap[], next: SeatSnap[]): number {
  let lost = 0;
  for (const player of next) {
    const before = prev.find((item) => item.id === player.id);
    if (before && player.health < before.health) {
      lost += before.health - player.health;
    }
  }
  return lost;
}
