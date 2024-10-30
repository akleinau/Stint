import {defineStore} from 'pinia'

export const useDataStore = defineStore({
    id: 'data',
    state: () => ({
        data: [] as { [key: string]: number }[],
        feature_names: [] as string[],
        target_feature: "" as string,
        data_summary: {} as { min: number, max: number, mean: number },
        non_target_features: [] as string[],
        interacting_features: [] as string[],
        instance: {} as { [key: string]: number },
        instance_averages: {} as { [key: string]: { value: number, average: number, size: number } },
        instance_subsets: {} as { [key: string]: Set<number> },
        storyIsVisible: false,
    }),
    actions: {
        calculate_instance_averages() {
            this.instance_averages = {}
            for (let feature of this.interacting_features) {
                const instance_value = this.instance[feature]
                const similar_instances = this.data.filter((d) => d[feature] === instance_value)
                const sum = similar_instances.reduce((acc, d) => acc + d[this.target_feature], 0)
                const size = similar_instances.length
                this.instance_averages[feature] = {value: instance_value, average: sum / size, size: size}
                //also create set of ids for each feature
                const ids = similar_instances.map((d: any) => d.__id__)
                this.instance_subsets[feature] = new Set(ids)
            }
        },

        reset() {
            this.data = []
            this.feature_names = []
            this.target_feature = ""
            this.data_summary = {min: 0, max: 0, mean: 0}
            this.non_target_features = []
            this.interacting_features = []
            this.instance = {}
            this.instance_averages = {}
            this.instance_subsets = {}
        }
    },
})
