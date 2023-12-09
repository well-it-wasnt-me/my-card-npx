#!/usr/bin/env node

"use strict";

const boxen = require("boxen");
const chalk = require("chalk");
const inquirer = require("inquirer");
const clear = require("clear");
const open = require("open");
const fs = require("fs");
const request = require("request");
const path = require("path");
const ora = require("ora");

clear();

const res = fs.readFileSync(path.resolve(__dirname, "data.json"));
const user_data = JSON.parse(res);
const {
    user_name,
    user_email,
    twitter_username,
    linkedin_username,
    github_username,
    personal_site,
    npx_card_handle,
    job_title,
    resume_url,
} = user_data;

const prompt = inquirer.createPromptModule();

async function fetchArticles(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                const articles = JSON.parse(body);
                resolve(articles);
            } else {
                reject(error || "Error fetching articles.");
            }
        });
    });
}

async function showLatestArticles() {
    const questions = [
        {
            name: "action",
            type: "list",
            message: "What would you like to do?",
            choices: [
                {
                    name: `Send me an ${chalk.green.bold("email")}?`,
                    value: () => {
                        open(`mailto:${user_email}`);
                        console.log("\nDone, see you soon at inbox.\n");
                    },
                },
                {
                    name: `Download my ${chalk.magentaBright.bold("Resume")}?`,
                    value: () => {
                        const loader = ora({
                            text: " Downloading Resume",
                        }).start();
                        let pipe = request(`${resume_url}`).pipe(
                            fs.createWriteStream(`./${npx_card_handle}-resume.pdf`)
                        );
                        pipe.on("finish", function () {
                            let downloadPath = path.join(
                                process.cwd(),
                                `${npx_card_handle}-resume.pdf`
                            );
                            console.log(`\nResume Downloaded at ${downloadPath} \n`);
                            open(downloadPath);
                            loader.stop();
                        });
                    },
                },
                {
                    name: "See my latest articles?",
                    value: async () => {
                        const articlesLoader = ora({
                            text: "Fetching the latest articles",
                        }).start();

                        const articlesUrl =
                            "https://blindlystupid.com/wp-json/wp/v2/posts?per_page=5&_embed";

                        try {
                            const articles = await fetchArticles(articlesUrl);
                            articlesLoader.stop();

                            const articleQuestion = {
                                name: "selectedArticle",
                                type: "list",
                                message: "Choose an article to open in the browser:",
                                choices: articles.map((article) => ({
                                    name: article.title.rendered,
                                    value: article.link,
                                })),
                            };

                            const articleAnswer = await prompt(articleQuestion);

                            // Open the selected article in the default browser
                            if (articleAnswer.selectedArticle) {
                                open(articleAnswer.selectedArticle);
                            }
                        } catch (error) {
                            articlesLoader.stop();
                            console.error(chalk.red("Error fetching or displaying articles:", error));
                        }
                    },
                },
                {
                    name: "Just quit.",
                    value: () => {
                        console.log("See you!\n");
                    },
                },
            ],
        },
    ];

    const data = {
        name: chalk.bold.green(`                  ${user_name}`),
        work: `${chalk.white(`${job_title}`)}`,
        github: chalk.gray("https://github.com/") + chalk.green(`${github_username}`),
        linkedin: chalk.gray("https://linkedin.com/in/") + chalk.blue(`${linkedin_username}`),
        web: chalk.cyan(`${personal_site}`),
        npx: chalk.red("npx") + " " + chalk.white(`${npx_card_handle}`),
        labelWork: chalk.white.bold("       Work:"),
        labelGitHub: chalk.white.bold("     GitHub:"),
        labelLinkedIn: chalk.white.bold("   LinkedIn:"),
        labelWeb: chalk.white.bold("        Web:"),
        labelCard: chalk.white.bold("       Card:"),
    };

    const me = boxen(
        [
            `${data.name}`,
            ``,
            `${data.labelWork}  ${data.work}`,
            ``,
            `${data.labelGitHub}  ${data.github}`,
            `${data.labelLinkedIn}  ${data.linkedin}`,
            `${data.labelWeb}  ${data.web}`,
            ``,
            `${data.labelCard}  ${data.npx}`,
            ``,
            `${chalk.italic("I am currently looking for new opportunities,")}`,
            `${chalk.italic("my inbox is always open. Whether you have a")}`,
            `${chalk.italic("question or just want to say hi, I will try ")}`,
            `${chalk.italic("my best to get back to you!")}`,
        ].join("\n"),
        {
            margin: 1,
            float: "center",
            padding: 1,
            borderStyle: "single",
            borderColor: "green",
        }
    );

    console.log(me);

    const answers = await prompt(questions);

    if (answers.action) {
        answers.action();
    }
}

showLatestArticles();
