<script setup lang="ts">
import {ref, onMounted} from 'vue'
import * as d3 from "d3";

import {useDataStore} from "../stores/dataStore.ts";
import {useFeatureStore} from "../stores/feature_store.ts";

const dataStore = useDataStore()
const lbl = dataStore.get_label
const featureStore = useFeatureStore()

const files = ref(null)
const catalogue_files = ref(null)
const instance_nr = ref(26)
const isCustomInstance = ref(true)
const isCustomDataset = ref(false)

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

onMounted(async () => {
  await load_example_dataset()
})

const load_example_dataset = async () => {
  const csvFile = "https://raw.githubusercontent.com/akleinau/Stint/cbd10b108068e982c460e961b9cc071b4f1199be/datasets/bike.csv";
  const data = await d3.csv(csvFile, {crossOrigin: "anonymous"})
  set_data(data)

  const catalogueFile = "https://raw.githubusercontent.com/akleinau/Stint/refs/heads/main/datasets/bike_catalogue.json"
  const catalogue = await d3.json(catalogueFile)
  set_catalogue(catalogue)

  target_selected("cnt")
}

const uploaded = (files: any) => {
  dataStore.reset()
  const csvFile = files;
  const reader = new FileReader();
  reader.onload = (event: any) => {
    let data = d3.csvParse(event.target.result)
    set_data(data)
  }
  reader.readAsText(csvFile)
}

const catalogue_uploaded = (files: any) => {
  const jsonFile = files;
  const reader = new FileReader();
  reader.onload = (event: any) => {
    let catalogue = JSON.parse(event.target.result)
    set_catalogue(catalogue)
  }
  reader.readAsText(jsonFile)
}

const set_data = (data: any) => {
  data = make_numeric(data)
  data = add_id(data)
  dataStore.feature_names = data.columns
  dataStore.data = data
}

const set_catalogue = (catalogue: any) => {

  // reformat catalogue to be a map of feature names to feature objects
  let features = {} as any
  catalogue.features.forEach((f: any) => {
    features[f.name] = f
  })

  dataStore.feature_catalogue = features
  if (catalogue.target) {
    target_selected(catalogue.target)
  }
}

const target_selected = (col: string) => {
  dataStore.target_feature = col
  dataStore.instance = JSON.parse(JSON.stringify(dataStore.data[instance_nr.value])) //makes sure there is always an instance selected
  dataStore.non_target_features = dataStore.feature_names.filter((f: string) => f !== col)
  let summary = {} as any
  summary.mean = dataStore.data.map((d: any) => d[col]).reduce((a: number, b: number) => a + b) / dataStore.data.length
  summary.min = Math.min(...dataStore.data.map((d: any) => d[col]))
  summary.max = Math.max(...dataStore.data.map((d: any) => d[col]))
  summary.std = d3.deviation(dataStore.data.map((d: any) => d[col]))
  summary.range = summary.max - summary.min
  dataStore.data_summary = summary
  //interacting_features_selected(dataStore.non_target_features)

  featureStore.set_features()

}

const instance_selected = (_:any) => {
  dataStore.instance = JSON.parse(JSON.stringify(dataStore.data[instance_nr.value]))
}

const dataset_toggled = (_:any) => {
  if (isCustomDataset.value) {
    dataStore.reset()
    files.value = null
    catalogue_files.value = null
  }
  else {
    load_example_dataset()
  }
}

const interacting_features_selected = (cols: string[]) => {
  dataStore.interacting_features = cols
  dataStore.calculate_correlations()
  dataStore.storyIsVisible = false
}

const get_discrete_select_list = (key: string) => {
  let bins = featureStore.get_feature_bins(key)
  let bin_values = bins.map((d: any) => d.value)

  // check if bin_values are numerical and sort them accordingly
  if (bin_values.every((v: any) => typeof v === 'number')) {
    bin_values = bin_values.sort((a: any, b: any) => a - b)
  }

  let bin_labels = bin_values.map((v: any) => lbl(key, v))
  return bin_values.map((v: any, i: number) => {
    return {value: v, title: bin_labels[i]}
  })
}

const get_feature_select_list = () => {
  return dataStore.feature_names.map((f: string) => {
    return {value: f, title: lbl(f)}
  })
}

</script>

<template>
  <div class="w-100">
    <div class="mx-3 align-center justify-center d-flex flex-column">

      <!-- data input -->
      <v-btn-toggle v-model="isCustomDataset" class="mb-1" @update:model-value="dataset_toggled">
        <v-btn :value="false">example data set</v-btn>
        <v-btn :value="true">custom data set</v-btn>
      </v-btn-toggle>
      <div v-if="isCustomDataset" class="w-100">
        <div class="d-flex flex-column align-center justify-center w-100">
          <div class="d-flex mt-3 w-100">
            <v-file-input label="Choose CSV file" v-model="files"
                          accept=".csv"
                          @update:modelValue="uploaded"></v-file-input>
            <v-file-input label="(Optional) choose Catalogue file" v-model="catalogue_files"
                          accept=".json"
                          @update:modelValue="catalogue_uploaded"></v-file-input>
          </div>
          <div v-if="dataStore.feature_names.length !== 0" class=" w-50">
            <v-autocomplete v-model="dataStore.target_feature" class="px-5" label="Select target feature"
                            :items="get_feature_select_list()"
                            item-value="value" item-title="title"
                            variant="underlined"
                            @update:modelValue="target_selected"/>
          </div>
        </div>
      </div>
      <div v-else class="mx-3 align-center justify-center">
        <div class="d-flex align-center justify-center">
          Example data set: Bike rentals
        </div>

      </div>

      <!-- Interacting features -->
      <div class="d-flex flex-column align-center justify-center w-100 mt-3">
        <div v-if="dataStore.target_feature !== ''" class="mt-1 w-100">
          <v-autocomplete v-model="dataStore.interacting_features" class="px-5" label="Select interacting features"
                          :items="dataStore.non_target_features"
                          multiple
                          @update:modelValue="interacting_features_selected"/>
        </div>
      </div>


      <!-- Instance -->
      <div class="d-flex flex-column align-center justify-center" v-if="dataStore.target_feature !== ''">

          <div v-for="key in dataStore.interacting_features" class="mt-1 w-100 d-flex flex-row align-center">

            <!-- continuous -->
            <div v-if="featureStore.get_feature_type(key) == 'continuous'" class="w-100">
            <v-text-field v-model.number="dataStore.instance[key]" class="px-5 w-100" :label="key" type="number"
                          :suffix="'(' + d3.min(dataStore.data.map(d => d[key])) + ' - ' + d3.max(dataStore.data.map(d => d[key])) + ')'"
                          variant="underlined" hide-details density="compact" single-line>
              <template v-slot:prepend-inner>
                <div class="d-flex">
                  <span> {{ key }} </span>
                  <span> : </span>
                </div>
              </template>
            </v-text-field>
            </div>

            <!-- discrete -->
            <div v-else class="w-100">
              <v-select v-model="dataStore.instance[key]" class="px-5 w-100" :label="key"
                        :items="get_discrete_select_list(key)"
                        item-value="value"
                        item-title="title"
                        variant="underlined" hide-details density="compact" single-line>
                <template v-slot:prepend-inner>
                  <div class="d-flex">
                    <span> {{ key }} </span>
                    <span> : </span>
                  </div>
                </template>
              </v-select>

            </div>


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
