<script setup lang="ts">
import * as d3 from "d3";
import {ref, useTemplateRef, watch} from 'vue'
import {useDataStore} from "../stores/dataStore";

const dataStore = useDataStore()

// watch dataStore.influence_scores
watch (() => dataStore.influence_scores, (_) => {
  update_vis()
})

//refs
const container = useTemplateRef('container')

const min = ref<number>(0)
const max = ref<number>(1)
const scale = ref<any>(d3.scaleLinear().domain([min.value, max.value]).range([0, 500]))
const bar_height = 20

const update_vis = () => {
  let svg = d3.create("svg")
      .attr("width", 1000)
      .attr("height", 500)

  let data = dataStore.influence_scores
  if (data.length === 0) {
    return
  }

  min.value = Math.min(0, dataStore.data_summary.min)
  max.value = dataStore.data_summary.max
  const spacing = 0.01* (dataStore.data_summary.max - dataStore.data_summary.min)
  min.value = Math.min(d3.min(data, d => d.value), dataStore.data_summary.mean)  - spacing
  max.value = Math.max(d3.max(data, d => d.value), dataStore.data_summary.mean)  + spacing
  scale.value = d3.scaleLinear().domain([min.value, max.value]).range([0, 500])

  // add axis
  let axis = d3.axisBottom(scale.value)
  svg.append("g")
      .attr("transform", "translate(0, " + (data.length * (bar_height+10)) + ")")
      .call(axis)

  // add black vertical line at 0
  svg.append("line")
      .attr("x1", scale.value(dataStore.data_summary.mean))
      .attr("y1", 0)
      .attr("x2", scale.value(dataStore.data_summary.mean))
      .attr("y2", data.length * (bar_height+10))
      .attr("stroke", "black")
      .attr("stroke-width", 2)

  d3.select(container.value).selectAll("*").remove()
  d3.select(container.value).node().append(svg.node())

  slowly_add_bars(data, svg)



}

const slowly_add_bars = (data, svg) => {
  let i = 1
  let interval = setInterval(() => {
    add_bars(data.slice(0, i), svg)
    i++
    if (i > data.length) {
      clearInterval(interval)
    }
  }, 1000)
}

const add_bars = (data, svg) => {

  // draw bars
  svg.selectAll(".bars")
      .data(data)
      .enter()
      .append("rect")
      .transition()
      .attr("x", d => d.score < 0 ? scale.value(d.value): scale.value(d.value - d.score))
      .attr("y", (d, i) => i * (bar_height+10))
      .attr("class", "bars")
      .attr("width", d => scale.value(Math.abs(d.score)) - scale.value(0))
      .attr("height", bar_height)
      .attr("fill", d => d.score < 0 ? "crimson" : "darkslateblue")

  // draw value lines, vertically
  svg.selectAll(".line_vertical")
      .data(data)
      .join("line")
      .transition()
      .attr("x1", d => scale.value(d.value))
      .attr("y1", (d, i) => i * (bar_height+10))
      .attr("x2", d => scale.value(d.value))
      .attr("y2", (d, i) => (i+1) * (bar_height+10) + bar_height)
      .attr("class", "line_vertical")
      .attr("stroke", "grey")
      .attr("stroke-width", 2)


  // add text (feature = instance_value)
  svg.selectAll(".text_feature_names")
      .data(data)
      .join("text")
      .transition()
      .attr("x", 500)
      .attr("y", (d, i) => i * (bar_height+10) + bar_height/2)
      .attr("class", "text_feature_names")
      .text((d, i) => d.feature + " = " + d.instance_value )
      .style("font-size", "12px")
      .style("font-family", "Verdana")
      .style("text-anchor", "start")
      .style("color", "black")
}


</script>

<template>
  <div class="w-100 d-flex flex-column align-center justify-center">
    <h3 class="pt-5" v-if="dataStore.influence_scores.length>0">Your Story</h3>
    <div ref="container" class="px-5 pt-5 w-50"/>
  </div>
</template>

<style scoped>

</style>