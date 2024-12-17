<script setup lang="ts">
import * as d3 from "d3";
import {ref, useTemplateRef, watch} from 'vue'
import {useDataStore} from "../stores/dataStore";
import {Group, useInfluenceStore} from "../stores/influence_store.ts";

const dataStore = useDataStore()
const influenceStore = useInfluenceStore()

// watch dataStore.influence_scores
watch (() => influenceStore.groups, (_) => {
  update_vis()
})

watch(() => dataStore.storyIsVisible, () => {
  update_vis()
})

// also watch dataStore.instance
watch(() => dataStore.instance, () => {
  influenceStore.calculate_influences()
  update_vis(false, false)
}, {deep:true})

//refs
const container = useTemplateRef('container')

const min = ref<number>(0)
const max = ref<number>(1)
const scale = ref<any>(d3.scaleLinear().domain([min.value, max.value]).range([0, 800]))
const bar_height = 25
const spacing_between_groups = 15
const spacing_inside_group = 5

const updater = ref(0)

watch(() => updater.value, () => {
  update_vis(false)
})

const update_vis = async (isSlow:boolean=true, areChangesSlow:boolean=true) => {

  d3.select(container.value).selectAll("*").remove()

  if (!dataStore.storyIsVisible) {
    return
  }

  const height = influenceStore.groups.length * 20 + d3.sum(influenceStore.groups.map(g => g.get_nr_bars())) * (bar_height+10)

  let svg = d3.create("svg")
      .attr("width", 800)
      .attr("height", height)

  let data = influenceStore.groups.flat()
  if (data.length === 0) {
    return
  }

  const range = get_subset_influence_range()
  min.value = range[0]
  max.value = range[1]
  scale.value = d3.scaleLinear().domain([min.value, max.value]).range([100, 700])

  let layers = []
  for (let i = 0; i < 3; i++) {
    layers.push(svg.append("g"))
  }


  // add axis and add a "+" in front of positive values
  let axis = d3.axisTop(scale.value)
      .tickFormat((d) => {
        if (d > 0) {
          return "+" + d
        }
        return d
      })
      .ticks(10)
  layers[2].append("g")
      .attr("transform", "translate(0, " + (20) + ")")
      .style("font-size", "12px")
      .style("color", "#555555")
      .call(axis)

  // add black vertical line at 0
  layers[2].append("line")
      .attr("x1", scale.value(0))
      .attr("y1", 20)
      .attr("x2", scale.value(0))
      .attr("y2", 20 + spacing_between_groups)
      .attr("stroke", "black")
      .attr("stroke-width", 2)

  d3.select(container.value).node().append(svg.node())

  let crawler = {offset: 30, spacing_between_groups:spacing_between_groups, layers:layers,
      spacing_inside_group:spacing_inside_group, scale:scale, svg:svg, bar_height:bar_height, isSlow:isSlow,
    areChangesSlow:areChangesSlow}
  for (let i = 0; i < influenceStore.groups.length; i++) {
    let group: Group = influenceStore.groups[i]
    group.vis_group(crawler, true, true, updater)
    crawler.offset += crawler.spacing_between_groups
    if (isSlow && !areChangesSlow) {
      await sleep(1000)
    }

  }

}

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const get_subset_influence_range = () => {
  const min_subset_size = dataStore.get_min_subset_size()

  // now get the smalles n values from dataStore.data
  let data = dataStore.data.map(d => d[dataStore.target_feature])
  let sorted_data = data.sort((a, b) => a - b)
  let min_items = sorted_data.slice(0, min_subset_size)
  let max_items = sorted_data.slice(-min_subset_size)
  let min = d3.mean(min_items) - dataStore.data_summary.mean
  let max = d3.mean(max_items) - dataStore.data_summary.mean
  return [min, max]
}

</script>

<template>
  <div class="w-100 d-flex flex-column align-center justify-center">
    <h3 class="pt-5" v-if="influenceStore.groups.length>0 && dataStore.storyIsVisible ">Influence on Prediction</h3>
    <div ref="container" class="px-5 pt-5"/>
    <div v-if="false">
      Prediction: {{dataStore.instance[dataStore.target_feature] - dataStore.data_summary.mean}}
      Explanation: {{influenceStore.explanation_prediction  - dataStore.data_summary.mean}}
    </div>
  </div>
</template>

<style scoped>

</style>