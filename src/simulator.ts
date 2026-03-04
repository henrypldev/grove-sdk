import { TypedEmitter } from './events'

export interface SimulatorOptions {
	/** Grove server URL (http/https). Will be converted to ws/wss for WebSocket. */
	url: string
	/** Simulator device UDID to stream */
	deviceId: string
}

export interface SimulatorEventMap {
	frame: (data: ArrayBuffer) => void
	booted: (info: { deviceId: string; width: number; height: number; scale: number }) => void
	error: (message: string) => void
	connected: () => void
	disconnected: () => void
}

export class SimulatorClient extends TypedEmitter<SimulatorEventMap> {
	private ws: WebSocket | null = null
	private options: SimulatorOptions

	constructor(options: SimulatorOptions) {
		super()
		this.options = options
	}

	connect(): void {
		if (this.ws) return

		const base = this.options.url
			.replace('https://', 'wss://')
			.replace('http://', 'ws://')
			.replace(/\/ws\/?$/, '')
		const wsUrl = `${base}/v2/simulator/ws?deviceId=${encodeURIComponent(this.options.deviceId)}`

		this.ws = new WebSocket(wsUrl)
		this.ws.binaryType = 'arraybuffer'

		this.ws.onopen = () => {
			this.emit('connected')
		}

		this.ws.onmessage = (event) => {
			if (event.data instanceof ArrayBuffer) {
				this.emit('frame', event.data)
				return
			}
			try {
				const msg = JSON.parse(event.data as string)
				if (msg.type === 'booted') {
					this.emit('booted', {
						deviceId: msg.deviceId,
						width: msg.width,
						height: msg.height,
						scale: msg.scale,
					})
				} else if (msg.type === 'error') {
					this.emit('error', msg.message)
				}
			} catch {}
		}

		this.ws.onclose = () => {
			this.ws = null
			this.emit('disconnected')
		}

		this.ws.onerror = () => {
			this.emit('error', 'WebSocket connection failed')
		}
	}

	disconnect(): void {
		if (!this.ws) return
		this.ws.onclose = null
		this.ws.close()
		this.ws = null
		this.emit('disconnected')
	}

	/** Send a touch event to the simulator */
	touch(x: number, y: number, phase: 'began' | 'moved' | 'ended'): void {
		this.send({ type: 'touch', x, y, phase })
	}

	/** Send a key event to the simulator */
	key(keyCode: number, isDown: boolean): void {
		this.send({ type: 'key', keyCode, isDown })
	}

	/** Press a hardware button */
	button(button: 'home' | 'lock' | 'appSwitcher'): void {
		this.send({ type: 'button', button })
	}

	/** Paste text into the simulator */
	paste(text: string): void {
		this.send({ type: 'paste', text })
	}

	/** Open a URL in the simulator */
	openUrl(url: string): void {
		this.send({ type: 'openurl', text: url })
	}

	private send(msg: Record<string, unknown>): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(msg))
		}
	}
}
