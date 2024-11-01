import {defineStore} from "pinia";
import {useDataStore} from "./dataStore";

interface InfluenceScore {
    label: string,
    score: number,
    size: number,
    value: number,
}

interface Group {
    features: (SingleGroup)[],
    type: string,
}

interface SingleGroup {
    feature: string,
}

interface ScoreGroup extends Group {
    scores: InfluenceScore[],
}

export const useInfluenceStore = defineStore({
    id: 'influence',
    state: () => ({
        groups: [] as ScoreGroup[],
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
            return Math.abs(average - this.main_effects[feature1].average - this.main_effects[feature2].average)
        },

        calculate_groups() {
            const dataStore = useDataStore()
            let groups = [] as Group[]

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
                    if (group.type == "single" || group.type == "correlation")
                    {
                        if (group.features.some(f => dataStore.correlations[f.feature][feature] > 0.5)) {
                            group.features.push({feature:feature})
                            group.type = "correlation"
                            added = true
                            break
                        }
                    }

                    if (group.type == "single" || group.type == "interaction") {
                        //group features that interact together
                        const interaction_boundary = dataStore.data_summary.std * 0.2
                        //const interaction_boundary = (dataStore.data_summary.max - dataStore.data_summary.min) * 0.2
                        if (group.features.some(f => this.calculate_interaction_effect(f.feature, feature) > interaction_boundary)) {
                            group.features.push({feature:feature})
                            group.type = "interaction"
                            added = true
                            break
                        }
                    }

                }
                if (!added) {
                    groups.push({features: [{feature:feature}], type: "single"})
                }
            }

            return groups
        },

        calculate_influences() {
            this.calculate_main_effects()
            this.groups = []
            let groups = this.calculate_groups()
            for (const g of groups) {
                this.groups.push({features: g.features, type: g.type, scores: this.calculate_group_influence_scores(g)})
            }

        },

        calculate_group_influence_scores(group: Group) : InfluenceScore[]{
            if (group.type == "single") {
                return this.calculate_group_single_score(group)
            }
            else if (group.type == "correlation") {
                return this.calculate_group_correlation_score(group)
            }
            else if (group.type == "interaction") {
                return this.calculate_group_interaction_scores(group)
            }
            return []
        },

        calculate_group_single_score(group: Group) : InfluenceScore[]{
            const dataStore = useDataStore()
            const center = dataStore.data_summary.mean
            let influence_scores = [] as InfluenceScore[]
            for (const feature of group.features) {
                let subset = dataStore.data.filter((d) => d[feature.feature] === dataStore.instance[feature.feature])
                let average = subset.reduce((acc, d) => acc + d[dataStore.target_feature], 0) / subset.length
                average -= center
                const label = feature.feature + " = " + dataStore.instance[feature.feature]
                influence_scores.push({label: label, score: average, size: subset.length, value: average })
            }

            return influence_scores
        },

        calculate_group_correlation_score(group: Group) : InfluenceScore[]{
            // only considers first feature
            const dataStore = useDataStore()
            const center = dataStore.data_summary.mean
            let influence_scores = [] as InfluenceScore[]
            let feature = group.features[0]
            let subset = dataStore.data.filter((d) => d[feature.feature] === dataStore.instance[feature.feature])
            let average = subset.reduce((acc, d) => acc + d[dataStore.target_feature], 0) / subset.length
            average -= center
            const feature_names_joined = group.features.map(f => f.feature).join(", ")
            influence_scores.push({label: feature_names_joined, score: average, size: subset.length, value: average})
            return influence_scores
        },

        calculate_group_interaction_scores(group: Group) : InfluenceScore[]{
            const dataStore = useDataStore()
            const center = dataStore.data_summary.mean
            // first sort features by main effect
            const sorted_features = group.features.sort((a, b) => {
                return Math.abs(this.main_effects[b].average) - Math.abs(this.main_effects[a].average)
            })

            // then calculate influence scores
            let id_subset = new Set() as Set<number>
            let influence_scores = [] as InfluenceScore[]
            let previous_value = 0
            let i = 0
            for (const feature of sorted_features) {
                if (i === 0) {
                    id_subset = this.instance_subsets[feature.feature]
                } else {
                    id_subset = new Set([...id_subset].filter(x => this.instance_subsets[feature.feature].has(x)))
                }
                let subset = dataStore.data.filter((_, i) => id_subset.has(i))
                let average = subset.reduce((acc, d) => acc + d[dataStore.target_feature], 0) / subset.length
                average -= center
                let score = average - previous_value
                previous_value = average
                const label = feature.feature + " = " + dataStore.instance[feature.feature]
                influence_scores.push({label: label, score: score, size: subset.length, value: average})
                i++
            }

            return influence_scores

        },


    }
})