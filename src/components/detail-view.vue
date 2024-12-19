<script setup lang="ts">

import DependencyVis from "../visualizations/dependency_vis.vue";
import ImpactVis from "../visualizations/impact_vis.vue";
import {useDataStore} from "../stores/dataStore.ts";
import {useInfluenceStore} from "../stores/influence_store.ts";
import {useDetailStore} from "../stores/detail_store.ts";
import {useTemplateRef, watch} from "vue";
import * as d3 from "d3"

let dataStore = useDataStore()
let influenceStore = useInfluenceStore()
let detailStore = useDetailStore()

const container = useTemplateRef('container')

const min_feature_value = (feature_name: string) => {
  return d3.min(dataStore.data.map(d => d[feature_name]))
}

const max_feature_value = (feature_name: string) => {
  return d3.max(dataStore.data.map(d => d[feature_name]))
}

const get_name = () => {
  return detailStore.selected_feature.get_feature_names()
}

// trigger update on detailStore.selected_feature change
watch(() => detailStore.selected_feature, () => {
  console.log("update detail view")
})

watch( () => dataStore.interacting_features, () => {
  detailStore.selected_feature = null
})

</script>

<template>
  <div class="w-100 d-flex flex-column align-center justify-center" v-if="detailStore.selected_feature != null">
     <div class="w-100 d-flex justify-end align-right align-content-end align-end">
       <v-btn @click="detailStore.selected_feature = null" variant="text" prepend-icon="mdi-close" >close</v-btn>
    </div>


    <h3 v-if="influenceStore.influence.groups.length>0 && dataStore.storyIsVisible ">
      The selected feature: {{ detailStore.selected_feature.get_feature_names() }}
    </h3>
    <div v-if="detailStore.selected_feature !== null" class="d-flex flex-column align-center justify-center"  style="font-size:16px">
      <div> {{ detailStore.selected_feature.get_name() }} </div>
      <div class="mt-3" style="font-size:16px">
        How do different values of {{ detailStore.selected_feature.get_feature_names() }} impact the combined influence?
      </div>
      <ImpactVis />
      <div> {{detailStore.selected_feature.get_feature_names() }} </div>
      <VSlider v-model="dataStore.instance[get_name()]" :min="min_feature_value(get_name())" :max="max_feature_value(get_name())" :step="1"
        width="460px"/>




    </div>

    <!-- hint -->
    <div class="w-100 d-flex justify-end align-right align-content-end align-end mt-3">
      <v-icon class="mr-1">mdi-arrow-left-right</v-icon>
      <i> move the slider to change the value of {{detailStore.selected_feature.get_feature_names() }}! </i>
    </div>


  </div>
</template>

<style scoped>

</style>