import {type ClientSchema, a, defineData} from "@aws-amplify/backend";
import {sayHello} from "../functions/say-hello/resource";

const schema = a.schema({
    Todo: a
        .model({
            content: a.string(),
            isDone: a.boolean().default(false),
            tags: a.hasMany('TodoTag', 'todoId'),
            owner: a.string(),
        })
        .authorization(allow => [allow.owner()])
    ,
    Tag: a
        .model({
            name: a.string(),
            todos: a.hasMany('TodoTag', 'tagId')
        })
    ,
    TodoTag: a
        .model({
            todoId: a.id().required(),
            tagId: a.id().required(),
            todo: a.belongsTo('Todo', 'todoId'),
            tag: a.belongsTo('Tag', 'tagId'),
        })
    ,
    sayHello: a
        .query()
        .arguments({
            name: a.string(),
        })
        .returns(a.string())
        .handler(a.handler.function(sayHello))
    ,
}).authorization((allow) => [allow.publicApiKey()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: "apiKey",
        // API Key is used for a.allow.public() rules
        apiKeyAuthorizationMode: {
            expiresInDays: 30,
        },
    },
});