<script setup lang="ts">
import * as d3 from "d3";
import {useTemplateRef, onMounted, ref, watch} from 'vue'
import {useFeatureStore} from "../stores/feature_store.ts";
import {useDataStore} from "../stores/dataStore.ts";

const featureStore = useFeatureStore()
const dataStore = useDataStore()

//refs
const container = useTemplateRef('container')

//props
const props = defineProps(['feature_name'])

onMounted(() => {
  update_vis()
})

const update_vis = () => {
  const bins = featureStore.get_feature_bins(props.feature_name)
  const instance_value = dataStore.instance[props.feature_name]

  let svg = d3.create("svg")
      .attr("width", 1000)
      .attr("height", 30)

  // add a distribution heatmap over the counts of the bins
  const max_count = d3.max(bins.map(d => d.count))
  const color = d3.scaleLinear<string>()
      .domain([0, max_count])
      .range(["white", "navy"])
  const x = d3.scaleLinear()
      .domain([0, bins.length])
      .range([0, 1000])

  //add rectangles
  const rect_width = 1000 / bins.length
  const rect_height = 30
  svg.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", (d, i) => x(i))
      .attr("y", d => 0)
      .attr("width", rect_width)
      .attr("height", rect_height)
      .attr("fill", d => color(d.count))
      .attr("stroke", d => d.min <= instance_value && d.max > instance_value ? "skyblue" : "none")
      .attr("stroke-width", 8)

  //add text
  svg.selectAll("text")
      .data(bins)
      .enter()
      .append("text")
      .attr("x", (d, i) => x(i) + rect_width/2)
      .attr("y", rect_height/2)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("fill", d => d.count > max_count/2 ? "white" : "black")
      .text(d => d.min.toFixed(2))


  d3.select(container.value).selectAll("*").remove()
  d3.select(container.value).node().append(svg.node())

}

</script>

<template>
  {{feature_name}}
  <div  ref="container"></div>
</template>

<style scoped>

</style>