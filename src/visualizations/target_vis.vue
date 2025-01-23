<script setup lang="ts">
import * as d3 from "d3";
import {useTemplateRef, watch} from "vue";
import {useDataStore} from "../stores/dataStore.ts";
import {useInfluenceStore} from "../stores/influence_store.ts";

const dataStore = useDataStore()
const lbl = dataStore.get_label
const influenceStore = useInfluenceStore()

// watch dataStore.influence_scores
watch (() => influenceStore.influence.groups, (_) => {
  update_vis()
})

watch(() => dataStore.storyIsVisible, () => {
  update_vis()
})

watch(() => influenceStore.influence, () => {
  update_vis()
})


//refs
const container = useTemplateRef('container')

const update_vis = async () => {

  d3.select(container.value).selectAll("*").remove()

  const prediction = influenceStore.influence.explanation_prediction

   let svg = d3.create("svg")
      .attr("width", 800)
      .attr("height", 100)

  const min = dataStore.data_summary.min
  const max = dataStore.data_summary.max

  let scale = d3.scaleLinear().domain([min, max]).range([100, 700]).nice()

  const xAxis = d3.axisBottom(scale)

  // move the numbers of the axis down a notch
  xAxis.tickSize(10)

  // discrete
  const target_catalogue = dataStore.feature_catalogue[dataStore.target_feature]
  const classes = target_catalogue?.classes

  if (classes !== undefined) {
    xAxis.tickValues(classes.map((d : any) => d.value))
    xAxis.tickFormat((_,i) => classes[i].value)
  }
  else {
    xAxis.ticks(5)
  }

  // add the scale
  svg.append("g")
      .style("font-size", "15px")
      .attr("transform", "translate(0, 30)")
      .style("color", "#555555")
      .call(xAxis)

  // add class labels
  let padding = 0
  if (classes !== undefined) {
    padding = 10
    svg.selectAll(".classes")
        .data(classes)
        .enter()
        .append("text")
        .attr("x", (d : any) => scale(d.value))
        .attr("y",68)
        .attr("text-anchor", "middle")
        .style("fill", "#555555")
        .style("font-size", "15px")
        .text((d : any) => lbl(dataStore.target_feature, d.value))
  }

  // add name of scale
  svg.append("text")
      .attr("x", 400)
      .attr("y", 80 + padding)
      .attr("text-anchor", "middle")
      .text(lbl(dataStore.target_feature))
      .style("font-size", "15px")

  // add a circle for the prediction
  svg.append("circle")
      .attr("cx", scale(prediction))
      .attr("cy", 30)
      .attr("r", 7)
      .attr("fill", "black")

  // add the prediction text
  svg.append("text")
      .attr("x", scale(prediction))
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "15px")
      .text(prediction.toFixed(dataStore.target_decimals))



  d3.select(container.value).node().append(svg.node())

}

</script>

<template>
  <div class="w-100 d-flex flex-column align-center justify-center mt-2">
    <v-icon icon="mdi-arrow-down" size="20"></v-icon>
    <div class="story_text">
      When only considering the selected features,
      <span class="highlight">{{ lbl(dataStore.target_feature) }}</span>
      would be
      <span
          class="highlight2">{{ influenceStore.influence.explanation_prediction.toFixed(dataStore.target_decimals) }}</span>.
    </div>
    <div ref="container" class="px-5"/>
  </div>
</template>

<style scoped>

</style>