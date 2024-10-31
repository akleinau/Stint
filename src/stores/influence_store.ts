import {defineStore} from "pinia";
import {useDataStore} from "./dataStore";

interface InfluenceScore {
    feature: string,
    score: number,
    size: number,
    value: number,
    instance_value: number
}

export const useInfluenceStore = defineStore({
    id: 'influence',
    state: () => ({
        influence_scores: [] as InfluenceScore[][],
        main_effects: {} as { [key: string]: number },

    }),
    actions: {

        calculate_main_effects() {
            const dataStore = useDataStore()
            let main_effects = {} as { [key: string]: number }
            for (const feature of dataStore.interacting_features) {
                const instance_value = dataStore.instance[feature]
                const similar_instances = dataStore.data.filter((d) => d[feature] === instance_value)
                const sum = similar_instances.reduce((acc, d) => acc + d[dataStore.target_feature], 0)
                const size = similar_instances.length
                main_effects[feature] = sum / size
            }
        },

        calculate_groups() {
            const dataStore = useDataStore()
            this.calculate_main_effects()
            this.influence_scores = []
            //for (const feature of dataStore.interacting_features) {
            //    this.influence_scores.push(this.calculate_group_influence_scores([feature]))
            //}
            this.influence_scores.push(this.calculate_group_influence_scores(dataStore.interacting_features))

        },

        calculate_group_influence_scores(group: string[]) : InfluenceScore[]{
            const dataStore = useDataStore()
            // first sort features by main effect
            const sorted_features = group.sort((a, b) => {
                return Math.abs(dataStore.instance_averages[b].average) - Math.abs(dataStore.instance_averages[a].average)
            })

            // then calculate influence scores
            let id_subset = new Set() as Set<number>
            let influence_scores = [] as { feature: string, score: number, size: number, value: number, instance_value: number }[]
            let previous_value = dataStore.data_summary.mean
            let i = 0
            for (const feature of sorted_features) {
                if (i === 0) {
                    id_subset = dataStore.instance_subsets[feature]
                } else {
                    id_subset = new Set([...id_subset].filter(x => dataStore.instance_subsets[feature].has(x)))
                }
                let subset = dataStore.data.filter((_, i) => id_subset.has(i))
                let average = subset.reduce((acc, d) => acc + d[dataStore.target_feature], 0) / subset.length
                let score = average - previous_value
                previous_value = average
                influence_scores.push({feature: feature, score: score, size: subset.length, value: average, instance_value: dataStore.instance[feature]})
                i++
            }

            return influence_scores

        },


    }
})