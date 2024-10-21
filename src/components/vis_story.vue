<script setup lang="ts">
import * as d3 from "d3";
import {ref, watch} from 'vue'
import {useDataStore} from "../stores/dataStore";

const dataStore = useDataStore()

// watch dataStore.influence_scores
watch (() => dataStore.influence_scores, (_) => {
  update_vis()
})

const update_vis = () => {
  let container = document.getElementById("container")
  container.innerHTML = ""
  let svg = d3.select(container).append("svg")
      .attr("width", 1000)
      .attr("height", 500)

  let data = dataStore.influence_scores
  if (data.length === 0) {
    return
  }

  const min = Math.min(0, dataStore.data_summary.min)
  const max = dataStore.data_summary.max
  const scale = d3.scaleLinear().domain([min, max]).range([0, 500])
  const bar_height = 20

  // add axis
  let axis = d3.axisBottom(scale)
  svg.append("g")
      .attr("transform", "translate(0, " + (data.length * (bar_height+10)) + ")")
      .call(axis)



  // add black vertical line at 0
  svg.append("line")
      .attr("x1", scale(dataStore.data_summary.mean))
      .attr("y1", 0)
      .attr("x2", scale(dataStore.data_summary.mean))
      .attr("y2", data.length * (bar_height+10))
      .attr("stroke", "black")
      .attr("stroke-width", 2)

  // draw bars
  svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => d.score < 0 ? scale(d.value): scale(d.value - d.score))
      .attr("y", (d, i) => i * (bar_height+10))
      .attr("width", d => scale(Math.abs(d.score)) - scale(0))
      .attr("height", bar_height)
      .attr("fill", d => d.score < 0 ? "red" : "blue")

  // draw value lines, vertically
  svg.selectAll("line_vertical")
      .data(data)
      .join("line")
      .attr("x1", d => scale(d.value))
      .attr("y1", (d, i) => i * (bar_height+10))
      .attr("x2", d => scale(d.value))
      .attr("y2", (d, i) => (i+1) * (bar_height+10) + bar_height)
      .attr("stroke", "grey")
      .attr("stroke-width", 2)


  // add text (feature = instance_value)
  svg.selectAll("text_feature_names")
      .data(data)
      .join("text")
      .attr("x", 500)
      .attr("y", (d, i) => i * (bar_height+10) + bar_height/2)
      .text((d, i) => d.feature + " = " + d.instance_value )
      .style("font-size", "12px")
      .style("text-anchor", "start")
      .style("color", "black")

}


</script>

<template>
  <div class="w-100 d-flex flex-column align-center justify-center">
    <h3 class="pt-5" v-if="dataStore.influence_scores.length>0">Your Story</h3>
    <div id="container" class="px-5 pt-5 w-50"/>
  </div>
</template>

<style scoped>

</style>