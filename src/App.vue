<script setup lang="ts">
import DataInput from './components/data-input.vue'
import VisStory from './components/vis_story.vue'
import OpenEnded from './components/open-ended.vue'
import DataOverview from './components/data_overview.vue'
import {useDataStore} from "./stores/dataStore.ts";
import {useInfluenceStore} from "./stores/influence_store.ts";
import {useDetailStore} from "./stores/detail_store.ts";
import DetailView from "./components/detail-view.vue";
import DetailedFeatureView from "./components/detailed_feature_view.vue";

const dataStore = useDataStore()
const influenceStore = useInfluenceStore()
const detailStore = useDetailStore()

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const nice_scroll = async (y_destination: number) => {
  let y = window.scrollY

  if (y > y_destination) {
    return
  }

  let step = 3
  let steps = Math.abs(y_destination - y) / step
  let direction = y_destination > y ? 1 : -1
  for (let i = 0; i < steps; i++) {
    await sleep(5)
    window.scrollTo(0, y + direction * step)
    y = window.scrollY
  }
}

const explain = async () => {

  influenceStore.calculate_influences()

  for (let i = 0; i < 1; i++) {
    await sleep(50)
    //scroll so that explainButton is on top of screen
    await nice_scroll(document.getElementById("explainButton").getBoundingClientRect().top)
  }

}

</script>

<template>
  <div id="app">
    <v-card class="mt-5 h-100 mb-2">
      <v-card-item>
        <v-card-title class="d-flex flex-column align-center mb-0">
          <div class="d-flex flex-column align-center justify-end">
            <h1 class="mt-5">STINT - Stories about Interactions</h1>

          </div>
        </v-card-title>

        <div class="d-flex flex-column align-center story_text px-10 mt-0" style="text-align:center">
          <i>

            STINT shows you interactions in your data set relevant for predictions, <br>
            <span
                style="color:#6a6c75"> eg. the interplay of hour and weekday when predicting bike rentals. </span>
            <br>
            Use it before model training to understand your data or after training to understand your models'
            predictions.
          </i>

          <img src="../public/stint1.png" alt="STINT" style="height: 40px" class="ma-4"/>
        </div>
      </v-card-item>
      <v-card-text>


        <DataInput/>

      </v-card-text>
    </v-card>

    <div v-if="dataStore.interacting_features.length !== 0"
         class="mt-1 mb-3 d-flex flex-column align-center pt-4 pb-4">
      <v-btn @click="explain" class="bg-blue" id="explainButton">Explain</v-btn>
    </div>

    <v-card class="h-100 mb-5" v-show="dataStore.storyIsVisible">
      <v-card-text>

        <DataOverview/>

      </v-card-text>

    </v-card>

    <v-card class="h-100 mb-5 detailCard" v-show="dataStore.storyIsVisible && dataStore.selected_feature != null">

      <v-card-text class="d-flex flex-column align-center">

        <DetailedFeatureView :feature="dataStore.selected_feature" :show_abnormal="false"/>

      </v-card-text>

      <v-card-actions class="bg-grey-lighten-2 justify-center">
        <v-btn class="w-100" @click="dataStore.selected_feature = null" variant="text" prepend-icon="mdi-close">close
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card class="h-100 mb-5" v-show="dataStore.storyIsVisible" id="storyCard">

      <v-card-text>

        <VisStory/>

      </v-card-text>
    </v-card>

    <v-card class="h-100 detailCard" v-if="dataStore.storyIsVisible && detailStore.selected_feature !== null">


      <v-card-text>

        <DetailView/>

      </v-card-text>

      <v-card-actions class="bg-grey-lighten-2 justify-center">
        <v-btn class="w-100" @click="detailStore.selected_feature = null" variant="text" prepend-icon="mdi-close">
          close
        </v-btn>
      </v-card-actions>

    </v-card>

    <div v-if="dataStore.interacting_features.length !== 0"
         class="mt-1 mb-3 d-flex flex-column align-center pt-4 pb-4">
      <OpenEnded/>
    </div>

    <div style="height:50px"></div>

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
  font-size: 16px;
}

.v-card {
  margin: auto !important;
  width: 900px !important;
  font-size: 16px;
}

.story_text {
  font-size: 16px;
}

.highlight {
  background: #f0f0f0;
  padding: 2px

}


h3 {
  font-size: 18px
}

</style>
