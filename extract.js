const { FileProvider, FGuid, Ue4Version, Oodle } = require("unreal.js");
const fs = require("fs-extra");

const GAMEPATH =
  "C:/Program Files (x86)/Steam/steamapps/common/Last Oasis/Mist/Content/Paks/";
const AES_KEY =
  "0xFED592820455B2B9A8CA3E85DD8CD37BB3BAC9D44116D4D32A6ED77CA75452D0";

const folderPatch = "./gamefiles/";

(async () => {
  await Oodle.downloadDLL();
  const provider = new FileProvider(GAMEPATH, Ue4Version.GAME_UE4_27);
  provider.mappingsProvider.reload();
  provider.ioStoreTocReadOptions = 0;
  await provider.initialize();
  await provider.submitKey(FGuid.mainGuid, AES_KEY);

  let techTreeFiles = provider.files.filter(
    (file) => file.path && file.path.includes("Content/Mist/Data/TechTree")
  );

  if (techTreeFiles) {
    techTreeFiles.each((file) => {
      let package = provider.loadGameFile(file);
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

  let itemsFiles = provider.files.filter(
    (file) => file.path && file.path.includes("Content/Mist/Data/Items")
  );

  const saveGameFiles = (files) => {
    if (files) {
      files.each((file) => {
        let buffer = provider.saveGameFile(file);
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
