/**
 * Normalise un paramètre de route Express 5.
 * Selon le matcher utilisé, Express peut typer un paramètre comme `string | string[]`.
 * Nos routes métier attendent ici une valeur scalaire : en cas de tableau, on conserve
 * la première valeur et on retourne une chaîne vide lorsque le paramètre est absent.
 */
export function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}
