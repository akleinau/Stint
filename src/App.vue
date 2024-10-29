<script setup lang="ts">
import DataInput from './components/data-input.vue'
import VisStory from './components/vis_story.vue'
import OpenEnded from './components/open-ended.vue'
</script>

<template>
  <div id="app">
    <v-card class="w-50 mt-5 h-100" style="margin:auto">
      <v-card-item>
        <v-card-title class="d-flex flex-column align-center">
          <h1 class="mt-5">STINT - Stories about Interactions</h1>
        </v-card-title>
      </v-card-item>
      <v-card-text>

        <DataInput/>
        <VisStory/>
      </v-card-text>

      <v-card-actions class="d-flex flex-column align-center pt-5" id="actions">
          <OpenEnded/>
      </v-card-actions>

    </v-card>
  </div>
</template>

<style>
h1 {
  color: #0097f3;
}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #384f54;
}

#actions{

}

</style>
