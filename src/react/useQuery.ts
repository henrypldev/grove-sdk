import {
	type UseQueryResult,
	useQuery as useTanstackQuery,
} from '@tanstack/react-query'
import { buildUrl, fetchJson } from './fetch'
import { useGrove } from './provider'
import { queryKey } from './queryKeys'
import type { RouteMap, RouteParams, RouteQuery, RouteResponse } from './types'

type UseGroveQueryOptions<
	P extends keyof RouteMap,
	TSelected = RouteResponse<P>,
> = {
	enabled?: boolean
	refetchInterval?: number
	staleTime?: number
	gcTime?: number
	select?: (data: RouteResponse<P>) => TSelected
} & (RouteParams<P> extends undefined ? {} : { params: RouteParams<P> }) &
	(RouteQuery<P> extends undefined
		? { query?: never }
		: { query?: RouteQuery<P> })

export function useQuery<P extends keyof RouteMap, TSelected>(
	path: P,
	options: UseGroveQueryOptions<P, TSelected> & {
		select: (data: RouteResponse<P>) => TSelected
	},
): UseQueryResult<TSelected>
export function useQuery<P extends keyof RouteMap>(
	path: P,
	options?: UseGroveQueryOptions<P>,
): UseQueryResult<RouteResponse<P>>
export function useQuery<P extends keyof RouteMap>(
	path: P,
	options?: UseGroveQueryOptions<P, any>,
): UseQueryResult<any> {
	const { baseUrl } = useGrove()
	const params = (options as { params?: RouteParams<P> } | undefined)?.params
	const query = (options as { query?: RouteQuery<P> } | undefined)?.query

	return useTanstackQuery({
		queryKey: queryKey(path, params, query),
		queryFn: () =>
			fetchJson<RouteResponse<P>>(
				buildUrl(
					baseUrl,
					path,
					params as Record<string, string>,
					query as Record<string, unknown>,
				),
			),
		enabled: options?.enabled,
		refetchInterval: options?.refetchInterval,
		staleTime: options?.staleTime,
		gcTime: options?.gcTime,
		select: options?.select,
	})
}
