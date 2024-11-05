<script setup lang="ts">
import * as d3 from "d3";
import {useTemplateRef, onMounted, ref} from 'vue'
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

  const svg_width = 400

  let svg = d3.create("svg")
      .attr("width", svg_width + 20)
      .attr("height", 60)
      .attr("viewBox",[-10, 0, svg_width + 20, 60])

  // add a distribution heatmap over the counts of the bins
  const max_count = d3.max(bins.map(d => d.count))
  const feature_min = d3.min(bins.map(d => 'value' in d ? d.value : 'min' in d? d.min : 0))
  const feature_max = d3.max(bins.map(d => 'value' in d ? d.value : 'max' in d? d.max : 0))
  const color = d3.scaleLinear()
      .domain([0, max_count])
      .range(["white", "black"])

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
        .attr("x", (d :any) => d.min == undefined ? x(d.value) - rect_width/2 : x(d.min))
      .attr("y", 5)
      .attr("width", rect_width)
      .attr("height", rect_height)
  bin_elements
      .append("rect")
      .attr("x", (d :any) => d.min == undefined ? x(d.value) - rect_width/2 : x(d.min))
      .attr("y", 5)
      .attr("width", rect_width)
      .attr("height", rect_height)
      .attr("fill", (d :any) => color(d.count))
      .attr("stroke", "white")
      .attr("stroke-width", 1)
  bin_elements
      .append("text")
      .text((d :any) => d.count)
      .attr("x", (d :any) => x(d.min == undefined ? d.value : d.min))
      .attr("y", rect_height/2)
      .attr("dy", "0.4em")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("fill", (d :any) => d.count > max_count/2 ? "white" : "black")
      .style("opacity", "0")
      .text((d :any) => ((d.count/full_count)*100).toFixed(1) + "%")

  bin_elements
      .on("mouseover", (event: any, _:any) => {
        d3.select(event.target.parentNode).selectAll("text")
            .style("opacity", "1")
      })
      .on("mouseout", (event:any, _:any) => {
        d3.select(event.target.parentNode).selectAll("text")
            .style("opacity", "0")
      })

  // add x-axis with padding
  const xAxis = d3.axisBottom(x)

  if (bins.length <= 4) {
    xAxis.tickValues(bins.map(d => 'value' in d? d.value : 1))
  }
  else {
    xAxis.tickValues([feature_min, feature_max])
  }

  let axis = svg.append("g")
      .attr("transform", "translate(0, " + (rect_height) + ")")
      .style("font-size", "12px")
      .style("color", "grey")
      .call(xAxis)
  axis.selectAll(".domain, line") //remove the axis line
      .remove()

  // add a line for the instance value
  svg.append("line")
      .attr("x1", x(instance_value.value))
      .attr("y1", 0)
      .attr("x2", x(instance_value.value))
      .attr("y2", rect_height+10)
      .attr("stroke", "seagreen")
      .attr("stroke-width", 4)


  d3.select(container.value).selectAll("*").remove()
  d3.select(container.value).node().append(svg.node())

}

</script>

<template>
  <div class="d-flex justify-center ml-15">
    <span class="text-grey-darken-1">Distribution: </span>
    <div  ref="container"></div>
  </div>
</template>

<style scoped>

</style>