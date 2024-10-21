<script setup lang="ts">
import {ref} from 'vue'
import * as d3 from "d3";

import {useDataStore} from "../stores/dataStore.ts";

const dataStore = useDataStore()

const files = ref(null)
const instance_nr = ref(26)
const isCustomInstance = ref(false)

const make_numeric = (data: any) => {
  // convert all columns to numeric
  data.columns.forEach((col: string) => {
    data.forEach((d: any) => {
      d[col] = +d[col]
    })
  })

  // delete all columns with non-numeric values
  let delete_cols = [] as string[]
  data.columns.forEach((col: string) => {
    if (data.map((d: any) => d[col]).some((v: any) => isNaN(v))) {
      console.log("Deleting column", col, "because it contains non-numeric values")
      delete_cols.push(col)
    }
  })
  delete_cols.forEach((col: string) => {
    data.columns = data.columns.filter((c: string) => c !== col)
    data.forEach((d: any) => {
      delete d[col]
    })
  })

  return data
}

const add_id = (data: any) => {
  data.forEach((d: any, i: number) => {
    d.__id__ = i
  })
  return data
}

const uploaded = (files: any) => {
  const csvFile = files;
  const reader = new FileReader();
  reader.onload = (event: any) => {
    let data = d3.csvParse(event.target.result)
    data = make_numeric(data)
    data = add_id(data)
    dataStore.feature_names = data.columns
    dataStore.data = data
  }
  reader.readAsText(csvFile)
}

const target_selected = (col: string) => {
  dataStore.target_feature = col
  dataStore.instance = JSON.parse(JSON.stringify(dataStore.data[instance_nr.value])) //makes sure there is always an instance selected
  dataStore.non_target_features = dataStore.feature_names.filter((f: string) => f !== col)
  let summary = {} as any
  summary.mean = dataStore.data.map((d: any) => d[col]).reduce((a: number, b: number) => a + b) / dataStore.data.length
  summary.min = Math.min(...dataStore.data.map((d: any) => d[col]))
  summary.max = Math.max(...dataStore.data.map((d: any) => d[col]))
  dataStore.data_summary = summary

}

const instance_selected = (_) => {
  dataStore.instance = JSON.parse(JSON.stringify(dataStore.data[instance_nr.value]))
}

const interacting_features_selected = (cols: string[]) => {
  dataStore.interacting_features = cols
}

const explain = () => {
  console.log("Explain")
  console.log(dataStore.instance)
  dataStore.calculate_instance_averages()
  dataStore.calculate_sorted_influence_scores()
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
      <div class="d-flex flex-column align-center justify-center" v-if="dataStore.target_feature !== ''">
        <v-btn-toggle v-model="isCustomInstance" class="mt-3" @update:model-value="instance_selected">
          <v-btn :value="true">custom instance</v-btn>
          <v-btn :value="false">select instance</v-btn>
        </v-btn-toggle>
        <div v-if="isCustomInstance" class="w-50 pb-5">
          <div v-for="key in dataStore.interacting_features" class="mt-3 w-100">
            <v-text-field v-model="dataStore.instance[key]" class="px-5 w-100" :label="key"
                          variant="underlined" hide-details clearable density="compact" single-line>
              <template v-slot:prepend-inner>
                <div class="d-flex">
                  <span> {{ key }} </span>
                  <span> : </span>
                </div>
              </template>
            </v-text-field>
          </div>

        </div>
        <div class="w-50" v-else>
          <v-slider class="px-3 mt-5"
                    v-model="instance_nr" label="instance nr" min="1" max="1000" step="1" value="26"
                    thumb-label="always" @update:modelValue="instance_selected"></v-slider>
          <v-data-table :items="Object.entries(dataStore.instance)"
                        density="compact" hide-default-header
                        :headers="[{'title': 'Feature', 'value': '0'}, {'title': 'Value', 'value': '1'}]"
          ></v-data-table>
        </div>
      </div>
      <div class="d-flex flex-column align-center justify-center">
        <div v-if="dataStore.target_feature !== ''" class="mt-1 w-50">
          <v-autocomplete v-model="dataStore.interacting_features" class="px-5" label="Select interacting features"
                          :items="dataStore.non_target_features"
                          multiple
                          @update:modelValue="interacting_features_selected"/>
        </div>
        <div v-if="dataStore.interacting_features.length !== 0" class="mt-1">
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
