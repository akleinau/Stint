import {defineStore} from "pinia";
import {useDataStore} from "./dataStore";
import {useFeatureStore} from "./feature_store.ts";
import * as d3 from "d3";

const sort_by_score = (a: GroupClass, b: GroupClass) => {
    return Math.abs(b.get_score()) - Math.abs(a.get_score())
}

abstract class GroupClass {
    type: string = "single"
    ids: Set<number> = new Set()
    score: number = 0
    value: number = 0
    isOpen: boolean = false
    isFreezedOpen: boolean = false
    parent: Group | null = null
    manual_slow: boolean = false

    protected constructor() {
        this.parent = null
    }

   set_parent(parent: Group) {
        this.parent = parent
    }

    get_score() {
        return this.score
    }

    get_value() {
        return this.value
    }

    get_ids() {
        return this.ids
    }

    get_size() {
        return this.ids.size
    }

    vis_bars(crawler: any, updater: any, isLast: boolean, isFirst: boolean, level:number = 0) {
        crawler.svg.attr("height", crawler.offset + crawler.bar_height + crawler.spacing_inside_group)
        let group_elements = crawler.layers[1].append("g")
        this.add_bar(crawler, this, updater, group_elements, level)
        //add_bar_score(crawler, this, group_elements)
        //add_bar_size(crawler, this, group_elements)
        add_value_line(crawler, this, isLast, group_elements)
        add_feature_names(crawler, this, group_elements, isFirst)
        add_zero_line(crawler, isLast)
        crawler.offset += crawler.bar_height + crawler.spacing_inside_group
    }

    abstract add_bar(crawler: any, d: any, updater: any, group_elements: any, level: number): void

    abstract get_name(): string

    abstract vis_group(crawler: any, isLast: boolean, isFirst: boolean, updater: any, level: number): void

    abstract set_new_influences(ids: Set<number>, previous_value: number): void

    abstract get_features(): string[]

}

export class Group extends GroupClass {
    features: (Feature | Group)[] = []

    constructor(features: (Feature| Group)[], type: string) {
        super()
        //first sort the features by score
        features.sort(sort_by_score)
        this.features = features
        for (const feature of this.features) {
            feature.set_parent(this)
        }

        this.set_new_influences(new Set([...features[0].get_ids()]), 0)
        this.type = type
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
        this.score = new_value - previous_value
        this.value = new_value
    }

    calculate_interaction_effect(feature: Feature | Group) {
        let our_score = this.get_score()
        let their_score = feature.get_score()
        let combined_ids = new Set([...this.get_ids()].filter(x => feature.get_ids().has(x)))
        let combined_score = useInfluenceStore().get_average_influence(combined_ids)
        return Math.abs(combined_score - our_score - their_score)
    }

    calculate_added_score(feature: Feature | Group) {
        let our_score = this.get_score()
        let combined_ids = new Set([...this.get_ids()].filter(x => feature.get_ids().has(x)))
        let combined_score = useInfluenceStore().get_average_influence(combined_ids)
        return Math.abs(combined_score - our_score)
    }

    get_name() : string {
        if (this.type == "correlation") {
            return this.features[0].get_name() + "*"
        }

        return this.features.map(f => f.get_name()).join(", ")
    }

    get_feature_names() : string {
        if (this.type == "correlation") {
            return this.features[0].get_feature_names() + "*"
        }

        return this.features.map(f => f.get_feature_names()).join(", ")
    }

    get_feature_labels() : string {
        if (this.type == "correlation") {
            return this.features[0].get_feature_labels() + "*"
        }

        return this.features.map(f => f.get_feature_labels()).join(", ")
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

    get_features(): string[] {
        return this.features.map(f => f.get_features()).flat()
    }

    vis_group(crawler: any, isLast: boolean, isFirst: boolean, updater: any, level:number = 0) {

        if (this.get_nr_features() == 1) {
            this.features[0].vis_group(crawler, isLast, isFirst, updater, level)
        }
        else if (this.isOpen) {
            let initial_offset = crawler.offset
            for (let j = 0; j < this.get_nr_features(); j++) {
                this.features[j].vis_group(crawler, isLast && j == this.get_nr_features() -1 , isFirst && j == 0, updater, level + 1)
            }
            let final_offset = crawler.offset

            this.add_group_box(crawler, initial_offset, final_offset, updater)

        } else {
            this.vis_bars(crawler, updater, isLast, isFirst, level)
        }

    }


    add_bar(crawler: any, d: any, updater: any, group_elements: any, level: number=0) {
        // draw bars
        let rect = group_elements.append("rect")
            .on("click", () => {
                this.isFreezedOpen = !this.isFreezedOpen
                console.log("freeze " + this.isFreezedOpen)

                updater.value += 1
            })
            .on("mouseenter", (event: any, _:any) => {
                if (!this.isOpen) {
                    this.isOpen = true
                    updater.value += 1
                }

              d3.select(event.target.parentNode).selectAll(".details")
                .style("opacity", "1")

            })
            .on("mouseout", (event: any, _: any) => {
                d3.select(event.target.parentNode).selectAll(".details")
                    .style("opacity", "0")
            })
            .attr("x", d.score < 0 ? crawler.scale.value(d.value) : crawler.scale.value(d.value - d.score))
            .attr("y", crawler.offset)
            .attr("class", "bars" + crawler.offset)
            .attr("width", crawler.scale.value(Math.abs(d.score)) - crawler.scale.value(0))
            .attr("fill", d.score < 0 ? "crimson" : "darkslateblue")
            .style("cursor", "pointer")

        //optionally animate
        if (crawler.isSlow || this.manual_slow) {
            rect.transition()
            .attr("height", crawler.bar_height)

            this.manual_slow = false
        }
       else {
            rect.attr("height", crawler.bar_height)
        }

    }

    add_group_box(crawler: any, initial_offset: number, final_offset: number, updater: any) {
        // add a rectangle around the group
        crawler.layers[0].append("rect")
            .on("click", () => {
                    this.isFreezedOpen = !this.isFreezedOpen
                    console.log("freeze " + this.isFreezedOpen)
                    updater.value += 1
            })
            .attr("x", 0)
            .attr("y", initial_offset-5)
            .attr("width", 800)
            .attr("height", final_offset - initial_offset +5)
            .attr("fill", "#CCCCCC")
            .style("opacity", 0.2)
            .style("cursor", "pointer")

        //add second boundary box to close the group again on move out
        crawler.layers[2].append("rect")
            .on("mouseover", () => {
                if (this.isOpen && !this.isFreezedOpen) {
                    this.isOpen = false
                    for (let j = 0; j < this.get_nr_features(); j++) {
                        this.features[j].isOpen = false
                    }
                    updater.value += 1
                }
            })
            .attr("x", 0)
            .attr("y", initial_offset-5)
            .attr("width", 800)
            .attr("height", final_offset - initial_offset +5)
            //remove fill, only keep border
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", 4)
            .style("opacity", 0)
            .style("cursor", "pointer")
    }

}

class Feature extends GroupClass {
    feature: string = ""

    constructor(feature: string) {
        super()
        this.feature = feature
        this.score = useInfluenceStore().main_effects[feature].average
        this.value = this.score
        this.ids = useInfluenceStore().instance_subsets[this.feature]
    }

    set_new_influences(ids: Set<number>, previous_value: number) {
        let current_ids = this.get_ids()
        this.ids = new Set([...ids].filter(x => current_ids.has(x)))
        let new_value = useInfluenceStore().get_average_influence(this.ids)
        this.score = new_value - previous_value
        this.value = new_value
    }

    get_name() {
        return this.feature + " = " + useDataStore().instance[this.feature]
    }

    get_feature_names() {
        return this.feature
    }

    get_feature_labels() {
        return useDataStore().instance[this.feature]
    }

    vis_group(crawler: any, isLast: boolean, isFirst: boolean, updater: any, level:number = 0) {
        this.vis_bars(crawler, updater, isLast, isFirst, level)
    }

    get_features(): string[] {
        return [this.feature]
    }

    add_bar(crawler: any, d: any, updater: any, group_elements: any, level: number=0) {
       // draw bars
        let rect = group_elements.append("rect")
            .on("click", () => {
                if (this.parent != null) {
                    this.parent.isFreezedOpen = !this.parent.isFreezedOpen
                    console.log("freeze " + this.parent.isFreezedOpen)
                    updater.value += 1
                }
            })
            .on("mouseenter", (event: any, _: any) => {
                d3.select(event.target.parentNode).selectAll(".details")
                    .style("opacity", 1)
            })
            .on("mouseout", (event: any, _: any) => {
                d3.select(event.target.parentNode).selectAll(".details")
                    .style("opacity", "0")
            })
            .style("cursor", this.parent != null ? "pointer" : "default")
            .attr("x", d.score < 0 ? crawler.scale.value(d.value) : crawler.scale.value(d.value - d.score))
            .attr("y", crawler.offset)
            .attr("class", "bars" + crawler.offset)
            .attr("width", crawler.scale.value(Math.abs(d.score)) - crawler.scale.value(0))
            .attr("fill", d.score < 0 ? "crimson" : "darkslateblue")

        //optionally animate
        if (crawler.isSlow || this.manual_slow) {
            rect.transition()
            .attr("height", crawler.bar_height)
            this.manual_slow = false
        }
       else {
            rect.attr("height", crawler.bar_height)
        }
    }

}

const add_value_line = (crawler: any, d: any, isLast: boolean, group_elements: any) => {
    if (!isLast) {
        // draw value lines, vertically
        group_elements.append("line")
            .attr("x1", crawler.scale.value(d.value))
            .attr("y1", crawler.offset)
            .attr("x2", crawler.scale.value(d.value))
            .attr("y2", crawler.offset + 2 * crawler.bar_height + crawler.spacing_inside_group)
            .attr("class", "line_vertical" + crawler.offset)
            .attr("stroke", "grey")
            .attr("stroke-width", 2)
    }
}

const add_feature_names = (crawler: any, d: any, group_elements: any, isFirst: boolean) => {

    let x_position = crawler.scale.value(d.value)
    let padding = x_position  - crawler.scale.value(0) < 0 ? 5 : -5

    let name = (!isFirst? "& ": "") + d.get_feature_names()
    if (name.length > 22) {
        name = name.slice(0, 20) + "..."
    }

    // add feature names
    group_elements.append("text")
            .attr("x", x_position - padding)
            .attr("y", crawler.offset + crawler.bar_height / 2)
            .text(name)
            .attr("dy", ".4em")
            .attr("class", "text_feature_names" + crawler.offset)
            .style("font-size", "14px")
            .style("font-family", "Verdana")
            .style("text-anchor", d.value < 0 ? "end": "start")
            .style("fill", "grey")
            .style("pointer-events", "none")

    let value = d.get_feature_labels()
    if (value.length > 22) {
        value = value.slice(0, 20) + "..."
    }



    // add feature values
    group_elements.append("text")
        .attr("x", x_position + padding)
        .attr("y", crawler.offset + crawler.bar_height / 2)
        .text(value)
        .attr("dy", ".4em")
        .attr("class", "text_feature_names" + crawler.offset)
        .style("font-size", "14px")
        .style("font-family", "Verdana")
        .style("text-anchor", d.value < 0 ? "start": "end")
        .style("fill", crawler.scale.value(Math.abs(d.score)) - crawler.scale.value(0) < 10 ? "black": "white")
        .style("pointer-events", "none")

}

const add_bar_score = (crawler: any, d: any, group_elements: any) => {

    group_elements.append("text")
            .attr("x", crawler.scale.value(d.value))
            .attr("y", crawler.offset + crawler.bar_height / 2)
            .text(d.score.toFixed(0))
            .attr("dy", ".4em")
            .attr("class", "details")
            .style("font-size", "12px")
            .style("font-family", "Verdana")
            .style("text-anchor", d.value < 0 ? "end": "start")
            .style("color", "black")
            .style("opacity", 0)
}

const add_bar_size= (crawler: any, d: any, group_elements: any) => {

    group_elements.append("text")
            .attr("x", crawler.scale.value(0))
            .attr("y", crawler.offset + crawler.bar_height / 2)
            .text(" #" + d.get_size().toFixed(0))
            .attr("dy", ".4em")
            .attr("class", "details")
            .style("font-size", "12px")
            .style("font-family", "Verdana")
            .style("text-anchor", d.value > 0 ? "end": "start")
            .style("color", "black")
            .style("opacity", 0)
}

const add_zero_line = (crawler: any, isLast: boolean) => {

    let end_y = crawler.offset + crawler.bar_height + crawler.spacing_inside_group
    if (isLast) {
        end_y += crawler.spacing_between_groups
    }
  // add black vertical line at 0
  crawler.layers[2].append("line")
      .attr("x1", crawler.scale.value(0))
      .attr("y1", crawler.offset)
      .attr("x2", crawler.scale.value(0))
      .attr("y2", end_y)
      .attr("stroke", "black")
      .attr("stroke-width", 2)
}

export const useInfluenceStore = defineStore({
    id: 'influence',
    state: () => ({
        groups: [] as Group[],
        main_effects: {} as { [key: string]: { value: number, average: number, size: number } },
        instance_subsets: {} as { [key: string]: Set<number> },
        explanation_prediction: 0

    }),
    actions: {

        calculate_main_effects() {
            const dataStore = useDataStore()
            const center = dataStore.data_summary.mean
            this.main_effects = {}
            for (let feature of dataStore.interacting_features) {
                const instance_value = dataStore.instance[feature]
                const similar_instances = this.get_similar_instances(feature)
                const sum = similar_instances.reduce((acc, d) => acc + d[dataStore.target_feature], 0)
                const size = similar_instances.length
                this.main_effects[feature] = {value: instance_value, average: sum / size - center, size: size}
                //also create set of ids for each feature
                const ids = similar_instances.map((d: any) => d.__id__)
                this.instance_subsets[feature] = new Set(ids)
            }
        },

        get_similar_instances(feature: string) {
            const dataStore = useDataStore()
            const featureStore = useFeatureStore()
            const instance_value = dataStore.instance[feature]
            const feature_type = featureStore.feature_types[feature]
            if (feature_type === "continuous") {
                // get similar instances in some margin around the instance value
                const margin = dataStore.data_summary.std * 0.2
                const min = instance_value - margin
                const max = instance_value + margin
                return dataStore.data.filter((d) => d[feature] >= min && d[feature] <= max)
            }

            else {
                return dataStore.data.filter((d) => d[feature] === instance_value)
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
            let isReduced = false

            const correlation_threshold = 0.8
            let main_players = [] as (Feature | Group)[]

            //first group all features that have a high correlation together
            let remaining_features = [...features]
            for (const feature of features) {
                let correlated_features = remaining_features.filter(f => dataStore.correlations[feature][f] > correlation_threshold)
                if (correlated_features.length > 0) {
                    correlated_features.push(feature)
                    correlated_features.sort((a, b) => Math.abs(this.main_effects[b].average) - Math.abs(this.main_effects[a].average))

                    if (isReduced) {
                        // get the feature with the highest main effect and only add it
                        let main_feature = correlated_features[0]
                        main_players.push(new Feature(main_feature))
                    }
                    else {
                        let group = new Group(correlated_features.map(f => new Feature(f)), "correlation")
                        main_players.push(group)
                    }

                    remaining_features = remaining_features.filter(f => !correlated_features.includes(f))
                }
            }

            //then add the remaining features to main_players
            for (const feature of remaining_features) {
                main_players.push(new Feature(feature))
            }

            //sort main players by main effect
            main_players.sort(sort_by_score)

            //then go through them and either add them to a previous group when they interact, or create a new group
            const interaction_boundary = dataStore.data_summary.range * 0.001
            const size_boundary = dataStore.get_min_subset_size()

            while (main_players.length > 0) {
                // find main player with highest score. Conveniently, this is the first one as it is ordered
                let main_player = main_players.shift() as Feature | Group
                // make a new group with this main player
                let group = new Group([main_player], "single")

                let interactions_present = true
                while (interactions_present && main_players.length > 0) {
                    let interaction_effects:any[] = main_players.map(mp => group.calculate_interaction_effect(mp))
                    let interaction_size = main_players.map(mp => new Set([...group.get_ids()].filter(x => mp.get_ids().has(x))).size)
                    interaction_effects = interaction_effects.map((e, i) => interaction_size[i] > size_boundary ? e: 0)
                    let best_interaction = Math.max(...interaction_effects)
                    let best_interaction_index = interaction_effects.indexOf(best_interaction)
                    if (best_interaction > interaction_boundary) {
                        group.push(main_players[best_interaction_index])
                        main_players = main_players.filter((_, i) => i != best_interaction_index)
                    }
                    else {
                        interactions_present = false
                    }

                }
                groups.push(group)

            }

            //sort groups by Math.abs(score)
            groups.sort(sort_by_score)

            if (isReduced) {
                // delete all groups whose score is below the boundary
                let boundary = dataStore.data_summary.std * 0.05
                groups = groups.filter(g => Math.abs(g.get_score()) > boundary)
            }
            dataStore.shown_features = groups.map(g => g.get_features()).flat()

            return groups
        },

        calculate_explanation_prediction() {
            let prediction = useDataStore().data_summary.mean
            for (const group of this.groups) {
                prediction += group.get_score()
            }
            this.explanation_prediction = prediction
        },

        calculate_influences() {
            useDataStore().storyIsVisible = true
            this.calculate_main_effects()
            this.groups = this.calculate_groups()
            this.calculate_explanation_prediction()

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