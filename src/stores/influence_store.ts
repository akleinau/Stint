import {defineStore} from "pinia";
import {useDataStore} from "./dataStore";

interface InfluenceScore {
    label: string,
    score: number,
    size: number,
    value: number,
}

interface GroupInterface {
    get_ids(): Set<number>,
    get_score(): number,
    get_size(): number,
    get_name(): string,
}

export class Group implements GroupInterface, InfluenceScore{
    features: (Feature)[] = []
    type: string = ""
    ids: Set<number> = new Set()
    score: number = 0
    value: number = 0
    label: string = ""
    size: number = 0
    isOpen: boolean = true
    constructor(features: (Feature)[], type: string) {
        this.features = features
        this.type = type
        this.ids = new Set([...features[0].get_ids()])
        for (const feature of this.features.slice(1)) {
            this.ids = new Set([...this.ids].filter(x => feature.get_ids().has(x)))
        }

        this.score = this.get_score()
        this.value = this.score
        this.size = this.get_size()
        this.label = this.get_name()

    }

    add_feature(feature: Feature) {
        const previous_value = this.get_score()
        this.ids = new Set([...this.ids].filter(x => feature.get_ids().has(x)))
        const average = this.get_score()
        const score = average - previous_value

        feature.set_new_influence(score, average)
        this.features.push(feature)

        this.score = average
        this.value = average
        this.size = this.get_size()
        this.label = this.get_name()
    }

    get_score() {
        return useInfluenceStore().get_average_influence(this.get_ids())
    }

    get_name() {
        return this.features.map(f => f.feature).join(", ")
    }

    get_ids() {
        return this.ids
    }

    get_size() {
        return this.get_ids().size
    }

    get_nr_features() {
        return this.features.length
    }

    get_nr_bars() {
        if (this.isOpen) {
            return this.get_nr_features()
        }
        return 1
    }

    get_features() {
        return this.features
    }

}

class Feature implements GroupInterface, InfluenceScore{
    feature: string = ""
    score: number = 0
    value: number = 0
    size: number = 0
    label: string = ""
    constructor(feature: string) {
        this.feature = feature
        this.score = useInfluenceStore().main_effects[feature].average
        this.value = this.score
        this.size = useInfluenceStore().main_effects[feature].size
        this.label = feature + " = " + useDataStore().instance[this.feature]
    }

    set_new_influence(score: number, value: number) {
        this.score = score
        this.value = value
    }

    get_ids() {
        return useInfluenceStore().instance_subsets[this.feature]
    }

    get_score() {
        return this.score
    }

    get_size() {
        return this.size
    }

    get_name() {
        return this.label
    }

}

export const useInfluenceStore = defineStore({
    id: 'influence',
    state: () => ({
        groups: [] as Group[],
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
            const average = this.get_average_influence(instance_subset)
            return Math.abs(average - this.main_effects[feature1].average - this.main_effects[feature2].average)
        },

        calculate_groups() {
            const dataStore = useDataStore()
            let groups = [] as Group[]

            //first copy the interacting features and sort them by main effect
            let features = [...dataStore.interacting_features]
            features.sort(this.sort_by_main_effect)

            //then go through them and either add them to a previous group when they interact, or create a new group
            for (const feature of features) {
                let added = false
                for (const group of groups) {

                    // group highly correlated features together
                    if (group.type == "single" || group.type == "correlation")
                    {
                        if (group.features.some(f => dataStore.correlations[f.feature][feature] > 0.5)) {
                            group.add_feature(new Feature(feature))
                            group.type = "correlation"
                            group.isOpen = false
                            added = true
                            break
                        }
                    }

                    if (group.type == "single" || group.type == "interaction") {
                        //group features that interact together
                        const interaction_boundary = dataStore.data_summary.std * 0.2
                        //const interaction_boundary = (dataStore.data_summary.max - dataStore.data_summary.min) * 0.2
                        if (group.features.some(f => this.calculate_interaction_effect(f.feature, feature) > interaction_boundary)) {
                            group.add_feature(new Feature(feature))
                            group.type = "interaction"
                            added = true
                            break
                        }
                    }

                }
                if (!added) {
                    groups.push(new Group([new Feature(feature)], "single"))
                }
            }

            return groups
        },

        calculate_influences() {
            this.calculate_main_effects()
            this.groups = this.calculate_groups()

        },

        get_average_influence(ids: Set<number>): number {
            let subset =  useDataStore().data.filter((_, i) => ids.has(i))
            let average = subset.reduce((acc, d) => acc + d[useDataStore().target_feature], 0) / subset.length
            let center = useDataStore().data_summary.mean
            return average - center
        },

        sort_by_main_effect(a: string, b: string) {
            return Math.abs(useInfluenceStore().main_effects[b].average) - Math.abs(useInfluenceStore().main_effects[a].average)
        }
    }
})