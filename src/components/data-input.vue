<script setup lang="ts">
import { ref } from 'vue'
import * as d3 from "d3";

const files = ref(null)

const column_names = ref([] as string[])
const target_column = ref("")

const uploaded = (files: any) => {
  const csvFile = files;
  let name = csvFile.name.replace('.csv', '')
  const reader = new FileReader();
  reader.onload = (event: any) => {
    const data = d3.csvParse(event.target.result)
    column_names.value = data.columns
    let row_number = data.length
    console.log(name)
    console.log(column_names)
    console.log(row_number)
  }
  reader.readAsText(csvFile)
}

const target_selected = (col: string) => {
  target_column.value = col
  console.log("target column selected: " + target_column)
}

</script>

<template>
  <div class="w-100 mx-3 align-center justify-center">
    <div class="mt-3 w-50">
        <v-file-input label="Choose CSV file" class="px-5" v-model="files"
                      accept=".csv"
                      @update:modelValue="uploaded"></v-file-input>
    </div>
    <div v-if="column_names.length !== 0" class="mt-3 w-50" >
            <v-autocomplete v-model="target_column" class="px-5" label="Select outcome column"
                            :items="column_names"
                            @update:modelValue="target_selected"/>
    </div>
</div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
