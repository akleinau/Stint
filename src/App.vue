<script setup lang="ts">
import DataInput from './components/data-input.vue'
import VisStory from './components/vis_story.vue'
</script>

<template>
  <div class="d-flex align-center justify-center">
    <h1>STINT - Stories about Interactions</h1>
  </div>
  <DataInput />
  <VisStory />
</template>

<style scoped>
h1 {
  color: #0097f3;
}
</style>
