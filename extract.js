require("dotenv").config();
const { FileProvider, FGuid, Ue4Version, Oodle } = require("unreal.js");
const fs = require("fs-extra");

const GAMEPATH = process.env.PAKS_FOLDER;
const AES_KEY = process.env.AES_KEY;

const folderPatch = "./gamefiles/";

(async () => {
  await Oodle.downloadDLL();
  const provider = new FileProvider(GAMEPATH, Ue4Version.GAME_UE4_27);
  provider.mappingsProvider.reload();
  provider.ioStoreTocReadOptions = 0;
  await provider.initialize();
  await provider.submitKey(FGuid.mainGuid, AES_KEY);

  const techTreeFiles = provider.files.filter(
    (file) => file.path && file.path.includes("Content/Mist/Data/TechTree")
  );

  if (techTreeFiles) {
    techTreeFiles.each((file) => {
      const package = provider.loadGameFile(file);
      console.log(package.toJson());

      /*
      let path = file.getPathWithoutExtension().trim();
      fs.outputFile(
        folderPatch + path + ".json",
        pkg.toString(),
        function (err) {
          if (err) {
            console.error(err);
          }
        }
      );
      */
    });
  }

  const itemsFiles = provider.files.filter(
    (file) => file.path && file.path.includes("Content/Mist/Data/Items")
  );

  const saveGameFiles = (files) => {
    if (files) {
      files.each((file) => {
        const buffer = provider.saveGameFile(file);
        console.log(buffer.toString());

        /*
        let path = file.getPathWithoutExtension().trim();
        fs.outputFile(
          folderPatch + path + ".json",
          pkg.toString(),
          function (err) {
            if (err) {
              console.error(err);
            }
          }
        );
        */
      });
    }
  };

  //aveGameFiles(itemsFiles);
})();
