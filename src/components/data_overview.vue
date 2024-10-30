<script setup lang="ts">
import {useDataStore} from "../stores/dataStore.ts";

const dataStore = useDataStore()


import AbnormalVis from "../visualizations/abnormal-vis.vue";
import DistributionVis from "../visualizations/distribution-vis.vue";
import {ref} from "vue";

let show_details = ref<string>("")

const toggle_details = (key: string) => {
  show_details.value = show_details.value === key ? "" : key
}

const hasCorrelations = (key: string) => {
  return Object.values(dataStore.correlations[key]).some((v: number) => Math.abs(v) > 0.2)
}

</script>

<template>
  <div class="d-flex justify-center flex-column">
    <div v-for="key in dataStore.interacting_features">
      <div class="d-flex justify-center">
        <div class="d-flex mt-2 justify-end" style="width:150px"> {{ key }} = {{ dataStore.instance[key] }}</div>
        <AbnormalVis :feature_name="key"/>
        <v-btn @click="toggle_details(key)" density="compact"
               :icon="show_details == key? 'mdi-chevron-up' :'mdi-chevron-down'"> </v-btn>
      </div>
      <div v-if="show_details === key" class="mb-5 bg-grey-lighten-4 mx-5">
        <v-divider class="mb-2"></v-divider>
        <DistributionVis :feature_name="key"/>
        <div  class="d-flex mb-2 justify-center">
          <span v-if="hasCorrelations(key) ">Correlations: </span>
          <span v-else>(No correlations)</span>
          <span v-for="(corr, other_feature) in dataStore.correlations[key]">
            <v-chip class="mx-2" v-if="Math.abs(corr) > 0.2">
              {{ other_feature }}: {{ corr.toFixed(2) }}
            </v-chip>
          </span>
        </div>
        <v-divider></v-divider>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>