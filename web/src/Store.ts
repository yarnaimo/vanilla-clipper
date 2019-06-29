import { createConnectedStoreAs, EffectsAs } from 'undux'

const initialState = {
    layout: {
        isLow: false,
        CEToolbar: false,
    },
}

const effects: EffectsAs<typeof initialState> = ({ layout }) => {
    return { layout }
}

export const { Container, useStores } = createConnectedStoreAs(
    initialState,
    effects,
)
