<script setup lang="ts">
import * as d3 from "d3";
import {ref, useTemplateRef, watch} from 'vue'
import {useDataStore} from "../stores/dataStore";
import {useInfluenceStore} from "../stores/influence_store.ts";

const dataStore = useDataStore()
const influenceStore = useInfluenceStore()

// watch dataStore.influence_scores
watch (() => influenceStore.influence.groups, (_) => {
  update_vis()
})

watch(() => dataStore.storyIsVisible, () => {
  update_vis()
})

watch(() => influenceStore.influence, () => {
  update_vis(false)
})


//refs
const container = useTemplateRef('container')

const min = ref<number>(0)
const max = ref<number>(1)
const scale = ref<any>(d3.scaleLinear().domain([min.value, max.value]).range([0, 800]))
const bar_height = 25
const padding_top = 20
const padding_bar = 10
const text_height = 20

const updater = ref(0)

watch(() => updater.value, () => {
  update_vis(false)
})

const update_vis = async (isSlow:boolean=true) => {

  d3.select(container.value).selectAll("*").remove()

  const prediction = influenceStore.influence.explanation_prediction - dataStore.data_summary.mean

  if (!dataStore.storyIsVisible || influenceStore.influence.groups.length === 0) {
    return
  }

  const height = padding_top + bar_height + 2*padding_bar + text_height

  let svg = d3.create("svg")
      .attr("width", 800)
      .attr("height", height)

  const range = dataStore.get_subset_influence_range()
  min.value = range[0]
  max.value = range[1]
  scale.value = d3.scaleLinear().domain([min.value, max.value]).range([100, 700])

  let layers = []
  for (let i = 0; i < 3; i++) {
    layers.push(svg.append("g"))
  }


  // add axis and add a "+" in front of positive values
  let axis = d3.axisTop(scale.value)
      .tickFormat((d) => {
        if (d > 0) {
          return "+" + d
        }
        return d
      })
      .ticks(10)

  // add black vertical line at 0
  layers[2].append("line")
      .attr("x1", scale.value(0))
      .attr("y1", padding_top)
      .attr("x2", scale.value(0))
      .attr("y2", padding_top + bar_height + 2*padding_bar)
      .attr("stroke", "black")
      .attr("stroke-width", 2)

  // add one bar for the prediction
          let rect = layers[1].append("rect")
            .attr("x", prediction < 0 ? scale.value(prediction) : scale.value(0))
            .attr("y", padding_top + padding_bar)
            .attr("width", scale.value(Math.abs(prediction)) - scale.value(0))
            .attr("fill", prediction < 0 ? "crimson" : "darkslateblue")
            .style("cursor", "pointer")

        //optionally animate
        if (isSlow) {
            rect.transition()
            .attr("height", bar_height)
        }
       else {
            rect.attr("height", bar_height)
        }

   // add text under the bar stating prediction value
    layers[1].append("text")
        .attr("x", scale.value(prediction) + 5)
        .attr("y", padding_top + bar_height + padding_bar + text_height)
        .text(prediction.toFixed(0))
        .style("font-size", "15px")
        .style("color", "#555555")
        .style("font-weight", "bold")
        .style("text-anchor", "middle")


  d3.select(container.value).node().append(svg.node())

}

</script>

<template>
  <div class="w-100 d-flex flex-column align-center justify-center">
    <div ref="container" class="px-5"/>
    <div v-if="false">
      Prediction: {{dataStore.instance[dataStore.target_feature] - dataStore.data_summary.mean}}
      Explanation: {{influenceStore.influence.explanation_prediction  - dataStore.data_summary.mean}}
    </div>
  </div>
</template>

<style scoped>

</style>