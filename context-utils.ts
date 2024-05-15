import type { State } from '@aldinh777/reactive'
import { computed, setEffect } from '@aldinh777/reactive/utils'
import { Context } from './jsx-runtime.js'

export function asyncUtils(context: Context, onError?: (error: any) => any) {
    const asyncHandler = (asyncFn: Function, cleanupFn: Function) => (handler: () => any, ms: number) => {
        context.onMount(() => {
            const asyncId = asyncFn(() => {
                try {
                    handler()
                } catch (error) {
                    onError?.(error)
                }
            }, ms)
            return () => cleanupFn(asyncId)
        })
    }
    return {
        setTimeout: asyncHandler(setTimeout, clearTimeout),
        setInterval: asyncHandler(setInterval, clearInterval)
    }
}

export function reactiveUtils(context: Context, onError?: (error: any) => any) {
    const wrapError = <T>(handler: (...args: any[]) => T) => {
        let oldValue: T
        return (...args: any[]) => {
            try {
                oldValue = handler(...args)
            } catch (error) {
                onError?.(error)
            }
            return oldValue
        }
    }
    return {
        computed<T, U>(computer: (...values: T[]) => U, states?: State<T>[]) {
            const wrapperComputer = wrapError(computer)
            const state = states ? computed(wrapperComputer, states) : computed(wrapperComputer)
            context.onDismount(() => state.stop())
            return state
        },
        setEffect<T>(effect: (...values: T[]) => any, states?: State<T>[]) {
            const wrappedEffect = wrapError(effect)
            if (states) {
                context.onDismount(setEffect(wrappedEffect, states))
            } else {
                context.onDismount(setEffect(wrappedEffect))
            }
        }
    }
}
