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
        instance: {} as { [key: string]: any },
        instance_averages: {} as { [key: string]: { value: number, average: number, size: number } },
        instance_subsets: {} as { [key: string]: Set<number> },
        influence_scores: [] as { feature: string, score: number, size: number, value: number, instance_value: number }[],
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

        calculate_sorted_influence_scores() {
            // first sort features by main effect
            const sorted_features = this.interacting_features.sort((a, b) => {
                return Math.abs(this.instance_averages[b].average) - Math.abs(this.instance_averages[a].average)
            })
            console.log(sorted_features)

            // then calculate influence scores
            let id_subset = new Set() as Set<number>
            let influence_scores = [] as { feature: string, score: number, size: number, value: number, instance_value: number }[]
            let previous_value = this.data_summary.mean
            let i = 0
            for (const feature of sorted_features) {
                if (i === 0) {
                    id_subset = this.instance_subsets[feature]
                } else {
                    id_subset = new Set([...id_subset].filter(x => this.instance_subsets[feature].has(x)))
                }
                let subset = this.data.filter((_, i) => id_subset.has(i))
                let average = subset.reduce((acc, d) => acc + d[this.target_feature], 0) / subset.length
                let score = average - previous_value
                previous_value = average
                influence_scores.push({feature: feature, score: score, size: subset.length, value: average, instance_value: this.instance[feature]})
                i++
            }

            this.influence_scores = influence_scores
            console.log(influence_scores)

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
            this.influence_scores = []
        }
    },
})
