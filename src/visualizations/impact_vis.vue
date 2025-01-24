<script setup lang="ts">
import * as d3 from "d3";
import {useTemplateRef, onMounted, ref, watch} from 'vue'
import {useDataStore} from "../stores/dataStore.ts";
import {useDetailStore} from "../stores/detail_store.ts";
import {useInfluenceStore} from "../stores/influence_store.ts";
import {bin_discrete, useFeatureStore} from "../stores/feature_store.ts";
import Constants from "../stores/constants.ts";

const dataStore = useDataStore()
const lbl = dataStore.get_label
const detailStore = useDetailStore()
const influenceStore = useInfluenceStore()
const featureStore = useFeatureStore()

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
  detailStore.calculate_feature_change_impact_values()
  update_vis()
})

const get_prediction = () => {
  const value = influenceStore.influence.explanation_prediction - dataStore.data_summary.mean
  return (value > 0 ? "+" : "-") + Math.abs(value / dataStore.data_summary.mean * 100).toFixed(0) + "%"
}

const get_feature_name = () => {
  return detailStore.selected_feature.get_feature_names()
}

const update_vis = () => {

  let values = detailStore.change_impacts

  const svg_width = 500
  const svg_height = 120
  const y_padding_below = 30
  const y_padding_top = 30
  const padding_sides = 65

  let svg = d3.create("svg")
      .attr("width", svg_width + 20)
      .attr("height", svg_height)
      .attr("viewBox", [-10, 0, svg_width + 20, svg_height])

  // create x-axis based on keys of vis_bins and set_vis_bins
  let min_x = detailStore.min_x
  let max_x = detailStore.max_x

  let x = d3.scaleLinear()
      .domain([min_x,max_x])
      .range([padding_sides/2, svg_width-padding_sides/2])

  const range = dataStore.get_subset_influence_range()
  let min_y = to_percent(range[0])
  let max_y = to_percent(range[1])

  let y = d3.scaleLinear().nice()
      .domain([min_y, max_y])
      .range([svg_height- y_padding_below, y_padding_top])


  // add horizontal zero impact line
  svg.append("line")
      .attr("x1", x(min_x))
      .attr("y1", y(0))
      .attr("x2", x(max_x))
      .attr("y2", y(0))
      .attr("stroke", "black")
      .attr("stroke-width", 2)


  // add area for vis_bins, color in red if below zero, blue if above zero
  let area_below_zero = d3.area()
      .x(d => x(d.x))
      .y0(y(0))
      .y1(d => y(d.impact < 0 ? to_percent(d.impact) : 0))
  svg.append("path")
      .datum(values)
      .attr("d", area_below_zero)
      .attr("fill", Constants.overview_color_negative)

  let area_above_zero = d3.area()
      .x(d => x(d.x))
      .y0(y(0))
      .y1(d => y(d.impact > 0 ? to_percent(d.impact) : 0))
  svg.append("path")
      .datum(values)
      .attr("d", area_above_zero)
      .attr("fill", Constants.overview_color_positive)

  // add curve for vis_bins
  let line = d3.line()
      .x(d => x(d.x))
      .y(d => y(to_percent(d.impact)))
  svg.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 3)
      .attr("d", line)
      .attr("opacity", 1)

    // add line for instance value
  svg.append("line")
      .attr("x1", x(instance_value.value))
      .attr("y1", y_padding_top)
      .attr("x2", x(instance_value.value))
      .attr("y2", svg_height)
      .attr("stroke", "darkgrey")
      .attr("stroke-width", 4)

  // add current prediction value on top
  svg.append("text")
      .attr("x", x(instance_value.value))
      .attr("y", 20)
      .text(get_prediction())
      .style("text-anchor", "middle")
      .style("fill", "grey")


  let xAxis = d3.axisBottom(x)
  // continuous  - check if bins are of bin_continuous type
  if (featureStore.get_feature_type(get_feature_name()) == 'continuous') {
    xAxis.tickValues([min_x, max_x])
  }
  // discrete
  else {
    let bins = featureStore.get_feature_bins(get_feature_name())
    if (bins.length <= 4) {
      const bin_values = bins.map((d : bin_discrete) => d.value)
      xAxis.tickValues(bin_values)
      const bin_labels = bins.map((d : bin_discrete) => lbl(get_feature_name(), d.value))
      xAxis.tickFormat((_,i) => bin_labels[i])
    }
    else {
      xAxis.tickValues([min_x, max_x])
      xAxis.tickFormat(d => lbl(get_feature_name(), d))
    }
  }



  // add x-axis
  svg.append("g")
      .attr("transform", `translate(0, ${svg_height - y_padding_below})`)
      .call(xAxis)

  // add y-axis
  svg.append("g")
      .attr("transform", `translate(${padding_sides/2}, 0)`)
      .call(d3.axisLeft(y)
          .tickFormat((d) => get_value_text(d))
          .ticks(5))

  // turn around whole svg 90 degrees
  //svg.attr("transform", "rotate(90)")





  d3.select(container.value).selectAll("*").remove()
  d3.select(container.value).node().append(svg.node())

}

const get_value_text = (value:number) => {
  //percentage
  return (value > 0 ? "+" : "") + value.toFixed(0) + "%"
}

const to_percent = (value:number) => {
  return value / dataStore.data_summary.mean * 100
}

</script>

<template>
  <div class="d-flex justify-center flex-column">
    <div ref="container"></div>
  </div>
</template>

<style scoped>

</style>