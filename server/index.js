const express = require('express')
const app = express()

var admin = require("firebase-admin");
var serviceAccount = require("./face-call-connect-firebase-adminsdk-kmv8u-33ec6c24df.json");

const port = 3000

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://face-call-connect-default-rtdb.firebaseio.com"
});

app.use(express.json())

app.post('/send-notification', ( req, res ) => {
  console.log(req.body);
  // const notification = {
  //   notification: {
  //     title: 'New Message!',
  //     body: `Mujtaba sent you a message.`,
  //   },
  //   token:
  //     'fy7PwHgTQOG1tCjtJGQXWS:APA91bFqkKET9ViZtFN3j-l2_gLYkvG5_-nBgm2DZXLkBuzW6O_ew3CCS4EKOqzD5cVFiQIjZNq8OtNcRBAx95CbUZ_dblNCozYNv8AWwFLo2qddI9CQ-M8-ItCUoszs8wnNffGhTlsr',
  //   data: {
  //     profilePicture:
  //       'https://lh3.googleusercontent.com/a/ACg8ocK-ZokpqAHj_ejJL8HbbrTY_e4NOzrEaQ-5WH31Tr5wAPw=s96-c',
  //     username: 'King',
  //     message: 'test message',
  //     timeSent: new Date().toISOString(),
  //   },
  // };

  // admin
  //   .messaging()
  //   .send(notification)
  //   .then(res => {
  //     console.log(res);
  //   })
  //   .catch(err => {
  //     console.log(err);
  //   });
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})