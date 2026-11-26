/**
 * `DataSource.query()` de TypeORM ne renvoie pas la même forme selon la commande SQL :
 *  - SELECT / INSERT … RETURNING : un tableau de lignes ;
 *  - UPDATE / DELETE … RETURNING : `[lignes, nombreDeLignesAffectées]`.
 * Cette fonction renvoie toujours le tableau de lignes.
 */
export function rowsOf<T = Record<string, unknown>>(raw: unknown): T[] {
  if (!Array.isArray(raw)) return [];
  if (raw.length === 2 && Array.isArray(raw[0]) && typeof raw[1] === 'number') return raw[0] as T[];
  return raw as T[];
}
