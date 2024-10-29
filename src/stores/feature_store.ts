import {defineStore} from "pinia";

export interface bin {
    min: number,
    max: number,
    count: number,
}

export const useFeatureStore = defineStore({
    id: 'feature',
    state: () => ({
        feature_names: [] as string[],
        feature_bins: {} as { [key: string]: bin[] },
    }),
    actions: {

        set_features(data: any) {
            this.feature_names = data.columns
            this.calculate_feature_bins(data)
        },

        calculate_feature_bins(data: { [key: string]: number }[]) {
            this.feature_bins = {}
            for (let feature of this.feature_names) {
                const values = data.map((d) => d[feature])
                const unique_values = Array.from(new Set(values))
                const bin_number = unique_values.length < 10 ? unique_values.length : 10
                const min = Math.min(...values)
                const max = Math.max(...values)
                const bin_size = (max - min) / bin_number
                const bins = Array.from({length: bin_number+1}, (_, i) => {
                    return {
                        min: min + i * bin_size,
                        max: min + (i + 1) * bin_size,
                        count: 0
                    }
                })
                for (let value of values) {
                    const bin_index = Math.floor((value - min) / bin_size)
                    bins[bin_index].count += 1
                }
                this.feature_bins[feature] = bins
            }
        },

        get_feature_bins(feature: string): bin[] {
            return this.feature_bins[feature]
        },

    }
});