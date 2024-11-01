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
const scale = ref<any>(d3.scaleLinear().domain([min.value, max.value]).range([0, 500]))
const bar_height = 20
const spacing_between_groups = 15
const spacing_inside_group = 5

const update_vis = async () => {

  const height = influenceStore.groups.length * 20 + dataStore.interacting_features.length * (bar_height+10)

  let svg = d3.create("svg")
      .attr("width", 1000)
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

  // add axis
  let axis = d3.axisBottom(scale.value)
  svg.append("g")
      .attr("transform", "translate(0, " + (height -20) + ")")
      .call(axis)

  // add black vertical line at 0
  svg.append("line")
      .attr("x1", scale.value(0))
      .attr("y1", 0)
      .attr("x2", scale.value(0))
      .attr("y2", height -20)
      .attr("stroke", "black")
      .attr("stroke-width", 2)

  d3.select(container.value).selectAll("*").remove()
  d3.select(container.value).node().append(svg.node())

  let offset = 0
  for (let i = 0; i < influenceStore.groups.length; i++) {
    let group: Group = influenceStore.groups[i]
    if (group.type == "interaction") {
          await vis_interaction_group(group.get_features(), svg, offset)
    }
    else if (group.type == "correlation") {
          await vis_correlation_group([group], svg, offset)
    }
    else if (group.type == "single") {
          await vis_single_group(group.get_features(), svg, offset)
    }

    offset += (group.get_nr_features() * (bar_height+spacing_inside_group) + spacing_between_groups)
  }

  dataStore.storyIsVisible = true


}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const vis_interaction_group = async (data, svg, offset) => {
  for (let i = 1; i <= data.length; i++){
    _vis_interaction_group_direct(data.slice(0, i), svg, offset)
    await sleep(1000)
  }
}

const _vis_interaction_group_direct = (data, svg, offset) => {

  // draw bars
  svg.selectAll(".bars" + offset)
      .data(data)
      .enter()
      .append("rect")
      .transition()
      .attr("x", d => d.score < 0 ? scale.value(d.value): scale.value(d.value - d.score))
      .attr("y", (d, i) => i * (bar_height+spacing_inside_group) + offset)
      .attr("class", "bars" + offset)
      .attr("width", d => scale.value(Math.abs(d.score)) - scale.value(0))
      .attr("height", bar_height)
      .attr("fill", d => d.score < 0 ? "crimson" : "darkslateblue")

  // draw value lines, vertically
  svg.selectAll(".line_vertical" + offset)
      .data(data.slice(0,-1))
      .join("line")
      .transition()
      .attr("x1", d => scale.value(d.value))
      .attr("y1", (d, i) => i * (bar_height+spacing_inside_group) + offset)
      .attr("x2", d => scale.value(d.value))
      .attr("y2", (d, i) => (i+1) * (bar_height+spacing_inside_group) + offset + bar_height)
      .attr("class", "line_vertical" + offset)
      .attr("stroke", "grey")
      .attr("stroke-width", 2)


  // add text (feature = instance_value)
  svg.selectAll(".text_feature_names" + offset)
      .data(data)
      .join("text")
      .transition()
      .attr("x", 500)
      .attr("y", (d, i) => i * (bar_height+spacing_inside_group) + bar_height/2 + offset)
      .attr("class", "text_feature_names" + offset)
      .text((d, i) => d.label )
      .style("font-size", "12px")
      .style("font-family", "Verdana")
      .style("text-anchor", "start")
      .style("color", "black")
}

const vis_correlation_group = async (data, svg, offset) => {
  for (let i = 1; i <= data.length; i++){
    _vis_interaction_group_direct(data.slice(0, i), svg, offset)
    await sleep(1000)
  }
}

const vis_single_group = async (data, svg, offset) => {
  for (let i = 1; i <= data.length; i++){
    _vis_interaction_group_direct(data.slice(0, i), svg, offset)
    await sleep(1000)
  }
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
    <div ref="container" class="px-5 pt-5 w-50"/>
  </div>
</template>

<style scoped>

</style>