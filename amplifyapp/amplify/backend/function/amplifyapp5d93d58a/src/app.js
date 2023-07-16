/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/




const express = require('express')
const bodyParser = require('body-parser')
const AWS = require('aws-sdk');
const s3Client = new AWS.S3();
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

// declare a new express app
const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});


/**********************
 * Example get method *
 **********************/

app.get('/items',async function(req, res) {
  const event = req.apiGateway.event
  const authenticatedUser = event.requestContext.authorizer.claims['cognito:username'];

  // Create an S3 client


  var Prefix= event.queryStringParameters.Prefix;
  Prefix = Prefix ? `${authenticatedUser}/${Prefix}/`: `${authenticatedUser}/`;

  try {
    // List subfolders in the specified user directory
    const response = await s3Client.listObjectsV2({
      Bucket: 'output-sales-pred',
      Prefix: Prefix,
      Delimiter: '/'
    }).promise();

    res.json({response: response});
    // Return the plot folder names as the API response
 
  } catch (error) {
    // Return an error response if any exception occurs
    res.status(500).json(error.toString());
   
  }
  
});

/****************************
* Example post method *
****************************/
app.post('/items', async function(req, res) {
  try {
    const event = req.apiGateway.event;
    const authenticatedUser = event.requestContext.authorizer.claims['cognito:username'];

    const { ObjectName } = req.body;
    const Key = `${authenticatedUser}/${ObjectName}`;

    const params = {
      Bucket: 'output-sales-pred',
      Key: Key,
    };

    const response = await s3Client.getObject(params).promise();
    const image = response.Body;

    // Set the appropriate headers for the image response
    res.set({
      'Content-Type': 'image/png', // Adjust the content type according to your image type
      'Content-Length': response.ContentLength.toString(),
    });

    res.send(image);
  } catch (error) {
    // Return an error response if any exception occurs
    res.status(500).json(error.toString());
  }
});

// app.post('/items', function(req, res) {
//   // Add your code here

//   res.json({success: 'get call succeed!', body: req.body});
// });



app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
