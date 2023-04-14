const {OpenAIApi, Configuration} = require("openai");

const configuration = new Configuration({
  apiKey: '',
  // azure: {
  //   apiKey: '',
  //   endpoint: 'https://hfgopenaieastus.openai.azure.com/',
  //   deploymentName: 'GTPTurbo',
  // }
});
const openai = new OpenAIApi(configuration);

let chatMessages  = [[]]


function errorHandler(error, res) {
  if (error.response) {
    console.error(error.response.status, error.response.data);
    switch (error.response.status) {
      case 400:
        // Bad request - The request was unacceptable, often due to missing a required parameter.
        res.status(400).json(error.response.data);
        break;
      case 401:
        // Unauthorized - No valid API key provided.
        res.status(401).json(error.response.data);
        break;
      case 403:
        // Forbidden - The API key doesn't have permissions to perform the request.
        res.status(403).json(error.response.data);
        break;
      case 404:
        // Not found - The requested resource doesn't exist.
        res.status(404).json(error.response.data);
        break;
      case 500:
        // Internal Server Error - We had a problem with our server. Try again later.
        res.status(500).json(error.response.data);
        break;
      case 502:
        // Bad Gateway - We got an invalid response from the server upstream.
        res.status(502).json(error.response.data);
        break;
      default:
        res.status(500).json({
          error: {
            message: 'An error occurred during your request.',
          }
        });
    }
  } else {
    console.error(`Error with OpenAI API request: ${error.message}`);
    res.status(500).json({
      error: {
        message: 'An error occurred during your request.',
      }
    });
  }
}


const appRouter = function (app) {


  app.post("/complete", async function(req, res) {

    let input= req.body.prompt;

    console.log(input);

    try {
      const completion = await openai.createCompletion({
        model:"text-davinci-003",
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        prompt: input,
      });

      console.log(completion.data.choices);

      res.status(200).json(completion.data.choices);

    } catch(error) {
      errorHandler(error, res);
    }
  });

  app.post("/image", async function(req, res) {

    let input= req.body.prompt;

    console.log("generating image for: "+ input);

    try {
      const completion = await openai.createImage({
        prompt: input,
        n: 1,
        size: "1024x1024",
      });
      let image_url = completion.data.data[0].url;

      console.log(completion.data);

      res.status(200).json(image_url);

    } catch(error) {
      errorHandler(error, res);
    }
  });


  app.post("/", async function(req, res) {

    let id = req.body.text_1;

    let prompt = req.body.text;

    if(chatMessages[id]){
      chatMessages[id].push({"role": "user", "content": prompt});
    }else{
      chatMessages[id] = [{"role": "user", "content": prompt}];
    }

    try {
      const completion = await openai.createChatCompletion({
        model:"gpt-3.5-turbo",
        messages: chatMessages[id],
        temperature: 0.6,
      });


      //Log conversation
      console.log(chatMessages[id]);

      res.status(200).json({ result: completion.data.choices[0].message});

      chatMessages[id].push({"role": completion.data.choices[0].message.role, "content": completion.data.choices[0].message.content})
    } catch(error) {
      errorHandler(error, res);
    }
  });
}

module.exports = appRouter;


