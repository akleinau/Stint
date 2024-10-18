<script setup lang="ts">
import {ref} from 'vue'
import * as d3 from "d3";

import {useDataStore} from "../stores/dataStore.ts";
const dataStore = useDataStore()

const files = ref(null)

const uploaded = (files: any) => {
  const csvFile = files;
  let name = csvFile.name.replace('.csv', '')
  const reader = new FileReader();
  reader.onload = (event: any) => {
    const data = d3.csvParse(event.target.result)
    dataStore.feature_names = data.columns
    console.log(name)
  }
  reader.readAsText(csvFile)
}

const target_selected = (col: string) => {
  dataStore.target_feature = col
  dataStore.non_target_features = dataStore.feature_names.filter((f: string) => f !== col)
  console.log("target column selected: " + dataStore.target_feature)

}

const interacting_features_selected = (cols: string[]) => {
  dataStore.interacting_features = cols
  console.log("interacting columns selected: " + dataStore.interacting_features)
}

const explain = () => {
  console.log("Explain")
}

</script>

<template>
  <div class="w-100">
    <div class="mx-3 align-center justify-center">
      <div class="d-flex align-center justify-center">
        <div class="mt-3 w-25">
          <v-file-input label="Choose CSV file" v-model="files"
                        accept=".csv"
                        @update:modelValue="uploaded"></v-file-input>
        </div>
        <div v-if="dataStore.feature_names.length !== 0" class="mt-3 w-25">
          <v-autocomplete v-model="dataStore.target_feature" class="px-5" label="Select outcome column"
                          :items="dataStore.feature_names"
                          @update:modelValue="target_selected"/>
        </div>
      </div>
      <div class="d-flex flex-column align-center justify-center">
        <div v-if="dataStore.target_feature !== ''" class="mt-3 w-50">
          <v-autocomplete v-model="dataStore.interacting_features" class="px-5" label="Select interacting features"
                          :items="dataStore.non_target_features"
                          multiple
                          @update:modelValue="interacting_features_selected"/>
        </div>
        <div v-if="dataStore.interacting_features.length !== 0" class="mt-3">
          <v-btn @click="explain" class="bg-blue">Explain</v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
