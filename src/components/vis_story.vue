<script setup lang="ts">
import InfluenceVis from "../visualizations/influence_vis.vue";
import InfluenceSummaryVis from "../visualizations/influence_summary_vis.vue";
import {useDataStore} from "../stores/dataStore";
import {useInfluenceStore} from "../stores/influence_store.ts";
import {watch} from "vue";

const dataStore = useDataStore()
const influenceStore = useInfluenceStore()


// also watch dataStore.instance
watch(() => dataStore.instance, () => {
  if (dataStore.storyIsVisible) {
      influenceStore.calculate_influences()
  }

}, {deep:true})

</script>

<template>
  <div class="w-100 d-flex flex-column align-center justify-center">
    <h3 class="pt-5" v-if="influenceStore.influence.groups.length>0 && dataStore.storyIsVisible ">
      Feature influence on {{dataStore.target_feature}}:
    </h3>
    <InfluenceVis />
    <h3 class="pt-5" v-if="influenceStore.influence.groups.length>0 && dataStore.storyIsVisible ">
      ... resulting in a combined influence of:
    </h3>
    <InfluenceSummaryVis />

    <!-- hint -->
    <div class="w-100 d-flex justify-end align-right align-content-end align-end">
      <v-icon class="mr-1">mdi-cursor-default-click-outline </v-icon>
      <i> click on one of the features to learn more about it! </i>
    </div>

  </div>
</template>

<style scoped>

</style>