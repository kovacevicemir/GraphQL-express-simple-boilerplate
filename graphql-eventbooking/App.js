// Imports
const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const Event = require("./models/event");
const User = require("./models/user");
const bcrypt = require("bcryptjs");
const user = require("./models/user");
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

        type User{
          _id:ID!
          email:String!
          password:String
        }

        input EventInput{
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput{
          email:String!
          password:String!
        }
        

        type RootQuery{
            events: [Event!]!
        }

        type RootMutation{
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query:RootQuery
            mutation:RootMutation
        }
    `),

    // all resolver functions
    rootValue: {

      //@GET ALL EVENTS
      events: async () => {
        const events = await Event.find();
        return events
      },

      //@CREATE EVENT
      createEvent: async (args) => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
          creator: "5f54dba248a7613174094f9d"
        });

        //save to database & add event ref to user
        try {
            const result = await event.save();

            //add event ref to user (relationship)
            const user = await User.findById("5f54dba248a7613174094f9d");
            if(!user){
              throw new Error("Cant find user wit this id @CREATE EVENT")
            }

            user.createdEvents.push(event._id);
            await user.save();

            return { ...result._doc };
        } catch (err) {
            console.log(err);
            throw err;
        }
      },

      //@CREATE USER
      createUser: async (args) =>{
        try {
          //use bcrypt for password
          const pw = await bcrypt.hash(args.userInput.password,12)

          //create user
          const user = new User({
            email: args.userInput.email,
            password: pw
          })

          //check if there is user in db
          const existingUser = await User.findOne({email: user.email});
          if(!existingUser){
            //save user to db
            const result = await user.save();
            return {...user._doc, password:null};
          }else{
            console.log('user already exists!')
            throw new Error("User exists already.");
          }

        } catch (err) {
          console.log(err)
          throw err;
        }
      }

    },
    // visual UI
    graphiql: true,
  })
);

//db connection & server listen
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
