import type { State } from '@aldinh777/reactive'
import type { WatchableList } from '@aldinh777/reactive/collection/list.js'
import type { Unsubscribe } from '@aldinh777/reactive/utils/subscription.js'

export interface RektContext {
    onMount(mountHandler: () => Unsubscribe | void): void
    onDismount(dismountHandler: Unsubscribe): void
    dismount(): void
    setTimeout(ms: number, handler: () => any): any
    setInterval(ms: number, handler: () => any): any
}

export interface ServerContext extends RektContext {
    id: string
    connectionId: string
    request: Request
    data: any
    setHeader(name: string, value: string): void
    setStatus(code: number, statusText?: string): void
}

export interface RektProps {
    [prop: string]: any
    children?: RektNode | RektNode[]
}

interface RektElement {
    tag: string | RektComponent
    props: RektProps
}

export type RektNode = string | State | WatchableList<any> | RektElement
export type RektComponent = (
    props: RektProps,
    context: RektContext
) => Promise<RektNode | RektNode[]> | RektNode | RektNode[]

export function jsx(tag: string | RektComponent, props: any): RektElement {
    return { tag, props }
}

export const Fragment: RektComponent = (props) => props.children || []

export function createContext() {
    const unsubscribers: Unsubscribe[] = []
    return {
        onMount(mountHandler: () => void | Unsubscribe) {
            const dismountHandler = mountHandler()
            if (dismountHandler) {
                this.onDismount(dismountHandler)
            }
        },
        onDismount(dismountHandler: Unsubscribe) {
            unsubscribers.push(dismountHandler)
        },
        dismount(): void {
            for (const unsubscribe of unsubscribers.splice(0)) {
                unsubscribe()
            }
        },
        setTimeout(ms: number, handler: () => any) {
            this.onMount(() => {
                const timeout = setTimeout(() => {
                    try {
                        handler()
                    } catch (error) {
                        console.error(error)
                    }
                }, ms)
                return () => clearTimeout(timeout)
            })
        },
        setInterval(ms: number, handler: () => any) {
            this.onMount(() => {
                const interval = setInterval(() => {
                    try {
                        handler()
                    } catch (error) {
                        console.error(error)
                    }
                }, ms)
                return () => clearInterval(interval)
            })
        }
    }
}
