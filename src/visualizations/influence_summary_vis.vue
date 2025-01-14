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
let prediction = influenceStore.influence.explanation_prediction - dataStore.data_summary.mean

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
            .attr("fill", prediction < 0 ? "#ffadb6" : "#a6cff4")
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
        .attr("x", scale.value(prediction))
        .attr("y", padding_top + bar_height + padding_bar + text_height)
        .text( (prediction > 0 ? " +" : "") + prediction.toFixed(0))
        .style("font-size", "15px")
        .style("color", "#555555")
        .style("font-weight", "bold")
        .style("text-anchor", "middle")


  d3.select(container.value).node().append(svg.node())

}

const get_prediction_change_text = () => {
  const prediction = influenceStore.influence.explanation_prediction - dataStore.data_summary.mean
  if (prediction < 0) {
    return "reducing"
  }
  else {
    return "increasing"
  }
}

const get_prediction_text = () => {
  return Math.abs(influenceStore.influence.explanation_prediction - dataStore.data_summary.mean).toFixed(0)
}

const get_influence_sign_text = () => {
  const influence = influenceStore.influence.explanation_prediction - dataStore.data_summary.mean
  if (influence > 0) {
    return "positive"
  }
  else if (influence < 0) {
    return "negative"
  }
  else {
    return "neutral"
  }
}

</script>

<template>
  <div class="w-100 d-flex flex-column align-center justify-center">
    <h3 class="pt-5" v-if="influenceStore.influence.groups.length>0 && dataStore.storyIsVisible ">
      ... their combined influence is {{get_influence_sign_text()}}:
    </h3>
    <div ref="container" class="px-5"/>
    <div class=" story_text" >
      {{ get_prediction_change_text() }} the value of
      <span class="highlight">{{ dataStore.target_feature }}</span>
        by
       <span class="highlight">{{ get_prediction_text() }}</span>
      compared
      to its average of
       <span class="highlight" v-if="dataStore.data_summary.mean !== undefined">{{dataStore.data_summary.mean.toFixed(0)}}</span>.
    </div>
    <v-icon icon="mdi-arrow-down" size="20"></v-icon>
    <div class="mb-4 story_text">
      When only considering the selected features,
      <span class="highlight">{{ dataStore.target_feature }}</span>
      would be
      <span class="highlight">{{influenceStore.influence.explanation_prediction.toFixed(0)}}</span>.
    </div>
    <div v-if="false">
      Prediction: {{dataStore.instance[dataStore.target_feature] - dataStore.data_summary.mean}}
      Explanation: {{influenceStore.influence.explanation_prediction  - dataStore.data_summary.mean}}
    </div>
  </div>
</template>

<style scoped>

</style>