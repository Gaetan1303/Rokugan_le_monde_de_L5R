import type { DiceRolledData } from '../contract/index.js';
import type { Rng } from './rng.js';

/**
 * Règles de lancer. Les valeurs par défaut décrivent le « roll & keep » de L5R 4e édition
 * telle que je la comprends. ⚠️ À VALIDER AVEC LE LIVRE avant la mise en production
 * (explosion des 10, plafonds, bonus de surplus, relances). Tout est configurable ici
 * pour que corriger une règle ne demande jamais de toucher à la logique.
 */
export interface DiceRuleset {
  sides: number;
  /** Un dé qui affiche cette valeur est relancé et additionné. `null` désactive l'explosion. */
  explodeOn: number | null;
  /** Garde-fou contre une boucle d'explosions. */
  maxExplosionsPerDie: number;
  /** Au-delà de ce nombre de dés lancés, le surplus est converti en dés gardés. */
  maxRolled: number;
  /** Nombre de dés lancés en trop nécessaires pour gagner 1 dé gardé. */
  surplusRolledPerKept: number;
  /** Plafond de dés gardés ; chaque dé gardé en trop donne un bonus fixe. */
  maxKept: number;
  surplusKeptBonus: number;
  /** Points de marge nécessaires pour une relance (raise). */
  raiseStep: number;
}

export const L5R_4E: DiceRuleset = {
  sides: 10,
  explodeOn: 10,
  maxExplosionsPerDie: 20,
  maxRolled: 10,
  surplusRolledPerKept: 2,
  maxKept: 10,
  surplusKeptBonus: 2,
  raiseStep: 5,
};

export interface RollRequest {
  rolled: number;
  kept: number;
  modifier?: number;
  /** Degré de difficulté (TN). */
  tn?: number;
  /** Faux pour un jet sans compétence (pas d'explosion en 4e). */
  explode?: boolean;
  /** Spécialisation : un 1 initial est relancé une fois. */
  emphasis?: boolean;
}

export interface DieResult {
  /** Faces successives : [10, 7] signifie un 10 qui a explosé en 7 (valeur 17). */
  faces: number[];
  value: number;
  kept: boolean;
}

export interface RollResult {
  rolled: number;
  kept: number;
  dice: DieResult[];
  bonus: number;
  modifier: number;
  total: number;
  tn?: number;
  success?: boolean;
  raises?: number;
}

/** Applique les plafonds de dés lancés / gardés. */
export function normalizePool(rolled: number, kept: number, rules: DiceRuleset = L5R_4E) {
  let r = rolled;
  let k = kept;
  let bonus = 0;
  if (r > rules.maxRolled) {
    k += Math.floor((r - rules.maxRolled) / rules.surplusRolledPerKept);
    r = rules.maxRolled;
  }
  if (k > rules.maxKept) {
    bonus += (k - rules.maxKept) * rules.surplusKeptBonus;
    k = rules.maxKept;
  }
  k = Math.min(k, r);
  return { rolled: r, kept: k, bonus };
}

export function rollAndKeep(req: RollRequest, rng: Rng, rules: DiceRuleset = L5R_4E): RollResult {
  if (!Number.isInteger(req.rolled) || !Number.isInteger(req.kept) || req.rolled < 1 || req.kept < 1) {
    throw new RangeError('rolled et kept doivent être des entiers ≥ 1');
  }
  if (req.rolled > 100 || req.kept > 100) {
    throw new RangeError('rolled et kept sont limités à 100');
  }
  const modifier = req.modifier ?? 0;
  if (!Number.isInteger(modifier) || Math.abs(modifier) > 1000) {
    throw new RangeError('modifier invalide');
  }
  if (req.tn !== undefined && (!Number.isInteger(req.tn) || req.tn < 0 || req.tn > 1000)) {
    throw new RangeError('tn invalide');
  }

  const pool = normalizePool(req.rolled, req.kept, rules);
  const canExplode = (req.explode ?? true) && rules.explodeOn !== null;

  const dice: DieResult[] = [];
  for (let i = 0; i < pool.rolled; i++) {
    let first = rng.int(1, rules.sides);
    const faces: number[] = [first];
    if (req.emphasis && first === 1) {
      first = rng.int(1, rules.sides);
      faces.push(first); // la face « 1 » est conservée dans l'historique, la relance remplace la valeur
    }
    let value = first;
    let last = first;
    let explosions = 0;
    while (canExplode && last === rules.explodeOn && explosions < rules.maxExplosionsPerDie) {
      last = rng.int(1, rules.sides);
      faces.push(last);
      value += last;
      explosions++;
    }
    dice.push({ faces, value, kept: false });
  }

  // Garde les `kept` meilleurs dés (à égalité, l'ordre de lancer départage).
  [...dice.keys()]
    .sort((a, b) => dice[b].value - dice[a].value || a - b)
    .slice(0, pool.kept)
    .forEach((idx) => { dice[idx].kept = true; });

  const keptSum = dice.filter((d) => d.kept).reduce((s, d) => s + d.value, 0);
  const total = keptSum + pool.bonus + modifier;

  const result: RollResult = {
    rolled: pool.rolled,
    kept: pool.kept,
    dice,
    bonus: pool.bonus,
    modifier,
    total,
  };
  if (req.tn !== undefined) {
    result.tn = req.tn;
    result.success = total >= req.tn;
    result.raises = result.success ? Math.floor((total - req.tn) / rules.raiseStep) : 0;
  }
  return result;
}

/** Convertit un résultat en payload de l'événement `dice.rolled`. */
export function toDiceRolledData(
  result: RollResult,
  meta: { rollId: string; hidden: boolean; characterId?: string; label?: string },
): DiceRolledData {
  return {
    rollId: meta.rollId,
    ...(meta.characterId ? { characterId: meta.characterId } : {}),
    ...(meta.label ? { label: meta.label } : {}),
    rolled: result.rolled,
    kept: result.kept,
    dice: result.dice,
    modifier: result.modifier + result.bonus,
    total: result.total,
    ...(result.tn !== undefined ? { tn: result.tn, success: result.success, raises: result.raises } : {}),
    hidden: meta.hidden,
  };
}
