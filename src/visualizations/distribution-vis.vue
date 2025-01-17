<script setup lang="ts">
import * as d3 from "d3";
import {useTemplateRef, onMounted, ref, watch} from 'vue'
import {bin_discrete, useFeatureStore} from "../stores/feature_store.ts";
import {useDataStore} from "../stores/dataStore.ts";

const featureStore = useFeatureStore()
const dataStore = useDataStore()
const lbl = dataStore.get_label

//refs
const container = useTemplateRef('container')
let instance_value = ref(0)

//props
const props = defineProps(['feature_name'])

onMounted(() => {
  instance_value.value = dataStore.instance[props.feature_name]
  update_vis()
})

watch(() => props.feature_name, () => {
  instance_value.value = dataStore.instance[props.feature_name]
  update_vis()
})

const update_vis = () => {
  const bins = featureStore.get_feature_bins(props.feature_name)
  const full_count = d3.sum(bins.map(d => d.count))
  const padding_left = 30

  const svg_width = 400

  let svg = d3.create("svg")
      .attr("width", svg_width + 20)
      .attr("height", 60)
      .attr("viewBox",[-10, 0, svg_width + 20, 60])

  // add a distribution heatmap over the counts of the bins
  const max_count = d3.max(bins.map(d => d.count))
  const feature_min = d3.min(bins.map(d => 'value' in d ? +(d.value as number) : 'min' in d? +(d.min as number) : 0))
  const feature_max = d3.max(bins.map(d => 'value' in d ? +(d.value as number)  : 'max' in d? +(d.max as number) : 0))

  const max_rect_height = 30
  const y = d3.scaleLinear()
      .domain([max_count, 0])
      .range([0, max_rect_height])

  const rect_width = (svg_width - padding_left) / bins.length


  const x = d3.scaleLinear()
      .domain([feature_min, feature_max])
      .range([padding_left + rect_width/2, svg_width-rect_width/2])

  // add x-axis with padding
  const xAxis = d3.axisBottom(x)

  // continuous  - check if bins are of bin_continuous type
  if (featureStore.get_feature_type(props.feature_name) == 'continuous') {
    xAxis.tickValues([feature_min, feature_max])
  }
  // discrete
  else {
    if (bins.length <= 4) {
      const bin_values = bins.map((d : bin_discrete) => d.value)
      xAxis.tickValues(bin_values)
      const bin_labels = bins.map((d : bin_discrete) => lbl(props.feature_name, d.value))
      xAxis.tickFormat((_,i) => bin_labels[i])
    }
    else {
      xAxis.tickValues([feature_min, feature_max])
      xAxis.tickFormat(d => lbl(props.feature_name, d))
    }
  }

  let axis = svg.append("g")
      .attr("transform", "translate(0, " + max_rect_height + ")")
      .style("font-size", "12px")
      .style("color", "grey")
      .call(xAxis)
  axis.selectAll(".domain, line") //remove the axis line
      .remove()


  //add rectangles with text
  let bin_elements = svg.selectAll(".bin_elements")
      .data(bins)
      .enter()
      .append("g")
      .attr("class", "bin_elements")
        .attr("x", (d :any) => d.min == undefined ? x(d.value) - rect_width/2 : x(d.min))
      .attr("y", 5)
      .attr("width", rect_width)
      .attr("height", d => y(d.count))

  // add rectangles with size based on count, going upwards
  bin_elements
      .append("rect")
      .attr("x", (d :any) => d.min == undefined ? x(d.value) - rect_width/2 : x(d.min))
      .attr("y", (d :any) => y(d.count))
      .attr("width", rect_width)
      .attr("height", (d :any) => y(0) - y(d.count))
      .attr("fill", (_,i) => i == featureStore.get_instance_bin_index(props.feature_name,instance_value.value) ? "grey" : "darkgrey")

  bin_elements
      .append("text")
      .attr("x", (d :any) => x(d.min == undefined ? d.value : d.min))
      .attr("y", max_rect_height - 15)
      .attr("dy", "0.4em")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("fill", (d :any) => d.count > max_count/2 ? "white" : "black")
      .style("opacity", "0")
      .text((d :any) => ((d.count/full_count)*100).toFixed(1) + "%")
  bin_elements
      .append("text")
      .text((d :any) => d.min == undefined ? lbl(props.feature_name,d.value) : d.min + " - " + d.max)
      .attr("x", (d :any) => x(d.min == undefined ? d.value : d.min))
      .attr("y", max_rect_height + 14)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("fill", "black")
      .style("font-size", "12px")
      .attr("dy", "0.1em")
      .style("opacity", "0")


  bin_elements
      .on("mouseover", (event: any, _:any) => {
        d3.select(event.target.parentNode).selectAll("text")
            .style("opacity", "1")
      })
      .on("mouseout", (event:any, _:any) => {
        d3.select(event.target.parentNode).selectAll("text")
            .style("opacity", "0")
      })

      // add y-axis
  svg.append("g")
      .attr("transform", `translate(${padding_left -5}, 0)`)
      .call(d3.axisLeft(y)
          .tickFormat((d) => d)
          .ticks(3))

  // add line as replacement for x-axis
  svg.append("line")
      .attr("x1", padding_left)
      .attr("y1", max_rect_height)
      .attr("x2", svg_width)
      .attr("y2", max_rect_height)
      .attr("stroke", "grey")
      .attr("stroke-width", 1)



  d3.select(container.value).selectAll("*").remove()
  d3.select(container.value).node().append(svg.node())

}

</script>

<template>
  <div class="d-flex justify-center ml-15">
    <div  ref="container"></div>
  </div>
</template>

<style scoped>

</style>