/* src/schema.js */

const { buildSchema } = require("graphql");

const schema = buildSchema(`
    type Query {
        users: [User!]!,
        user(id: Int!): User!
    }

    type User {
        id: ID!
        name: String!
        email: String
        posts: [Post!]
    }

    type Post {
        id: ID!
        title: String!
        published: Boolean!
        link: String
        author: User!
    }
`);

module.exports = schema;
