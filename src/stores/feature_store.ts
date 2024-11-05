import {defineStore} from "pinia";

export interface bin {
    count: number,
}

export interface bin_continuous extends bin {
    min: number,
    max: number,
}

export interface bin_discrete extends bin {
    value: number,
}

const max_discrete_bins = 24

const make_binsize_pretty = (size: number) : number => {
    // round up n to nearest multiple of five
    let pretty_stepsize_10 = Math.pow(10, Math.floor(Math.log10(size)))
    let float5 = 5 * pretty_stepsize_10
    let pretty_stepsize = Math.round(size / float5) * float5
    if (pretty_stepsize === 0) pretty_stepsize = float5/5

    return pretty_stepsize

}

export const useFeatureStore = defineStore({
    id: 'feature',
    state: () => ({
        feature_names: [] as string[],
        feature_bins: {} as { [key: string]: bin[] },
        feature_types: {} as { [key: string]: string },
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
                const unique_values = Array.from(new Set(values)).sort()

                //continuous
                if (unique_values.length > max_discrete_bins) {
                    this.feature_types[feature] = "continuous"
                    let bin_number = 20
                    let min = Math.min(...values)
                    let max = Math.max(...values)
                    const bin_size = make_binsize_pretty((max - min) / bin_number)
                    min = Math.floor(min / bin_size) * bin_size
                    max = Math.ceil(max / bin_size) * bin_size
                    bin_number = Math.round((max - min) / bin_size)
                    const logStep = Math.max(0, -Math.floor(Math.log10(bin_size)))

                    const bins = Array.from({length: bin_number}, (_, i) => {
                        const i_min = (min + i * bin_size)
                        let i_max = i_min + bin_size
                        if (i === bin_number - 1) {
                            i_max = i_max + bin_size //makes sure the max value is included in the last bin
                        }
                        return {
                            min: i_min.toFixed(logStep),
                            max: i_max.toFixed(logStep),
                            count: 0
                        }
                    })
                    for (let value of values) {
                        let bin_index = Math.floor((value - min) / bin_size)
                        if (bin_index === bin_number) {
                            bin_index = bin_number - 1
                        }
                        bins[bin_index].count += 1
                    }

                    this.feature_bins[feature] = bins
                }

                //categorical/ discrete
                else {
                    this.feature_types[feature] = "discrete"
                    const bins = unique_values.map((value) => {
                        return {
                            value: value,
                            count: 0
                        }
                    })

                    for (let value of values) {
                        const bin_index = bins.findIndex((bin) => bin.value === value)
                        bins[bin_index].count += 1
                    }

                    this.feature_bins[feature] = bins
                }


            }
        },

        get_feature_bins(feature: string): bin[] {
            return this.feature_bins[feature]
        },

        get_instance_bin_index(feature: string, value: number): number {
            if (this.feature_types[feature] === "continuous") {
                const bins = this.feature_bins[feature] as bin_continuous[]
                return bins.findIndex((bin) => bin.min <= value && bin.max > value)
            } else {
                const bins = this.feature_bins[feature] as bin_discrete[]
                return bins.findIndex((bin) => bin.value === value)
            }
        },

    }
});