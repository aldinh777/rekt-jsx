import type { State } from '@aldinh777/reactive'
import { computed, computedStatic, setEffect, setEffectStatic } from '@aldinh777/reactive/utils'
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
        computed<T>(computer: () => T) {
            const wrapperComputer = wrapError(computer)
            const state = computed(wrapperComputer)
            context.onDismount(() => state.stop())
            return state
        },
        computedStatic<T, U>(states: State<T>[], computer: (...values: T[]) => U) {
            const wrappedComputer = wrapError(computer)
            const state = computedStatic(states, wrappedComputer)
            context.onDismount(() => state.stop)
            return state
        },
        setEffect(effect: () => any) {
            const wrappedEffect = wrapError(effect)
            context.onDismount(setEffect(wrappedEffect))
        },
        setEffectStatic<T>(states: State<T>[], effect: (...values: T[]) => any) {
            const wrappedEffect = wrapError(effect)
            context.onDismount(setEffectStatic(states, wrappedEffect))
        }
    }
}
