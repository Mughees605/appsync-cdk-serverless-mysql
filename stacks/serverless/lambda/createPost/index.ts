import * as mysql from "mysql";
import { getEnvVar } from "../util/env"
import { Post } from "./../types/"
const { v4: uuid } = require('uuid');

var connection = mysql.createPool({
  host: getEnvVar('DB_HOST'),
  user: getEnvVar('DB_USER'),
  password: getEnvVar('DB_PASSWORD'),
  port: 3306,
  database: getEnvVar('DB_NAME'),
})

async function createPost(post: Post) {
  if (!post.id) post.id = uuid();
  const { id, title, content } = post;
  try {
    const query = `INSERT INTO posts (id ,title, content) VALUES ('${id}' ,'${title}', '${content}')`;
    await new Promise((resolve, reject) => {
      connection.query(query, (err, data) => {
        if (err) {
          return reject(err)
        }
        return resolve(data)
      })
    })
    return post;
  } catch (err) {
    console.log('MYSQL error: ', err);
    return null;
  }
}

export default createPost;