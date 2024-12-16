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

  const svg_width = 500
  const rect_width = svg_width / vis_bins.length

  let svg = d3.create("svg")
      .attr("width", svg_width + 20)
      .attr("height", 60)
      .attr("viewBox", [-10, 0, svg_width + 20, 60])

  // create x-axis based on keys of vis_bins
  let min_x = d3.min(vis_bins.map(d => +d.x))
  let max_x = d3.max(vis_bins.map(d => +d.x))
  let x = d3.scaleLinear()
      .domain([min_x,max_x])
      .range([rect_width/2, svg_width-rect_width/2])

  let y = d3.scaleLinear()
      .domain([0, d3.max(vis_bins.map(d => d.prediction))])
      .range([0, 30])

  // add bars
  svg.selectAll("rect")
      .data(vis_bins)
      .enter()
      .append("rect")
      .attr("x", d => x(d.x)-rect_width/2)
      .attr("y", d => 30 - y(d.prediction))
      .attr("width", rect_width)
      .attr("height", d => y(d.prediction))
      .attr("fill", "steelblue")

  // add x-axis
  svg.append("g")
      .attr("transform", `translate(0, 30)`)
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