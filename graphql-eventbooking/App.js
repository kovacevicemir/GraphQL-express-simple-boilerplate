// Imports
const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const Event = require("./models/event");
require("dotenv").config();

// App.js
const app = express();
app.use(express.json());

//Link everything together: request,queries,schemas etc.
app.use(
  "/graphql",
  graphqlHTTP({
    //graphql schema
    // RootQuery-> endpoints same as RootMutation
    schema: buildSchema(`
            type Event {
                _id:String!,
                title: String!,
                description: String!,
                price: Float!,
                date: String!
            }

            input EventInput{
                title: String!
                description: String!
                price: Float!
                date: String!
            }

            type RootQuery{
                events: [Event!]!
            }

            type RootMutation{
                createEvent(eventInput: EventInput): Event
            }

            schema {
                query:RootQuery
                mutation:RootMutation
            }
        `),

    // all resolver functions
    rootValue: {
      events: async () => {
        const events = await Event.find();
        return events
      },
      createEvent: async (args) => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
        });

        //save to database
        try {
            const result = await event.save();
            console.log(result);
            return { ...result._doc };
        } catch (err) {
            console.log(err);
            throw err;
        }
      },
    },
    // visual UI
    graphiql: true,
  })
);

//db connection
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
    });
    const PORT = process.env.PORT || 3000
    app.listen(PORT, console.log(`server is running on: ${PORT}`))

  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();
