<script setup lang="ts">

import DependencyVis from "../visualizations/dependency_vis.vue";
import {useDataStore} from "../stores/dataStore.ts";
import {useInfluenceStore} from "../stores/influence_store.ts";
import {useDetailStore} from "../stores/detail_store.ts";
import {useTemplateRef, watch} from "vue";
import * as d3 from "d3"

let dataStore = useDataStore()
let influenceStore = useInfluenceStore()
let detailStore = useDetailStore()

const container = useTemplateRef('container')

// trigger update on detailStore.selected_feature change
watch(() => detailStore.selected_feature, () => {
  console.log("update detail view")
})

</script>

<template>
  <div class="w-100 d-flex flex-column align-center justify-center">
    <h3 class="pt-5" v-if="influenceStore.groups.length>0 && dataStore.storyIsVisible ">Detail View</h3>
    <div v-if="detailStore.selected_feature !== null">
      <div> {{ detailStore.selected_feature.get_name() }}</div>
      <div> subset size: {{ detailStore.selected_feature.get_size() }}</div>
      <DependencyVis />
    </div>




  </div>
</template>

<style scoped>

</style>