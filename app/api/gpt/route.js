import OpenAI from "openai";
import { NextResponse } from "next/server";
import Exa from "exa-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 120;

async function fetchExaApiData(text) {
  const exa = new Exa(process.env.EXA_API_KEY);

  try {
    const res = await exa.searchAndContents(text, {
      numResults: 10,
      useAutoprompt: true,
      include_domains: [
        "nejm.org",
        "jamanetwork.com",
        "thelancet.com",
        "bmj.com",
        "sciencedirect.com",
      ],
      highlights: { num_sentences: 7, highlights_per_url: 2 },
    });

    return res;
  } catch (error) {
    console.error("Error fetching data from Exa API:", error);
    throw error;
  }
}

async function postToGptApi(results, inputText) {
  const promptText = `You are the LLM backend of a product called CiteBot. Citebot searches academic research from the user query and pulls out the highlights from the data of those papers. Your job is to take the search engine data and write a response in markdown doing the following:

  1) Write a summary of all the highlights with the objective of answering the user's query in mind.
  2) Suggest a potential solution to the problem so far based on all the source data.
  3) If and only if you think that any of the 5 sources are not good, create a new iteration of the query and write your new query in the format of <<QUERY>>.
  4) Else, cite all the sources.
  `;

  console.log("gpt reached");

  const response = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    messages: [
      { role: "system", content: promptText },
      {
        role: "user",
        content: "query: " + inputText + "data: " + results,
      },
    ],
  });

  console.log("gpt success");

  return response.choices[0].message.content;
}

export async function POST(request) {
  try {
    const req = await request.json();
    const inputText = req.text;

    const exaData = await fetchExaApiData(inputText);

    const results = exaData.results
      .map((item, index) => {
        let highlightsFormatted = "";
        if (item.highlights && item.highlightScores) {
          highlightsFormatted = item.highlights
            .map((highlight, highlightIndex) => {
              return `    Highlight ${highlightIndex + 1}: ${highlight}
      Highlight Score: ${item.highlightScores[highlightIndex].toFixed(3)}\n`;
            })
            .join("\n");
        }

        return `Result ${index + 1}:
      Title: ${item.title}
      URL: ${item.url}

  ${highlightsFormatted}`;
      })
      .join("\n\n");

    console.log(results);

    const outputText = await postToGptApi(results, inputText);

    console.log(outputText);

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
