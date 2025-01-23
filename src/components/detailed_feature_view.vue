<script setup lang="ts">
import DistributionVis from "../visualizations/distribution-vis.vue";
import AbnormalVis from "../visualizations/abnormal-vis.vue";
import {useDataStore} from "../stores/dataStore.ts";
import {useFeatureStore} from "../stores/feature_store.ts";
import {watch} from "vue";


const props = defineProps(['feature', 'show_abnormal'])


const dataStore = useDataStore()
const lbl = dataStore.get_label
const featureStore = useFeatureStore()

const hasCorrelations = (key: string) => {
  return Object.values(dataStore.correlations[key]).some((v: number) => Math.abs(v) > 0.2)
}

const get_bin_percent = (feature: string) => {
  const dataset_size = dataStore.data.length
  const bins = featureStore.get_feature_bins(feature)
  const bin_nr = featureStore.get_instance_bin_index(feature, dataStore.instance[feature])
  const bin_size = bins[bin_nr].count
  return ((bin_size / dataset_size) * 100).toFixed(0) + "%"
}

watch( () => dataStore.interacting_features, () => {
  dataStore.selected_feature = null
})

</script>

<template>


  <div class="mb-2 mx-5 d-flex flex-column justify-center align-center w-100" v-if="dataStore.selected_feature != null">


    <h3 class="mb-2"> The selected attribute is
      <span class="highlight">
        {{ lbl(props.feature) }}: {{ lbl(props.feature, dataStore.instance[props.feature]) }}
      </span>
    </h3>
    <div class="d-flex justify-center mt-2" v-if="props.show_abnormal">
      <AbnormalVis :feature_name="props.feature"/>
    </div>
    <div style="font-size:15px" class="mb-5" v-if="dataStore.feature_abnormality[feature] > 0.5">
      {{ get_bin_percent(props.feature)}} of the instances have this value.
    </div>

    <div style="font-size:15px; color:darkred" class="mb-5" v-else>
      {{ get_bin_percent(props.feature)}} of the instances
    </div>
    <div class="mb-2" style="font-size:16px"> It has the following value distribution: </div>
    <DistributionVis :feature_name="dataStore.selected_feature"/>
    <div class="mb-2"  style="font-size:16px"> It has the following correlations with other attributes: </div>
    <div class="d-flex mb-2 justify-center">
      <span v-if="hasCorrelations(props.feature)" class="text-grey-darken-1">
        <span v-for="(corr, other_feature) in dataStore.correlations[props.feature]">
            <v-chip class="mx-2" v-if="Math.abs(corr) > 0.05" variant="outlined">
              {{ lbl(other_feature) }}: {{ corr.toFixed(2) }}
            </v-chip>
        </span>
      </span>
      <span v-else>(No correlations)</span>

    </div>

  </div>
</template>

<style scoped>

</style>