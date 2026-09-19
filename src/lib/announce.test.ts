import assert from "node:assert/strict";
import {
  eliminationAnnouncements,
  eliminationLine,
  heartLossCount,
  loseLine,
  questionLine,
  spokenBotName,
  winLine,
} from "./announce";

assert.equal(spokenBotName("ASCII-8"), "ASCII 8");
assert.equal(spokenBotName("NullPtr"), "Null pointer");
assert.equal(
  eliminationLine("ASCII-8", 5),
  "ASCII 8 eliminated, 5 players remaining",
);
assert.equal(
  eliminationLine("Clippy", 1),
  "Clippy eliminated, 1 player remaining",
);
assert.equal(winLine(), "You win.");
assert.equal(loseLine(), "You lose.");
assert.equal(questionLine("  What is 1010 in decimal?  "), "What is 1010 in decimal?");

const seats = [
  { id: "you", name: "Operator", isHuman: true, eliminated: false, health: 3 },
  { id: "clippy", name: "Clippy", isHuman: false, eliminated: false, health: 3 },
  { id: "hexa", name: "Hexa", isHuman: false, eliminated: false, health: 3 },
  { id: "bitwise", name: "Bitwise", isHuman: false, eliminated: false, health: 3 },
  { id: "ascii8", name: "ASCII-8", isHuman: false, eliminated: false, health: 3 },
  { id: "nullptr", name: "NullPtr", isHuman: false, eliminated: false, health: 3 },
];

assert.deepEqual(eliminationAnnouncements(seats, seats), []);
assert.equal(heartLossCount(seats, seats), 0);

const oneOut = seats.map((seat) =>
  seat.id === "ascii8"
    ? { ...seat, eliminated: true, health: 0 }
    : seat,
);
assert.deepEqual(eliminationAnnouncements(seats, oneOut), [
  "ASCII 8 eliminated, 5 players remaining",
]);
assert.equal(heartLossCount(seats, oneOut), 3);

const twoOut = oneOut.map((seat) =>
  seat.id === "clippy" ? { ...seat, eliminated: true, health: 0 } : seat,
);
assert.deepEqual(eliminationAnnouncements(oneOut, twoOut), [
  "Clippy eliminated, 4 players remaining",
]);

const sameRound = seats.map((seat) =>
  seat.id === "ascii8" || seat.id === "clippy"
    ? { ...seat, eliminated: true, health: 0 }
    : seat,
);
assert.deepEqual(eliminationAnnouncements(seats, sameRound), [
  "Clippy eliminated, 5 players remaining",
  "ASCII 8 eliminated, 4 players remaining",
]);

const youAlsoOut = sameRound.map((seat) =>
  seat.id === "you" ? { ...seat, eliminated: true, health: 0 } : seat,
);
assert.ok(
  eliminationAnnouncements(seats, youAlsoOut).every(
    (line) => !line.toLowerCase().includes("operator"),
  ),
);
assert.equal(heartLossCount(seats, youAlsoOut), 9);

const heal = seats.map((seat) =>
  seat.id === "you" ? { ...seat, health: 2 } : seat,
);
assert.equal(heartLossCount(heal, seats), 0);

console.log("announce.test ok");
