const { FileProvider, FGuid, Ue4Version, Oodle } = require("unreal.js");
const { writeFileSync } = require("fs");

const GAMEPATH =
  "C:/Program Files (x86)/Steam/steamapps/common/Last Oasis/Mist/Content/Paks/";
const AES_KEY =
  "0xFED592820455B2B9A8CA3E85DD8CD37BB3BAC9D44116D4D32A6ED77CA75452D0";

const folderPatch = "./gamefiles/";

(async () => {
  await Oodle.downloadDLL();
  const provider = new FileProvider(GAMEPATH, Ue4Version.GAME_UE4_27);
  provider.mappingsProvider.reload();
  provider.populateIoStoreFiles = true;
  await provider.initialize();
  await provider.submitKey(FGuid.mainGuid, AES_KEY);

  const pkg = provider.loadGameFile(
    "Mist/Content/Mist/Data/TechTree/Walkers/Tusker/TuskerWings_T3_Raider.uasset"
  );
  console.log(pkg.toJson());

  return;

  let techTreeFiles = provider.files.filter(
    (file) => file.path && file.path.includes("Content/Mist/Data/TechTree")
  );

  if (techTreeFiles) {
    techTreeFiles.each((file) => {
      console.log(file);
      //let formated = provider.loadObject(file.path);

      let path = file.getPathWithoutExtension().trim();

      /*fs.writeFile(folderPatch + path + ".json", formated, function (err) {
        if (err) {
          console.error(err);
        }
      });*/
    });
  }

  let itemsFiles = provider.files.filter(
    (file) => file.path && file.path.includes("Content/Mist/Data/Items")
  );

  //const pkg = provider.loadLocres("Mist/Content/Mist/Data/StringTables/Items");
  //console.log(pkg.toJson());
})();
