import {defineStore} from 'pinia'

export const useDataStore = defineStore({
    id: 'data',
    state: () => ({
        feature_names: [] as string[],
        target_feature: "" as string,
        non_target_features:[] as string[],
        interacting_features:[] as string[]
    }),
    actions: {
    },
})
