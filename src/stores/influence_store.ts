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

    }),
    actions: {

        calculate_groups() {
            const dataStore = useDataStore()
            let groups = [] as string[][]

            //first copy the interacting features and sort them by main effect
            let features = [...dataStore.interacting_features]
            features.sort((a, b) => {
                return Math.abs(dataStore.instance_averages[a].average) - Math.abs(dataStore.instance_averages[b].average)
            })

            //then go through them and either add them to a previous group when they interact, or create a new group
            for (const feature of features) {
                let added = false
                for (const group of groups) {

                    // group highly correlated features together
                    if (group.some(f => dataStore.correlations[f][feature] > 0.5)) {
                        group.push(feature)
                        added = true
                        break
                    }
                }
                if (!added) {
                    groups.push([feature])
                }
            }

            return groups
        },

        calculate_influences() {
            this.influence_scores = []
            let groups = this.calculate_groups()
            for (const g of groups) {
                this.influence_scores.push(this.calculate_group_influence_scores(g))
            }

        },

        calculate_group_influence_scores(group: string[]) : InfluenceScore[]{
            const dataStore = useDataStore()
            // first sort features by main effect
            const sorted_features = group.sort((a, b) => {
                return Math.abs(dataStore.instance_averages[a].average) - Math.abs(dataStore.instance_averages[b].average)
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