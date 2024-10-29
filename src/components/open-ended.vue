<script setup lang="ts">
import {useDataStore} from "../stores/dataStore.ts";

const dataStore = useDataStore()
</script>


<template>
  <div class="d-flex mb-5" v-if="dataStore.storyIsVisible">
    <v-btn class="mx-4 bg-light-blue-accent-1" > What if I add another feature?</v-btn>
    <v-btn class="mx-4 bg-light-blue-accent-1"> What if I remove a feature?</v-btn>
    <v-btn class="mx-4 bg-light-blue-accent-1"> Can I trust this?</v-btn>
  </div>
</template>

<style scoped>

</style>