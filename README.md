# Motivation Bot
A NodeJS Discord bot to help you stay motivated!
Features include:
* Motivational GIFs via the Giphy API!
* AI-generated motivational messages via the OpenAI API!
* Set a nickname for the bot to call you! Nicknames persist via a MongoDB database!
* Get the bot to remind you to do something on an interval! Reminders persist via a MongoDB database!
* Run the bot in a container via Docker!

## Requirements
To run for the first time, you will need
* Node v16.9.0 or higher
* A MongoDB database (if not using Docker)
* Docker (if running via Docker)

## Running locally for the first time
To get the bot running on your local machine:
1. Run `npm install`
2. Re-name `.env.example` to `.env`
3. Fill out `BOT_TOKEN`,`DEPLOY_CLIENT_ID`, and `MONGO_URI` in `.env`
4. Run `npm run deploy-commands` to register commands
5. Run `node .` to start up the bot

## Running via Docker
To get the bot running in a Docker container:
1. Follow steps 1-4 of running locally
2. Set the `MONGO_URI` in `.env` to `mongodb://mongo:27017/motivation_bot`
3. Run `docker-compose up`
4. If any changes are made, make sure to run `docker-compose build --no-cache`

## Additional feature set-up
If you want to have Giphy- and OpenAI-backed features to work, you will also need to
1. Fill out `GIPHY_API_KEY` in `.env` to support sending motivational GIFs via the `/gif` command
2. Fill out `OPENAI_API_KEY` in `.env` to support sending motivational messages via the `/motivate-me` command
