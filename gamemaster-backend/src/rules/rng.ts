import { randomInt } from 'node:crypto';

/** Source d'aléa injectable : `cryptoRng` en production, `seededRng` pour les tests et le rejeu. */
export interface Rng {
  /** Entier uniforme dans [min, max] (bornes incluses). */
  int(min: number, max: number): number;
}

export const cryptoRng: Rng = {
  int: (min, max) => randomInt(min, max + 1),
};

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

/** PRNG déterministe (mulberry32). NE PAS utiliser pour les jets réels, uniquement tests et rejeu. */
export function seededRng(seed: string | number): Rng {
  let a = xmur3(String(seed))();
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { int: (min, max) => min + Math.floor(next() * (max - min + 1)) };
}
