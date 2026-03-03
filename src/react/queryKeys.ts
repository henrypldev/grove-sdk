export function queryKey(
	path: string,
	params?: unknown,
	query?: unknown,
): [string, unknown, unknown] {
	return [path, params ?? null, query ?? null]
}
