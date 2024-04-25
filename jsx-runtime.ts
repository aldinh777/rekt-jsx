import type { State } from '@aldinh777/reactive'
import type { WatchableList } from '@aldinh777/reactive/list/watchable.js'
import type { Unsubscribe } from '@aldinh777/reactive/utils/subscription.js'

declare global {
    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any
        }
    }
}

export interface Context {
    onMount(mountHandler: () => Unsubscribe | void): void
    onDismount(dismountHandler: Unsubscribe): void
    dismount(): void
}

export interface ServerContext extends Context {
    contextId: string
    connectionId: string
    request: Request
    responseData: ResponseInit
    params: Record<string, string | undefined>
}

export interface Props extends Record<string, any> {
    children?: Node | Node[]
}

interface Element {
    tag: string | Component
    props: Props
}

export type Node = string | State | WatchableList<any> | Element
export type Component = (props: Props, context: Context) => Promise<Node | Node[]> | Node | Node[]

export function jsx(tag: string | Component, props: any): Element {
    return { tag, props }
}

export const Fragment: Component = (props) => props.children || []

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
        }
    }
}
