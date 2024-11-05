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

    set_parent(parent: Group): void,
}

export class Group implements GroupInterface, InfluenceScore {
    features: (Feature | Group)[] = []
    type: string = ""
    ids: Set<number> = new Set()
    score: number = 0
    value: number = 0
    label: string = ""
    size: number = 0
    isOpen: boolean = false
    parent: Group | null = null

    constructor(features: (Feature| Group)[], type: string) {
        //first sort the features by score
        features.sort((a, b) => a.get_score() - b.get_score())
        this.features = features
        for (const feature of this.features) {
            feature.set_parent(this)
        }

        this.set_new_influences(new Set([...features[0].get_ids()]), 0)

        this.type = type

        this.size = this.get_size()
        this.label = this.get_name()
        this.parent = null

    }
    set_parent(parent: Group) {
        this.parent = parent
    }

    push(feature: Feature | Group) {
        const previous_score = this.get_score()
        feature.set_new_influences(this.ids, previous_score)
        feature.set_parent(this)

        this.ids = new Set([...feature.get_ids()])
        const new_score = useInfluenceStore().get_average_influence(this.get_ids())
        const difference = new_score - previous_score

        this.features.push(feature)

        this.score += difference
        this.value = new_score
        this.size = this.get_size()
        this.label = this.get_name()
    }

    set_new_influences(ids: Set<number>, previous_value: number) {
        let current_ids = ids
        let current_value = previous_value
        for (const group of this.features) {
            group.set_new_influences(current_ids, current_value)
            current_ids = group.get_ids()
            current_value = group.get_value()
        }
        this.ids = current_ids
        let new_value = useInfluenceStore().get_average_influence(current_ids)
        let difference = new_value - previous_value
        this.score = difference
        this.value = new_value
    }

    get_score() {
        return this.score
    }

    get_value() {
        return this.value
    }

    calculate_interaction_effect(feature: Feature | Group) {
        let our_score = this.get_score()
        let their_score = feature.get_score()
        let combined_ids = new Set([...this.get_ids()].filter(x => feature.get_ids().has(x)))
        let combined_score = useInfluenceStore().get_average_influence(combined_ids)
        return Math.abs(combined_score - our_score - their_score)
    }

    get_name() : string {
        return this.features.map(f => f.get_name()).join(", ")
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

    vis_group(crawler: any, isLast: boolean, updater: any) {

        if (this.isOpen && this.get_nr_features() > 1) {
            let initial_offset = crawler.offset
            for (let j = 0; j < this.get_nr_features(); j++) {
                this.features[j].vis_group(crawler, isLast && j == this.get_nr_features() -1 , updater)
            }
            let final_offset = crawler.offset

            // add a rectangle around the group
            crawler.layers[0].append("rect")
                .on("click", () => {
                    this.isOpen = !this.isOpen
                    updater.value += 1
                })
                .attr("x", 0)
                .attr("y", initial_offset)
                .attr("width", 500)
                .attr("height", final_offset - initial_offset)
                .attr("fill", "#CCCCCC")
                .style("opacity", 0.2)
                .style("cursor", "pointer")

        } else {

            let d = this

            crawler.svg.attr("height", crawler.offset + crawler.bar_height + crawler.spacing_inside_group)

            // draw bars
            crawler.layers[1].append("rect")
                .on("click", () => {
                    this.isOpen = !this.isOpen
                    updater.value += 1
                })
                .transition()
                .attr("x", d.score < 0 ? crawler.scale.value(d.value) : crawler.scale.value(d.value - d.score))
                .attr("y", crawler.offset)
                .attr("class", "bars" + crawler.offset)
                .attr("width", crawler.scale.value(Math.abs(d.score)) - crawler.scale.value(0))
                .attr("height", crawler.bar_height)
                .attr("fill", d.score < 0 ? "crimson" : "darkslateblue")

                .style("cursor", "pointer")

            if (!isLast) {
                // draw value lines, vertically
                crawler.layers[1].append("line")
                    .attr("x1", crawler.scale.value(d.value))
                    .attr("y1", crawler.offset)
                    .attr("x2", crawler.scale.value(d.value))
                    .attr("y2", crawler.offset + 2 * crawler.bar_height + crawler.spacing_inside_group)
                    .attr("class", "line_vertical" + crawler.offset)
                    .attr("stroke", "grey")
                    .attr("stroke-width", 2)
            }

            crawler.layers[1].append("text")
                .attr("x", 520)
                .attr("y", crawler.offset + crawler.bar_height / 2)
                .text(d.label)
                .attr("class", "text_feature_names" + crawler.offset)
                .style("font-size", "12px")
                .style("font-family", "Verdana")
                .style("text-anchor", "start")
                .style("color", "black")


            crawler.offset += crawler.bar_height + crawler.spacing_inside_group
        }

    }

}

class Feature implements GroupInterface, InfluenceScore {
    feature: string = ""
    score: number = 0
    value: number = 0
    size: number = 0
    label: string = ""
    parent: Group | null = null
    ids: Set<number> = new Set()

    constructor(feature: string) {
        this.feature = feature
        this.score = useInfluenceStore().main_effects[feature].average
        this.value = this.score
        this.size = useInfluenceStore().main_effects[feature].size
        this.label = feature + " = " + useDataStore().instance[this.feature]
        this.parent = null
        this.ids = useInfluenceStore().instance_subsets[this.feature]
    }

    set_parent(parent: Group) {
        this.parent = parent
    }

    set_new_influences(ids: Set<number>, previous_value: number) {
        let current_ids = this.get_ids()
        this.ids = new Set([...ids].filter(x => current_ids.has(x)))
        let new_value = useInfluenceStore().get_average_influence(this.ids)
        let difference = new_value - previous_value
        this.score = difference
        this.value = new_value
    }

    get_ids() {
        return this.ids
    }

    get_score() {
        return this.score
    }

    get_value() {
        return this.value
    }

    get_size() {
        return this.size
    }

    get_name() {
        return this.label
    }

    vis_group(crawler: any, isLast: boolean, updater: any) {

        let d = this

        crawler.svg.attr("height", crawler.offset + crawler.bar_height + crawler.spacing_inside_group)

        // draw bars
        crawler.layers[1].append("rect")
            .on("click", () => {
                if (this.parent != null) {
                    this.parent.isOpen = !this.parent.isOpen
                    updater.value += 1
                }
            })
            .style("cursor", this.parent != null ? "pointer" : "default")
            .transition()
            .attr("x", d.score < 0 ? crawler.scale.value(d.value) : crawler.scale.value(d.value - d.score))
            .attr("y", crawler.offset)
            .attr("class", "bars" + crawler.offset)
            .attr("width", crawler.scale.value(Math.abs(d.score)) - crawler.scale.value(0))
            .attr("height", crawler.bar_height)
            .attr("fill", d.score < 0 ? "crimson" : "darkslateblue")

        if (!isLast) {
            // draw value lines, vertically
            crawler.layers[1].append("line")
                .attr("x1", crawler.scale.value(d.value))
                .attr("y1", crawler.offset)
                .attr("x2", crawler.scale.value(d.value))
                .attr("y2", crawler.offset + 2 * crawler.bar_height + crawler.spacing_inside_group)
                .attr("class", "line_vertical" + crawler.offset)
                .attr("stroke", "grey")
                .attr("stroke-width", 2)
        }

        crawler.layers[1].append("text")
            .attr("x", 520)
            .attr("y", crawler.offset + crawler.bar_height / 2)
            .text(d.label)
            .attr("class", "text_feature_names" + crawler.offset)
            .style("font-size", "12px")
            .style("font-family", "Verdana")
            .style("text-anchor", "start")
            .style("color", "black")

        crawler.offset += crawler.bar_height + crawler.spacing_inside_group
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
            let features = dataStore.interacting_features

            const correlation_threshold = 0.8
            let main_players = [] as (Feature | Group)[]

            //first group all features that have a high correlation together
            let remaining_features = [...features]
            for (const feature of features) {
                let correlated_features = remaining_features.filter(f => dataStore.correlations[feature][f] > correlation_threshold)
                if (correlated_features.length > 0) {
                    correlated_features.push(feature)
                    main_players.push(new Group(correlated_features.map(f => new Feature(f)), "correlation"))
                    remaining_features = remaining_features.filter(f => !correlated_features.includes(f))
                }
            }

            //then add the remaining features to main_players
            for (const feature of remaining_features) {
                main_players.push(new Feature(feature))
            }

            //sort main players by main effect
            main_players.sort((a, b) => a.get_score() - b.get_score())

            //then go through them and either add them to a previous group when they interact, or create a new group
            const interaction_boundary = dataStore.data_summary.std * 0.2
            for (const feature of main_players) {
                let added = false

                for (const group of groups) {

                    //group features that interact together

                    //const interaction_boundary = (dataStore.data_summary.max - dataStore.data_summary.min) * 0.2
                    if (group.calculate_interaction_effect(feature) > interaction_boundary) {
                        group.push(feature)
                        group.type = "interaction"
                        added = true
                        break
                    }
                }
                if (!added) {
                    groups.push(new Group([feature], "single"))
                }
            }

            console.log(groups)

            return groups
        },

        calculate_influences() {
            this.calculate_main_effects()
            this.groups = this.calculate_groups()

        },

        get_average_influence(ids: Set<number>): number {
            let subset = useDataStore().data.filter((_, i) => ids.has(i))
            let average = subset.reduce((acc, d) => acc + d[useDataStore().target_feature], 0) / subset.length
            let center = useDataStore().data_summary.mean
            return average - center
        },

        sort_by_main_effect(a: string, b: string) {
            return Math.abs(useInfluenceStore().main_effects[b].average) - Math.abs(useInfluenceStore().main_effects[a].average)
        }
    }
})