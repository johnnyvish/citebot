// Import necessary modules
import OpenAI from "openai";
import { NextResponse } from "next/server";
import Exa from "exa-js"; // Assuming exa-js is installed and supports ES Module syntax

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to fetch data from Exa API using exa-js
async function fetchExaApiData(text) {
  // Initialize Exa with your Exa API key
  const exa = new Exa(process.env.EXA_API_KEY); // Use an environment variable for the Exa API key

  try {
    // Perform a search using Exa. Adjust the search query as needed.
    const res = await exa.search(text);
    return res; // Adjust this based on the actual structure of Exa's response
  } catch (error) {
    console.error("Error fetching data from Exa API:", error);
    throw error; // Rethrow the error to handle it in the calling function
  }
}

// Function to post text to the GPT API and receive a response
async function postToGptApi(inputText) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: inputText },
    ],
  });

  return response.choices[0].message.content;
}

// The main POST handler for the Next.js API route
export async function POST(request) {
  try {
    const req = await request.json();
    const inputText = req.text;

    // Fetch data from Exa API
    const exaData = await fetchExaApiData(inputText);
    console.log(exaData);
    // Process the Exa API data as needed
    // For example, assuming `exaData` contains a list of highlights:
    const highlights = exaData.results
      .map((item, index) => {
        return `Result ${index + 1}:
    Title: ${item.title}
    URL: ${item.url}
    Published Date: ${item.publishedDate}
    Author: ${item.author || "Unknown"}
    ID: ${item.id}
    Score: ${item.score.toFixed(3)}\n`;
      })
      .join("\n");

    const promptText = `Based on the following research highlights for the question \n${inputText}\n\n: : \n${highlights}\n\nProvide a summary and potential solution.`;

    // Now post the processed highlights to GPT API
    const outputText = await postToGptApi(promptText);

    return NextResponse.json({ result: outputText }, { status: 200 });
  } catch (error) {
    console.error(
      "Caught an error during the request or response handling:",
      error
    );
    const errorMessage = error.response
      ? `${error.response.status}: ${error.response.data}`
      : error.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
