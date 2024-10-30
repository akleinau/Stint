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
        <v-divider></v-divider>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>