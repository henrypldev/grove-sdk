export function toFormData(body: Record<string, unknown>): FormData {
	const fd = new FormData()
	for (const [key, value] of Object.entries(body)) {
		if (value === undefined || value === null) continue
		if (Array.isArray(value)) {
			for (const item of value) {
				fd.append(key, item instanceof File ? item : String(item))
			}
		} else if (value instanceof File) {
			fd.append(key, value)
		} else if (typeof value === 'object') {
			fd.append(key, JSON.stringify(value))
		} else {
			fd.append(key, String(value))
		}
	}
	return fd
}
