import {defineStore} from 'pinia'
import {Feature} from './influence_store.ts'
import {bin_continuous, bin_discrete, useFeatureStore} from "./feature_store.ts";
import {useDataStore} from "./dataStore.ts";

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
                    vis_bins.push({"x": bin.min, "prediction": bin.prediction_mean})
                }
            }
            else {
                // interprete bins as type bin_discrete
                for (let bin of bins as bin_discrete[]) {
                    vis_bins.push({"x": bin.value, "prediction": bin.prediction_mean})
                }
            }

            vis_bins.sort((a, b) => +a.x - +b.x)

            return vis_bins
        },

        get_current_set_vis_bins() {
            let set_ids = this.selected_feature.get_previous_group()
            if (set_ids === null) return []
            set_ids = set_ids.get_ids()

            let featureStore = useFeatureStore()
            let dataStore = useDataStore()
            let bins = featureStore.get_feature_bins(this.selected_feature.get_feature_names())
            let type = featureStore.get_feature_type(this.selected_feature.get_feature_names())

            // duplicate bins and set count, prediction_sum, prediction_mean to 0
            let vis_bins = JSON.parse(JSON.stringify(bins))
            for (let bin of vis_bins) {
                bin.count = 0
                bin.prediction_sum = 0
                bin.prediction_mean = 0
            }

            // get new counts and prediction_sums
            for (let id of set_ids) {
                let instance = dataStore.data[id]
                let feature_value = instance[this.selected_feature.get_feature_names()]
                let target_value = instance[dataStore.target_feature]
                let bin_index = featureStore.get_instance_bin_index(this.selected_feature.get_feature_names(), feature_value)
                vis_bins[bin_index].count += 1
                vis_bins[bin_index].prediction_sum += target_value
            }

            // calculate new prediction_means
            for (let bin of vis_bins) {
                if (bin.count > 0) {
                    bin.prediction_mean = bin.prediction_sum / bin.count
                }

            }

            // change format to be compatible with vis
            let vis_bins_formatted = []
            if (type == "continuous") {
                for (let bin of vis_bins) {
                    vis_bins_formatted.push({"x": bin.min, "prediction": bin.prediction_mean})
                }
            }
            else {
                for (let bin of vis_bins) {
                    vis_bins_formatted.push({"x": bin.value, "prediction": bin.prediction_mean})
                }
            }

            // sort by x
            vis_bins_formatted.sort((a, b) => +a.x - +b.x)

            return vis_bins_formatted

        }


    }
})