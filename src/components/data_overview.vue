<script setup lang="ts">
import {useDataStore} from "../stores/dataStore.ts";

const dataStore = useDataStore()


import AbnormalVis from "../visualizations/abnormal-vis.vue";
import {ref, watch} from "vue";
import DetailedFeatureView from "./detailed_feature_view.vue";

let show_details = ref<string>("")
let show_details_background = ref<string>("")
let background_features = ref<string[]>([])
let focus_features = ref<string[]>([])

const toggle_details = (key: string) => {
  show_details.value = show_details.value === key ? "" : key
}

const toggle_details_background = (key: string) => {
  show_details_background.value = show_details_background.value === key ? "" : key
}

//watch dataStore.interacting_features
watch(() => dataStore.storyIsVisible, () => {
  update()
})

watch(() => dataStore.shown_features, () => {
  update()
})

// also watch dataStore.instance
watch(() => dataStore.instance, () => {
  dataStore.storyIsVisible = false
}, {deep:true})

const update = () => {
  show_details.value = ""
  background_features.value = []
  focus_features.value = []
  const abnormal_boundary = 0.5

  if (!dataStore.storyIsVisible) {
    return
  }

  dataStore.calculate_abnormality()

  for (let feature of dataStore.shown_features) {
    if (dataStore.feature_abnormality[feature] < abnormal_boundary) {
      focus_features.value.push(feature)
    } else {
      background_features.value.push(feature)
    }
  }
}

</script>

<template>
  <div class="d-flex justify-center flex-column" v-if="dataStore.storyIsVisible">

    <div class="d-flex justify-center mb-5">
      <h3 >Data Overview</h3>
    </div>

    <!-- background features -->
    <div  class="d-flex justify-center mb-3 flex-wrap">
      <div v-for="key in background_features" class="pa-1">
        <v-chip @click="toggle_details_background(key)" :variant="show_details_background == key? 'elevated' : 'tonal' ">
          {{key}} = {{dataStore.instance[key]}}
        </v-chip>
      </div>
    </div>
    <div v-if="show_details_background !== ''">
      <DetailedFeatureView :feature="show_details_background" :show_abnormal="true"/>
      <div class="d-flex justify-center mb-5">
        <v-btn @click="toggle_details_background('')" density="compact" icon="mdi-chevron-up" variant="tonal"></v-btn>
      </div>
    </div>



    <!-- focus features -->
    <div v-for="key in focus_features">
      <div class="d-flex justify-center">
        <div class="d-flex mt-2 justify-end" style="width:150px"> {{ key }} = {{ dataStore.instance[key] }}</div>
        <AbnormalVis :feature_name="key"/>
        <v-btn @click="toggle_details(key)" density="compact"
               :icon="show_details == key? 'mdi-chevron-up' :'mdi-chevron-down'"> </v-btn>
      </div>

      <!-- detailed view -->
      <DetailedFeatureView v-if="show_details == key" :feature="key" :show_abnormal="false"/>


    </div>


  </div>
</template>

<style scoped>

</style>