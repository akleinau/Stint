import {defineStore} from 'pinia'
import {Feature} from './influence_store.ts'

export const useDetailStore = defineStore({
    id: 'detail',
    state: () => ({
        selected_feature: null as Feature | null,

    }),
    actions: {
    }
})