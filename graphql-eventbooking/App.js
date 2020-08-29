// Imports
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql')

// App.js
const app = express()
app.use(express.json())

//Link everything together: request,queries,schemas etc.
app.use('/graphql', graphqlHTTP({
        //graphql schema
        // RootQuery-> endpoints same as RootMutation
        schema: buildSchema(`
            type RootQuery{
                events: [String!]!
            }

            type RootMutation{
                createEvent(name: String): String
            }

            schema {
                query:RootQuery
                mutation:RootMutation
            }
        `),

        // all resolver functions
        rootValue: {
            events: () => {
                return ['Romantic cooking','Sailing','coding']
            },
            createEvent: (args) => {
                const eventName = args.name;
                return eventName;
            }
        },

        // visual UI
        graphiql:true
    })
)

app.listen(3000);