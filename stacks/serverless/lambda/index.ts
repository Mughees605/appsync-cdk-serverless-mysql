import createPost from './createPost';
import { AppSyncEvent } from "./types/"

exports.handler = async (event: AppSyncEvent) => {
    console.log(event)
    switch (event.field) {
        case 'createPost':
            return await createPost(event.arguments.post);
        default:
            return null;
    }
}