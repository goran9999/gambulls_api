import puppeteer from "puppeteer";
import { load } from "cheerio";
import fs from "fs";

export async function getBirdeyeContent() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Go to the page and wait until there are no network connections for at least 500 ms
  await page.goto("https://birdeye.so/", { waitUntil: "networkidle0" });

  // If there are specific elements that signify the complete loading of the page,
  // you can wait for them explicitly. Here's an example of waiting for a table,
  // but you might add more selectors as needed.
  try {
    await page.waitForSelector("table", { timeout: 30000 }); // Adjust selector and timeout as needed
  } catch (error) {
    console.error("The table did not load within 30 seconds:", error);
  }

  const content = await page.content();
  console.log("Got content");

  // Save the content to a file to inspect what was actually loaded if needed
  fs.writeFileSync("./content.txt", content);

  // Use Cheerio to parse the page content
  const $ = load(content);

  // Extract and log all href attributes from <a> tags
  $("a").each((index, element) => {
    const href = $(element).attr("href");
    console.log(href); // Output each href attribute
  });

  await browser.close();
}
