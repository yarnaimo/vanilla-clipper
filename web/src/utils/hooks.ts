import { Reducer, useReducer, useState } from 'react'

export const useComputed = <F extends (value: V) => any, V>(
    fn: F,
    initialValue: V,
) => {
    return useReducer<Reducer<ReturnType<F>, V>>(
        (prev, newValue) => fn(newValue),
        fn(initialValue),
    )
}

export const useBool = (initialValue: boolean) => {
    const [value, setValue] = useState(initialValue)
    return {
        value,
        setTrue: () => setValue(true),
        setFalse: () => setValue(false),
    }
}
