<script setup lang="ts">
import DistributionVis from "../visualizations/distribution-vis.vue";
import AbnormalVis from "../visualizations/abnormal-vis.vue";
import {useDataStore} from "../stores/dataStore.ts";


const props = defineProps(['feature', 'show_abnormal'])


const dataStore = useDataStore()

const hasCorrelations = (key: string) => {
  return Object.values(dataStore.correlations[key]).some((v: number) => Math.abs(v) > 0.2)
}

</script>

<template>
      <div class="mb-2 bg-grey-lighten-4 mx-5">
        <v-divider class="mb-2"></v-divider>
        <div class="d-flex justify-center" v-if="props.show_abnormal">
          <div class="d-flex mt-2 justify-end" style="width:150px"> {{ props.feature }} = {{ dataStore.instance[props.feature] }}</div>
          <AbnormalVis  :feature_name="props.feature"/>
        </div>
        <DistributionVis :feature_name="props.feature"/>
        <div  class="d-flex mb-2 justify-center">
          <span v-if="hasCorrelations(props.feature) ">Correlations: </span>
          <span v-else>(No correlations)</span>
          <span v-for="(corr, other_feature) in dataStore.correlations[props.feature]">
            <v-chip class="mx-2" v-if="Math.abs(corr) > 0.2">
              {{ other_feature }}: {{ corr.toFixed(2) }}
            </v-chip>
          </span>
        </div>
        <v-divider></v-divider>
      </div>
</template>

<style scoped>

</style>