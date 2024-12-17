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
  influenceStore.calculate_influences()
}, {deep:true})

</script>

<template>
  <div class="w-100 d-flex flex-column align-center justify-center">
    <h3 class="pt-5" v-if="influenceStore.influence.groups.length>0 && dataStore.storyIsVisible ">
      Influence of the Features
    </h3>
    <InfluenceVis />
    <h3 class="pt-5" v-if="influenceStore.influence.groups.length>0 && dataStore.storyIsVisible ">
      their combined influence...
    </h3>
    <InfluenceSummaryVis />

  </div>
</template>

<style scoped>

</style>