export interface Config {
    redis: {
        host: string
        port: number
        db: number
    },
    mq: {
        graph_stream_name: string
        graph_group_name: string

        workflow_stream_name: string
        workflow_group_name: string

        batch_size: number
        min_idle_time: number
        trim_interval_seconds: number
    }
}