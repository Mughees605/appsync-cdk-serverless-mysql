type Post = {
    id: string;
    title: string;
    content: string;
}

type dbConfig = {
    host: string;
    port: number;
    username: string;
    password: string;
    engine: string;
    database: string;
    dbClusterIdentifier: string;
}

type AppSyncEvent = {
    info: {
        fieldName: string
    },
    field: string,
    arguments: {
        post: Post
    }
}

export {
    Post,
    AppSyncEvent,
    dbConfig
}