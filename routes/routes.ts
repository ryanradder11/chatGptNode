const {OpenAIApi, Configuration} = require("azure-openai");

const configuration = new Configuration({
  apiKey: '',
  azure: {
    apiKey: '',
    endpoint: 'https://hfgopenaieastus.openai.azure.com/',
    deploymentName: 'GTPTurbo',
  }
});
const openai = new OpenAIApi(configuration);

let chatMessages  = [[]]

const appRouter = function (app) {
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

      chatMessages[id].push({"role": completion.data.choices[0].message.role, "content": completion.data.choices[0].message.content})

      //Log conversation
      console.log(chatMessages[id]);

      res.status(200).json({ result: completion.data.choices[0].message});
    } catch(error) {

      if (error.response) {
        console.error(error.response.status, error.response.data);
        res.status(error.response.status).json(error.response.data);
      } else {

        console.error(`Error with OpenAI API request: ${error.message}`);

        res.status(500).json({
          error: {
            message: 'An error occurred during your request.',
          }
        });
      }
    }
  });
}

module.exports = appRouter;


