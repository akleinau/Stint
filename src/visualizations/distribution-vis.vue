<script setup lang="ts">
import * as d3 from "d3";
import {useTemplateRef, onMounted, ref, watch} from 'vue'
import {useFeatureStore} from "../stores/feature_store.ts";
import {useDataStore} from "../stores/dataStore.ts";

const featureStore = useFeatureStore()
const dataStore = useDataStore()

//refs
const container = useTemplateRef('container')
let instance_value = ref(0)

//props
const props = defineProps(['feature_name'])

onMounted(() => {
  instance_value.value = dataStore.instance[props.feature_name]
  update_vis()
})

const update_vis = () => {
  const bins = featureStore.get_feature_bins(props.feature_name)
  const full_count = d3.sum(bins.map(d => d.count))

  const svg_width = 500

  let svg = d3.create("svg")
      .attr("width", svg_width + 20)
      .attr("height", 60)
      .attr("viewBox",[-10, 0, svg_width + 20, 60])

  // add a distribution heatmap over the counts of the bins
  const max_count = d3.max(bins.map(d => d.count))
  const feature_min = d3.min(bins.map(d => d.min == undefined ? d.value : d.min))
  const feature_max = d3.max(bins.map(d => d.max == undefined ? d.value : d.max))
  const color = d3.scaleLinear<string>()
      .domain([0, max_count])
      .range(["white", "navy"])

  const rect_width = svg_width / bins.length
  const rect_height = 30

  const x = d3.scaleLinear()
      .domain([feature_min, feature_max])
      .range([rect_width/2, svg_width-rect_width/2])


  //add rectangles with text
  let bin_elements = svg.selectAll(".bin_elements")
      .data(bins)
      .enter()
      .append("g")
      .attr("class", "bin_elements")
        .attr("x", d => d.min == undefined ? x(d.value) - rect_width/2 : x(d.min))
      .attr("y", d => 5)
      .attr("width", rect_width)
      .attr("height", rect_height)
  bin_elements
      .append("rect")
      .attr("x", d => d.min == undefined ? x(d.value) - rect_width/2 : x(d.min))
      .attr("y", d => 5)
      .attr("width", rect_width)
      .attr("height", rect_height)
      .attr("fill", d => color(d.count))
      .attr("stroke", "white")
      .attr("stroke-width", 1)
  bin_elements
      .append("text")
      .text(d => d.count)
      .attr("x", d => x(d.min == undefined ? d.value : d.min))
      .attr("y", rect_height/2)
      .attr("dy", "0.4em")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("fill", d => d.count > max_count/2 ? "white" : "black")
      .style("opacity", "0")
      .text(d => ((d.count/full_count)*100).toFixed(1) + "%")

  bin_elements
      .on("mouseover", (event, d) => {
        d3.select(event.target.parentNode).selectAll("text")
            .style("opacity", "1")
      })
      .on("mouseout", (event, d) => {
        d3.select(event.target.parentNode).selectAll("text")
            .style("opacity", "0")
      })

  // add x-axis with padding
  const xAxis = d3.axisBottom(x)

  if (bins.length < 4) {
    xAxis.tickValues(bins.map(d => d.value))
  }
  else {
    xAxis.tickValues([feature_min, feature_max])
  }

  let axis = svg.append("g")
      .attr("transform", "translate(0, " + (rect_height +5) + ")")
      .style("font-size", "12px")
      .call(xAxis)
  axis.selectAll(".domain") //remove the axis line
      .remove()

  // add a line for the instance value
  svg.append("line")
      .attr("x1", x(instance_value.value))
      .attr("y1", 0)
      .attr("x2", x(instance_value.value))
      .attr("y2", rect_height+10)
      .attr("stroke", "red")
      .attr("stroke-width", 4)


  d3.select(container.value).selectAll("*").remove()
  d3.select(container.value).node().append(svg.node())

}

</script>

<template>
  <div class="d-flex justify-end">
    <div class="mt-2"> {{feature_name}} = {{instance_value}} </div>
    <div  ref="container"></div>
  </div>
</template>

<style scoped>

</style>