const express = require('express');
const app = express()
const cors = require('cors');
const customErrorGenerator = require('./utils/custmErrorGenerator');
const port = 5000;

app.use(express.json());
app.use(cors());

const msgsArray = [];
const subscribers = {};

const sendPendingRequests = (items) => {
  Object.entries(subscribers).forEach(([ID, session]) => {
    session.res.json(items);
    delete subscribers[ID];
  });
}

const calcLastEditTime = () => {
  let lastEditTime = 0;
  msgsArray.forEach(item => {lastEditTime = Math.max(lastEditTime, item.timeStamp)});
  return lastEditTime;
}


app.post('/msg-short-term', (req, res, next) => {
  try {
    const {body} = req;
    const {msg} = body;
    const msgTimeStamp = Date.now();
    if(!msg){
      throw customErrorGenerator(401, 'INVALID_REQUEST_BODY', 'Message must exist in request body');
    }
    msgsArray.push({msg, timeStamp: msgTimeStamp});
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/msg-short-term', (req, res, next) => {
  try {
    if(req.query.lastMsgTimeStamp){
      //Recieved a timeStamp
      const clientLastMsgTimeStamp = parseInt(req.query.lastMsgTimeStamp);
      return res.json(msgsArray.filter(item => item.timeStamp > clientLastMsgTimeStamp))
    }else{
      //No timeStamp recieved from the client
      return res.json(msgsArray);
    }
  } catch (error) {
    next(error);
  }
});





app.get('/msg-long-term', (req, res, next) => {
  try {
    if(!req.query.lastMsgTimeStamp){
      //Client didn't send a timeStamp
      return res.json(msgsArray);
    }
    
    const clientLastMsgTimeStamp = parseInt(req.query.lastMsgTimeStamp);
    const lastEditTimeStamp = calcLastEditTime();

    if(clientLastMsgTimeStamp < lastEditTimeStamp){
      console.log('Sending the rest');
      return res.json(msgsArray.filter(item => item.timeStamp > clientLastMsgTimeStamp));
    }
    else{
      console.log('Listening');
      const ID = Math.floor(Math.random() * 10000);
      subscribers[ID] = {req, res};
    }
  } catch (error) {
    next(error);
  }
})




app.post('/msg-long-term', (req, res, next) => {
  try {
    const {msg} = req.body;
    const msgTimeStamp = Date.now();
    if(!msg){
      throw customErrorGenerator(401, 'INVALID_REQUEST_BODY', 'Message must exist in request body');
    }
    msgsArray.push({msg, timeStamp: msgTimeStamp});

    sendPendingRequests([{msg, timeStamp: msgTimeStamp}]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
})

app.use((error, req, res, next) => {
  //Error Handling Middleware
  if(!error.status){
    //Internal Server Error
    console.log(error);
    error.message = 'Something Went Wrong';
    error.status = 500;
  }
  res.status(error.status).send({success: false, message: error.message});
})



app.listen(port, () => {
  console.log(`App is running at http://localhost:${port}`)
})