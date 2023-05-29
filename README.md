# Motivation Bot

## Requirements
Node v16.9.0 or higher

## Running for the first time
1. Run `npm install`
2. Re-name `.env.example` to `.env`
3. Fill out `BOT_TOKEN` and `DEPLOY_CLIENT_ID` in `.env`
4. Run `npm run deploy-commands` to register commands
5. Run `node .` to start up the bot

## Additional features
1. Fill out `GIPHY_API_KEY` in `.env` to support sending motivational GIFs via the `/gif` command
2. Fill out `OPENAI_API_KEY` in `.env` to support sending motivational messages via the `/motivate-me` command