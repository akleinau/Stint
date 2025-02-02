<script setup lang="ts">
import {ref, onMounted} from 'vue'
import * as d3 from "d3";

import {useDataStore} from "../stores/dataStore.ts";
import {useFeatureStore} from "../stores/feature_store.ts";
import constants from "../stores/constants.ts";

const dataStore = useDataStore()
const lbl = dataStore.get_label
const featureStore = useFeatureStore()

const files = ref(null)
const catalogue_files = ref(null)
const instance_nr = ref(26)
const isCustomInstance = ref(true)
const isCustomDataset = ref(false)

const make_numeric = (data: any) => {

  // delete all columns with too many non-numeric values
  let delete_cols = [] as string[]
  data.columns.forEach((col: string) => {
    let uniques = Array.from(new Set(data.map((d: any) => d[col])))
    let non_numeric_uniques = uniques.filter((u: any) => isNaN(u))
    let non_numeric_uniques_cleaned = non_numeric_uniques.filter((u: any) => u !== "" && u !== "NA" && u != "NaN")

    // features that are not useful
    if (non_numeric_uniques_cleaned.length > constants.max_discrete_bins) {
      console.log("Deleting column", col, "because it contains too many non-numeric values")
      delete_cols.push(col)
    }

    // categorical features
    else if (non_numeric_uniques_cleaned.length > 0) {
      // add original labels to the feature catalogue
      if (dataStore.feature_catalogue[col] == undefined) {
        dataStore.feature_catalogue[col] = {name: col, classes: []}
      }
      let feature_calatogue = dataStore.feature_catalogue[col]
      feature_calatogue.classes = non_numeric_uniques_cleaned.map((e, i) => { return {value: i, label: e}})

      // and replace the values with the indices
      data.forEach((d: any) => {
        const d_class = feature_calatogue.classes.find((c: any) => c.label == d[col])
        d[col] = d_class !== undefined ? d_class.value : null
      })

      console.log("Converting ", col, "to categorical")
    }
  })
  delete_cols.forEach((col: string) => {
    data.columns = data.columns.filter((c: string) => c !== col)
    data.forEach((d: any) => {
      delete d[col]
    })
  })


  // convert all columns to numeric
  data.forEach((d: any) => {
    for (let key in d) {
        let value = d[key]
        if (isNaN(value || value === "")) {
          d[key] = null
        } else {
          d[key] = +value
        }
    }
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
  catalogue.features.forEach((f: any) => {
    let current_feature = dataStore.feature_catalogue[f.name]
    if (current_feature == undefined) {
      dataStore.feature_catalogue[f.name] = f
    } else {
      let old_classes = current_feature.classes
      dataStore.feature_catalogue[f.name] = f

      let new_classes = f.classes
      if (new_classes == undefined) {
        dataStore.feature_catalogue[f.name].classes = old_classes
      }
      else if (old_classes != undefined) {
        // mesh the two class objects to one with the old_value, value and label
        new_classes.forEach((new_class: any) => {
          let old_class = old_classes.find((c: any) => c.label == new_class.value)
          if (old_class != undefined) {
            new_class.old_value = old_class.value
            new_class.value = new_classes.indexOf(new_class)
            if (new_class.label == undefined) {
              new_class.label = old_class.label
            }
          }
        })
        // for all remaining classes that are not in the catalogue.json, add them
        let next_value = new_classes.length
        old_classes.forEach((old_class: any) => {
          let new_class = new_classes.find((c: any) => c.value == old_class.label)
          if (new_class == undefined) {
            new_classes.push({value: next_value, label: old_class.label, old_value: old_class.value})
            next_value += 1
          }
        })

        // now go through the data and replace the old values with the new values
        dataStore.data.forEach((d: any) => {
          d[f.name] = new_classes.find((c: any) => c.old_value == d[f.name]).value
        })

      }


    }
  })

  // select target specified in catalogue
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
  dataStore.set_target_decimals()
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
            <v-autocomplete v-model="dataStore.target_feature" class="px-5" label="Select the column containing your prediction/ ground truth"
                            :items="get_feature_select_list()"
                            item-value="value" item-title="title"
                            variant="underlined"
                            @update:modelValue="target_selected"/>
          </div>
        </div>
      </div>
      <div v-else class="mx-3 align-center justify-center story_text">
        <div class="d-flex flex-column align-center justify-center" style="text-align:center">
          Example data set: Bike rentals
          <br>
          This data set is used to predict the number of bike rentals per hour.
          <br>
          <a href="https://archive.ics.uci.edu/ml/datasets/Bike+Sharing+Dataset" target="_blank">
            Click here for more information.
          </a>
        </div>

      </div>

      <!-- Instance -->
      <div class="d-flex flex-column align-center justify-center mt-2" v-if="dataStore.target_feature !== ''">

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

            <!-- clear button -->
            <v-btn @click="dataStore.interacting_features = dataStore.interacting_features.filter(a => a != key) "
                   icon size="2" class="mb-2 text-grey">
              <v-icon>mdi-close</v-icon>
            </v-btn>


          </div>

      </div>

      <!-- Interacting features -->
      <div class="d-flex flex-column align-center justify-center w-100 mt-3">
        <div v-if="dataStore.target_feature !== ''" class="mt-1 w-100">
          <v-autocomplete v-model="dataStore.interacting_features" class="px-5"
                          label="Select the attributes you are interested in"
                          :items="dataStore.non_target_features"
                          multiple
                          @update:modelValue="interacting_features_selected"/>
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
