"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

function BookAnimation() {
  return (
    <div className="book">
      <div className="book__pg-shadow"></div>
      <div className="book__pg"></div>
      <div className="book__pg book__pg--2"></div>
      <div className="book__pg book__pg--3"></div>
      <div className="book__pg book__pg--4"></div>
      <div className="book__pg book__pg--5"></div>
    </div>
  );
}

export default function Home() {
  const [userMessage, setUserMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "CITE-BOT",
      message:
        "Hi, I am Citebot. Ask me any medical questions and I’ll try to answer them with citations.",
      animation: false,
    },
  ]);
  const chatboxRef = useRef(null);

  async function promptGPT(text) {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "User", message: text },
      { sender: "CITE-BOT", message: "Thinking...", animation: true },
    ]);

    try {
      const response = await fetch("/api/gpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      if (response.status === 200) {
        const data = await response.json();
        setTimeout(() => {
          setMessages((prevMessages) => [
            ...prevMessages.filter(
              (msg, index) => index !== prevMessages.length - 1
            ),
            { sender: "CITE-BOT", message: data.result, animation: false },
          ]);
        }, 1000); // Adjust this to change the delay as needed
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error("Error processing text through GPT", error);
    }
  }

  const sendMessage = (e) => {
    e.preventDefault();
    const trimmedMessage = userMessage.trim();
    if (trimmedMessage) {
      promptGPT(trimmedMessage);
    }
    setUserMessage("");
  };

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-[#e2dac2]">
      <Image
        src="/logo.png"
        width={240}
        height={240}
        alt="Logo"
        className="rounded-2xl"
      />
      <div
        ref={chatboxRef}
        className="flex flex-col justify-start items-start bg-[#d1c59f] h-[520px] w-[85%] mt-4 rounded-2xl overflow-auto p-4"
      >
        {messages.map((msg, index) => (
          <div key={index} className="text-left w-full mb-2 text-black">
            <strong>{msg.sender}:</strong>
            {msg.animation ? (
              <div className="pt-2">
                <BookAnimation />
              </div>
            ) : (
              <>
                <br />{" "}
                {/* Ensure a newline starts right after the sender's name */}
                {/* Split message by new lines and map each line to a <p> tag or similar */}
                {msg.message.split("\n").map((line, idx) => (
                  // Using <div> instead of <span> for block-level separation; you can also use <p> if preferred
                  <div key={idx} style={{ marginBottom: "0.5em" }}>
                    {line}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
      <form className="w-full flex justify-center mt-8" onSubmit={sendMessage}>
        <textarea
          id="userMessage"
          className="bg-[#d1c59f] h-[140px] w-[65%] rounded-2xl p-4 placeholder-black"
          placeholder="Write a message..."
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
        />
        <button
          type="submit"
          className="ml-2 text-black text-[2.5rem] font-bold py-2 px-4 rounded-2xl"
        >
          ^ <br />{" "}
        </button>
      </form>
    </main>
  );
}
