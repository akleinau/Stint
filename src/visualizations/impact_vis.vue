<script setup lang="ts">
import * as d3 from "d3";
import {useTemplateRef, onMounted, ref, watch} from 'vue'
import {useDataStore} from "../stores/dataStore.ts";
import {useDetailStore} from "../stores/detail_store.ts";

const dataStore = useDataStore()
const detailStore = useDetailStore()

//refs
const container = useTemplateRef('container')
let instance_value = ref(0)


onMounted(() => {
  instance_value.value = dataStore.instance[detailStore.selected_feature.get_feature_names()]
  detailStore.calculate_feature_change_impact_values()
  update_vis()
})

//watch dataStore.instance
watch(() => dataStore.instance[detailStore.selected_feature.get_feature_names()], () => {
  instance_value.value = dataStore.instance[detailStore.selected_feature.get_feature_names()]
  update_vis()
})

watch(() => detailStore.selected_feature, () => {
  console.log("update detail view")
  detailStore.calculate_feature_change_impact_values()
  update_vis()
})

const update_vis = () => {

  let values = detailStore.change_impacts

  const svg_width = 300
  const svg_height = 100
  const y_padding = 30
  const padding_sides = 40

  let svg = d3.create("svg")
      .attr("width", svg_width + 20)
      .attr("height", svg_height)
      .attr("viewBox", [-10, 0, svg_width + 20, svg_height])

  // create x-axis based on keys of vis_bins and set_vis_bins
  let min_x = d3.min(values.map(d => +d.x))
  let max_x = d3.max(values.map(d => +d.x))

  let x = d3.scaleLinear()
      .domain([min_x,max_x])
      .range([padding_sides/2, svg_width-padding_sides/2])

  let min_y = d3.min(values.map(d => +d.impact))
  let max_y = d3.max(values.map(d => +d.impact))

  let y = d3.scaleLinear()
      .domain([min_y, max_y])
      .range([svg_height- y_padding, 0])

  // add horizontal zero impact line
  svg.append("line")
      .attr("x1", x(min_x))
      .attr("y1", y(0))
      .attr("x2", x(max_x))
      .attr("y2", y(0))
      .attr("stroke", "darkgrey")
      .attr("stroke-width", 1)

  // add curve for vis_bins
  let line = d3.line()
      .x(d => x(d.x))
      .y(d => y(d.impact))
  // add curve
  svg.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("d", line)

  // add x-axis
  svg.append("g")
      .attr("transform", `translate(0, ${svg_height - y_padding})`)
      .call(d3.axisBottom(x))

  // add y-axis
  svg.append("g")
      .attr("transform", `translate(${padding_sides/2}, 0)`)
      .call(d3.axisLeft(y).ticks(2))

  // turn around whole svg 90 degrees
  //svg.attr("transform", "rotate(90)")

  // add line for instance value
  svg.append("line")
      .attr("x1", x(instance_value.value))
      .attr("y1", 0)
      .attr("x2", x(instance_value.value))
      .attr("y2", svg_height)
      .attr("stroke", "teal")
      .attr("stroke-width", 1)




  d3.select(container.value).selectAll("*").remove()
  d3.select(container.value).node().append(svg.node())

}

</script>

<template>
  <div class="d-flex justify-center">
    <div ref="container"></div>
  </div>
</template>

<style scoped>

</style>