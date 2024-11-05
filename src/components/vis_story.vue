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

//refs
const container = useTemplateRef('container')

const min = ref<number>(0)
const max = ref<number>(1)
const scale = ref<any>(d3.scaleLinear().domain([min.value, max.value]).range([0, 800]))
const bar_height = 20
const spacing_between_groups = 15
const spacing_inside_group = 5

const updater = ref(0)

watch(() => updater.value, () => {
  update_vis(false)
})

const update_vis = async (isSlow:boolean=true) => {

  const height = influenceStore.groups.length * 20 + d3.sum(influenceStore.groups.map(g => g.get_nr_bars())) * (bar_height+10)

  let svg = d3.create("svg")
      .attr("width", 750)
      .attr("height", height)

  let data = influenceStore.groups.flat()
  if (data.length === 0) {
    return
  }

  min.value = Math.min(0, dataStore.data_summary.min)
  max.value = dataStore.data_summary.max
  const spacing = 0.01* (dataStore.data_summary.max - dataStore.data_summary.min)
  min.value = dataStore.data_summary.min - spacing - dataStore.data_summary.mean
  max.value = dataStore.data_summary.max + spacing - dataStore.data_summary.mean
  scale.value = d3.scaleLinear().domain([min.value, max.value]).range([0, 500])

  let layers = []
  for (let i = 0; i < 3; i++) {
    layers.push(svg.append("g"))
  }


  // add axis
  let axis = d3.axisTop(scale.value)
  layers[2].append("g")
      .attr("transform", "translate(0, " + (20) + ")")
      .call(axis)

  // add black vertical line at 0
  layers[2].append("line")
      .attr("x1", scale.value(0))
      .attr("y1", 20)
      .attr("x2", scale.value(0))
      .attr("y2", height)
      .attr("stroke", "black")
      .attr("stroke-width", 2)

  d3.select(container.value).selectAll("*").remove()
  d3.select(container.value).node().append(svg.node())

  let crawler = {offset: 30, spacing_between_groups:spacing_between_groups, layers:layers,
      spacing_inside_group:spacing_inside_group, scale:scale, svg:svg, bar_height:bar_height}
  for (let i = 0; i < influenceStore.groups.length; i++) {
    let group: Group = influenceStore.groups[i]
    group.vis_group(crawler, true, updater)
    crawler.offset += crawler.spacing_between_groups
    if (isSlow) {
      await sleep(1000)
    }

  }

  dataStore.storyIsVisible = true


}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}


const explain = () => {
  influenceStore.calculate_influences()
}


</script>

<template>
  <div class="w-100 d-flex flex-column align-center justify-center">
    <div v-if="dataStore.interacting_features.length !== 0" class="mt-1">
      <v-btn @click="explain" class="bg-blue">Explain</v-btn>
    </div>
    <h3 class="pt-5" v-if="influenceStore.groups.length>0">Your Story</h3>
    <div ref="container" class="px-5 pt-5"/>
  </div>
</template>

<style scoped>

</style>