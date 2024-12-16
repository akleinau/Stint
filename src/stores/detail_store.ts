import {defineStore} from 'pinia'
import {Feature} from './influence_store.ts'
import {bin_continuous, bin_discrete, useFeatureStore} from "./feature_store.ts";

export const useDetailStore = defineStore({
    id: 'detail',
    state: () => ({
        selected_feature: null as Feature | null,

    }),
    actions: {
        get_vis_bins() {
            if (this.selected_feature === null) return []

            let featureStore = useFeatureStore()
            let bins = featureStore.get_feature_bins(this.selected_feature.get_feature_names())
            let type = featureStore.get_feature_type(this.selected_feature.get_feature_names())
            let vis_bins = []


            if (type == "continuous") {
                // interprete bins as type bin_continuous
                for (let bin of bins as bin_continuous[]) {
                    vis_bins.push({"x": [bin.max-bin.min], "prediction": bin.prediction_mean})
                }
            }
            else {
                // interprete bins as type bin_discrete
                for (let bin of bins as bin_discrete[]) {
                    vis_bins.push({"x": [bin.value], "prediction": bin.prediction_mean})
                }
            }

            return vis_bins
        }


    }
})