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
        main_effects: {} as { [key: string]: { value: number, average: number, size: number } },
        instance_subsets: {} as { [key: string]: Set<number> },

    }),
    actions: {

        calculate_main_effects() {
            const dataStore = useDataStore()
            const center = dataStore.data_summary.mean
            this.main_effects = {}
            for (let feature of dataStore.interacting_features) {
                const instance_value = dataStore.instance[feature]
                const similar_instances = dataStore.data.filter((d) => d[feature] === instance_value)
                const sum = similar_instances.reduce((acc, d) => acc + d[dataStore.target_feature], 0)
                const size = similar_instances.length
                this.main_effects[feature] = {value: instance_value, average: sum / size - center, size: size}
                //also create set of ids for each feature
                const ids = similar_instances.map((d: any) => d.__id__)
                this.instance_subsets[feature] = new Set(ids)
            }
        },

        calculate_interaction_effect(feature1: string, feature2: string) {
            const instance_subset = new Set([...this.instance_subsets[feature1]].filter(x => this.instance_subsets[feature2].has(x)))
            const subset = useDataStore().data.filter((_, i) => instance_subset.has(i))
            let average = subset.reduce((acc, d) => acc + d[useDataStore().target_feature], 0) / subset.length
            average -= useDataStore().data_summary.mean
            console.log(feature1, feature2, average, this.main_effects[feature1].average + this.main_effects[feature2].average)
            return Math.abs(average - this.main_effects[feature1].average - this.main_effects[feature2].average)
        },

        calculate_groups() {
            const dataStore = useDataStore()
            let groups = [] as string[][]

            //first copy the interacting features and sort them by main effect
            let features = [...dataStore.interacting_features]
            features.sort((a, b) => {
                return Math.abs(this.main_effects[b].average) - Math.abs(this.main_effects[a].average)
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

                    //group features that interact together
                    const interaction_boundary = dataStore.data_summary.std * 0.2
                    //const interaction_boundary = (dataStore.data_summary.max - dataStore.data_summary.min) * 0.2
                    if (group.some(f => this.calculate_interaction_effect(f, feature) > interaction_boundary)) {
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
            this.calculate_main_effects()
            this.influence_scores = []
            let groups = this.calculate_groups()
            for (const g of groups) {
                this.influence_scores.push(this.calculate_group_influence_scores(g))
            }

        },

        calculate_group_influence_scores(group: string[]) : InfluenceScore[]{
            const dataStore = useDataStore()
            const center = dataStore.data_summary.mean
            // first sort features by main effect
            const sorted_features = group.sort((a, b) => {
                return Math.abs(this.main_effects[b].average) - Math.abs(this.main_effects[a].average)
            })

            // then calculate influence scores
            let id_subset = new Set() as Set<number>
            let influence_scores = [] as { feature: string, score: number, size: number, value: number, instance_value: number }[]
            let previous_value = 0
            let i = 0
            for (const feature of sorted_features) {
                if (i === 0) {
                    id_subset = this.instance_subsets[feature]
                } else {
                    id_subset = new Set([...id_subset].filter(x => this.instance_subsets[feature].has(x)))
                }
                let subset = dataStore.data.filter((_, i) => id_subset.has(i))
                let average = subset.reduce((acc, d) => acc + d[dataStore.target_feature], 0) / subset.length
                average -= center
                let score = average - previous_value
                previous_value = average
                influence_scores.push({feature: feature, score: score, size: subset.length, value: average, instance_value: dataStore.instance[feature]})
                i++
            }

            return influence_scores

        },


    }
})