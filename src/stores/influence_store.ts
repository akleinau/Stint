import {defineStore} from "pinia";
import {useDataStore} from "./dataStore";

export const useInfluenceStore = defineStore({
    id: 'influence',
    state: () => ({
        influence_scores: [] as { feature: string, score: number, size: number, value: number, instance_value: number }[],

    }),
    actions: {

        calculate_sorted_influence_scores() {
            const dataStore = useDataStore()
            // first sort features by main effect
            const sorted_features = dataStore.interacting_features.sort((a, b) => {
                return Math.abs(dataStore.instance_averages[b].average) - Math.abs(dataStore.instance_averages[a].average)
            })
            console.log(sorted_features)

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

            this.influence_scores = influence_scores
            console.log(influence_scores)

        },


    }
})