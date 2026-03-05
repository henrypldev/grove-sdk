import type { Team, TeamActivity } from './shared/types'
import { toFormData } from './shared/formData'

export class GroveRestClient {
	private baseUrl: string

	constructor(wsUrl: string) {
		this.baseUrl = wsUrl
			.replace('wss://', 'https://')
			.replace('ws://', 'http://')
			.replace(/\/ws\/?$/, '')
	}

	identity = {
		get: async (): Promise<{ tailscaleId: number | null }> => {
			const res = await fetch(`${this.baseUrl}/v2/identity`)
			if (!res.ok) {
				const err = await res.json()
				throw new Error(err.error ?? `HTTP ${res.status}`)
			}
			return res.json()
		},
	}

	teams = {
		create: async (params: {
			repoId: string
			task: string
			files?: File[]
		}): Promise<Team | { teams: Team[] }> => {
			const formData = toFormData({
				repoId: params.repoId,
				task: params.task,
				files: params.files,
			})
			const res = await fetch(`${this.baseUrl}/v2/teams`, {
				method: 'POST',
				body: formData,
			})
			if (!res.ok) {
				const err = await res.json()
				throw new Error(err.error ?? `HTTP ${res.status}`)
			}
			return res.json()
		},

		sendMessage: async (params: {
			id: string
			text: string
			files?: File[]
			answers?: Record<string, string>
		}): Promise<TeamActivity> => {
			const formData = toFormData({
				text: params.text,
				files: params.files,
				answers: params.answers,
			})
			const res = await fetch(
				`${this.baseUrl}/v2/teams/${params.id}/messages`,
				{
					method: 'POST',
					body: formData,
				},
			)
			if (!res.ok) {
				const err = await res.json()
				throw new Error(err.error ?? `HTTP ${res.status}`)
			}
			return res.json()
		},
	}
}
