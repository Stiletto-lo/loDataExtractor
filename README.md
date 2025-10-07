# loDataExtractor

Data extractor for the game. Used to generate a JSON with the desired data from the different items.

## How it works

The program reads all the useful game jsons and parses them to get what is needed.

## Instructions

- Extract game data in JSON format. A programme such as [FModel](https://github.com/4sval/FModel) can be used for this purpose.
- Another project called [Ue4Export](https://github.com/CrystalFerrai/Ue4Export) can be used to export the data to a JSON file.
- The important folders are:
  - Content/Mist/Data/
  - Content/Localization/Game
- Clone this repository and install [Node.js](https://nodejs.org/es/)
- Install project dependencies: `npm install`
- Create an .env with the data. [Similar to the example](.env.example)
- Run the program: `npm run start`
