import {defineStore} from 'pinia'

export interface CorrelationMap {
    [key: string]: number // feature name -> correlation value
}

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
        correlations: {} as { [key: string]: CorrelationMap} // feature name -> CorrelationMap
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
        },

        calculate_correlations() {
            this.correlations = {}
            for (let feature of this.interacting_features) {
                this.correlations[feature] = {}
                for (let other_feature of this.interacting_features) {
                    if (feature === other_feature) {
                        continue
                    }
                    const correlation = this.calculate_correlation(feature, other_feature)
                    this.correlations[feature][other_feature] = correlation
                }
            }
        },

        calculate_correlation(feature1: string, feature2: string): number {
            const values1 = this.data.map((d) => d[feature1])
            const values2 = this.data.map((d) => d[feature2])
            const mean1 = values1.reduce((acc, v) => acc + v, 0) / values1.length
            const mean2 = values2.reduce((acc, v) => acc + v, 0) / values2.length
            const numerator = values1.reduce((acc, v1, i) => acc + (v1 - mean1) * (values2[i] - mean2), 0)
            const denominator1 = Math.sqrt(values1.reduce((acc, v) => acc + (v - mean1) ** 2, 0))
            const denominator2 = Math.sqrt(values2.reduce((acc, v) => acc + (v - mean2) ** 2, 0))
            return numerator / (denominator1 * denominator2)
        }
    },
})
