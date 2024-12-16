<script setup lang="ts">
import * as d3 from "d3";
import {useTemplateRef, onMounted, ref, watch} from 'vue'
import {useDataStore} from "../stores/dataStore.ts";
import {useDetailStore} from "../stores/detail_store.ts";
import {useFeatureStore} from "../stores/feature_store.ts";

const dataStore = useDataStore()
const detailStore = useDetailStore()
const featureStore = useFeatureStore()

//refs
const container = useTemplateRef('container')
let instance_value = ref(0)


onMounted(() => {
  instance_value.value = dataStore.instance[detailStore.selected_feature.get_feature_names()]
  update_vis()
})

//watch dataStore.instance
watch(() => dataStore.instance[detailStore.selected_feature.get_name()], () => {
  instance_value.value = dataStore.instance[detailStore.selected_feature.get_feature_names()]
  update_vis()
})

watch(() => detailStore.selected_feature, () => {
  console.log("update detail view")
  update_vis()
})

const update_vis = () => {

  let vis_bins = detailStore.get_vis_bins() // array of bins with x and prediction
  let set_vis_bins = detailStore.get_current_set_vis_bins()
  let current_bin_index = featureStore.get_instance_bin_index(detailStore.selected_feature.get_feature_names(), instance_value.value)

  const svg_width = 500
  const rect_width = svg_width / vis_bins.length

  let svg = d3.create("svg")
      .attr("width", svg_width + 20)
      .attr("height", 100)
      .attr("viewBox", [-10, 0, svg_width + 20, 100])

  // create x-axis based on keys of vis_bins
  let min_x = d3.min(vis_bins.map(d => +d.x))
  let max_x = d3.max(vis_bins.map(d => +d.x))
  let x = d3.scaleLinear()
      .domain([min_x,max_x])
      .range([rect_width/2, svg_width-rect_width/2])

  let y = d3.scaleLinear()
      .domain([0, d3.max(vis_bins.map(d => d.prediction))])
      .range([0, 70])

  // add bars
  svg.selectAll(".bins")
      .data(vis_bins)
      .enter()
      .append("rect")
      .attr("class", "bins")
      .attr("x", d => x(d.x)-rect_width/2)
      .attr("y", d => 70 - y(d.prediction))
      .attr("width", rect_width)
      .attr("height", d => y(d.prediction))
      .attr("fill", (_, i) => i === current_bin_index ? "green" : "grey")
      .style("opacity", 0.5)

  if (set_vis_bins !== null) {
      // add bars
    svg.selectAll(".setbins")
        .data(set_vis_bins)
        .enter()
        .append("rect")
        .attr("class", "setbins")
        .attr("x", d => x(d.x)-rect_width/2)
        .attr("y", d => 70 - y(d.prediction))
        .attr("width", rect_width)
        .attr("height", d => y(d.prediction))
        .attr("fill", (_, i) => i === current_bin_index ? "red" : "blue")
        .style("opacity", 0.5)
  }

  // add x-axis
  svg.append("g")
      .attr("transform", `translate(0, 70)`)
      .call(d3.axisBottom(x))



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