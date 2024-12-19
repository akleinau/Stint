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


  <div class="mb-2 mx-5 d-flex flex-column justify-center align-center w-100" v-if="dataStore.selected_feature != null">


    <h3 class="mb-2"> The selected feature: {{ props.feature }} =
        {{ dataStore.instance[props.feature] }} </h3>

    <div class="d-flex justify-center" v-if="props.show_abnormal">
      <AbnormalVis :feature_name="props.feature"/>
    </div>
    <div class="mb-2" style="font-size:16px"> It has the following value distribution: </div>
    <DistributionVis :feature_name="props.feature"/>
    <div class="mb-2"  style="font-size:16px"> It has the following correlations with other features: </div>
    <div class="d-flex mb-2 justify-center">
      <span v-if="hasCorrelations(props.feature)" class="text-grey-darken-1">Correlations: </span>
      <span v-else>(No correlations)</span>
      <span v-for="(corr, other_feature) in dataStore.correlations[props.feature]">
            <v-chip class="mx-2" v-if="Math.abs(corr) > 0.2" variant="outlined">
              {{ other_feature }}: {{ corr.toFixed(2) }}
            </v-chip>
          </span>
    </div>

  </div>
</template>

<style scoped>

</style>