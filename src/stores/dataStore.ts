import {defineStore} from 'pinia'
import * as d3 from 'd3'
import {useFeatureStore} from './feature_store'

export interface CorrelationMap {
    [key: string]: number // feature name -> correlation value
}

export const useDataStore = defineStore({
    id: 'data',
    state: () => ({
        data: [] as { [key: string]: number }[],
        feature_names: [] as string[],
        target_feature: "" as string,
        data_summary: {} as { min: number, max: number, mean: number, std: number, range:number},
        non_target_features: [] as string[],
        interacting_features: [] as string[],
        shown_features: [] as string[],
        instance: {} as { [key: string]: number },
        storyIsVisible: false,
        correlations: {} as { [key: string]: CorrelationMap}, // feature name -> CorrelationMap
        feature_abnormality: {} as { [key: string]: number } // feature name -> abnormality value
    }),
    actions: {

        reset() {
            this.data = []
            this.feature_names = []
            this.target_feature = ""
            this.data_summary = {min: 0, max: 0, mean: 0, std: 0, range: 0}
            this.non_target_features = []
            this.interacting_features = []
            this.instance = {}
        },

        calculate_correlations() {
            this.correlations = {}
            for (let feature of this.interacting_features) {
                this.correlations[feature] = {}
                for (let other_feature of this.interacting_features) {
                    if (feature === other_feature) {
                        continue
                    }
                    this.correlations[feature][other_feature] = this.calculate_correlation(feature, other_feature)
                }
            }
        },

        calculate_correlation(feature1: string, feature2: string): number {
            const values1 = this.data.map((d) => d[feature1])
            const values2 = this.data.map((d) => d[feature2])
            const mean1 = values1.reduce((acc, v) => acc + v, 0) / values1.length
            const mean2 = values2.reduce((acc, v) => acc + v, 0) / values2.length
            const numerator = values1.reduce((acc, v1, i) => acc + (v1 - mean1) * (values2[i] - mean2), 0)
            const denominator1 = Math.sqrt(values1.reduce((acc, v) => acc + (v - mean1) ** 2, 0))
            const denominator2 = Math.sqrt(values2.reduce((acc, v) => acc + (v - mean2) ** 2, 0))
            return numerator / (denominator1 * denominator2)
        },

        calculate_abnormality() {
            const featureStore = useFeatureStore()
            this.feature_abnormality = {}
            for (let feature of this.shown_features) {
                  const bins = featureStore.get_feature_bins(feature)
                  const max_count = d3.max(bins.map(d => d.count))
                  //const full_count = d3.sum(bins.map(d => d.count))
                  const instance_bin_index = featureStore.get_instance_bin_index(feature, this.instance[feature])
                  const instance_bin_count = bins[instance_bin_index].count

                  this.feature_abnormality[feature] = instance_bin_count / max_count
            }
        }
    },
})
