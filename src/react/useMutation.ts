import {
	type UseMutationResult,
	useMutation as useTanstackMutation,
} from '@tanstack/react-query'
import { toFormData } from '../shared/formData'
import { buildUrl, fetchJson } from './fetch'
import { useGrove } from './provider'
import type {
	MutationBody,
	MutationKey,
	MutationParams,
	MutationResponse,
} from './types'

function parseMutationKey(key: string): { method: string; path: string } {
	const spaceIdx = key.indexOf(' ')
	return {
		method: key.slice(0, spaceIdx),
		path: key.slice(spaceIdx + 1),
	}
}

type MutationVariables<K extends MutationKey> =
	(MutationParams<K> extends undefined ? {} : { params: MutationParams<K> }) &
		(MutationBody<K> extends undefined ? {} : { body: MutationBody<K> })

function hasFiles(body: unknown): boolean {
	if (!body || typeof body !== 'object') return false
	return Object.values(body as Record<string, unknown>).some(
		v =>
			v instanceof File ||
			(Array.isArray(v) && v.some(item => item instanceof File)),
	)
}

export function useMutation<K extends MutationKey>(
	key: K,
	options?: {
		onSuccess?: (data: MutationResponse<K>) => void
		onError?: (error: Error) => void
	},
): UseMutationResult<MutationResponse<K>, Error, MutationVariables<K>> {
	const { baseUrl } = useGrove()
	const { method, path } = parseMutationKey(key)

	return useTanstackMutation({
		mutationFn: async (variables: MutationVariables<K>) => {
			const params = (variables as { params?: MutationParams<K> } | undefined)
				?.params
			const body = (variables as { body?: MutationBody<K> } | undefined)?.body
			const url = buildUrl(baseUrl, path, params as Record<string, string>)

			const init: RequestInit = { method }

			if (body !== undefined) {
				if (hasFiles(body)) {
					init.body = toFormData(body as Record<string, unknown>)
				} else {
					init.headers = { 'Content-Type': 'application/json' }
					init.body = JSON.stringify(body)
				}
			}

			return fetchJson<MutationResponse<K>>(url, init)
		},
		onSuccess: options?.onSuccess as any,
		onError: options?.onError,
	})
}
