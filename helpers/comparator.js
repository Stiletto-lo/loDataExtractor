const controller = {};
const Axios = require("axios");
const fs = require("fs");

const DATA_TO_COMPARE = {
  cost: false,
  crafting: false,
  crafting_time: false,
  category: false,
  parent: false,
  damage: true,
};

controller.compareItems = async (extractedItems) => {
  console.log("Start of item comparison");
  let githubItems = await controller.getAllItems();
  let itemsNotFound = [];
  let differentItems = [];
  let sameItems = 0;

  console.log(`Extrated items: ${extractedItems.length}`);
  console.log(`Github items: ${githubItems.length}`);

  if (extractedItems != null && githubItems != null) {
    extractedItems.forEach((extractedItem) => {
      let itemFound = githubItems.find(
        (githubItem) => githubItem.name == extractedItem.name
      );
      githubItems = githubItems.filter(
        (githubItem) => githubItem.name != extractedItem.name
      );
      if (itemFound) {
        if (controller.isTheSame(extractedItem, itemFound)) {
          sameItems++;
        } else {
          differentItems.push(extractedItem);
        }
      } else {
        itemsNotFound.push(extractedItem);
      }
    });
  }

  console.log(`Matching items: ${sameItems}`);
  console.log(`Diferent items: ${differentItems.length}`);
  if (differentItems.length > 0) {
    fs.writeFile(
      "./differentItems.json",
      JSON.stringify(differentItems),
      function (err) {
        if (err) {
          console.error("Error creating the file");
        }
      }
    );
  }
  console.log(`Items that are not added: ${itemsNotFound.length}`);
  if (itemsNotFound.length > 0) {
    fs.writeFile(
      "./itemsNotFound.json",
      JSON.stringify(itemsNotFound),
      function (err) {
        if (err) {
          console.error("Error creating the file");
        }
      }
    );
  }
  console.log(`Items not extracted: ${githubItems.length}`);
  if (githubItems.length > 0) {
    fs.writeFile(
      "./githubItems.json",
      JSON.stringify(githubItems),
      function (err) {
        if (err) {
          console.error("Error creating the file");
        }
      }
    );
  }
};

controller.isTheSame = (extractedItem, githubItem) => {
  if (
    DATA_TO_COMPARE.cost &&
    !controller.compareCost(extractedItem, githubItem)
  ) {
    return false;
  }

  if (
    DATA_TO_COMPARE.crafting &&
    !controller.compareCrafting(extractedItem, githubItem)
  ) {
    return false;
  }

  if (
    DATA_TO_COMPARE.damage &&
    !Object.is(githubItem.damage, extractedItem.damage)
  ) {
    return false;
  }

  if (
    DATA_TO_COMPARE.category &&
    !Object.is(githubItem.category, extractedItem.category)
  ) {
    return false;
  }

  if (
    DATA_TO_COMPARE.parent &&
    !Object.is(githubItem.parent, extractedItem.parent)
  ) {
    return false;
  }

  return true;
};

controller.compareCrafting = (extractedItem, githubItem) => {
  if (githubItem.crafting || extractedItem.crafting) {
    if (
      githubItem.crafting === undefined ||
      extractedItem.crafting === undefined ||
      githubItem.crafting.length != extractedItem.crafting.length
    ) {
      return false;
    } else if (
      (githubItem.crafting[0] && githubItem.crafting[0].ingredients) ||
      (extractedItem.crafting[0] && extractedItem.crafting[0].ingredients)
    ) {
      if (
        githubItem.crafting[0].ingredients === undefined ||
        extractedItem.crafting[0].ingredients === undefined ||
        githubItem.crafting[0].ingredients.length !=
          extractedItem.crafting[0].ingredients.length
      ) {
        return false;
      } else {
        let githubItemTotalIngredients = 0;
        let extractedItemTotalIngredients = 0;

        githubItem.crafting.forEach((recipe) => {
          if (recipe.ingredients) {
            recipe.ingredients.forEach((ingredient) => {
              if (ingredient.count) {
                githubItemTotalIngredients += ingredient.count;
              }
            });
          }
        });

        extractedItem.crafting.forEach((recipe) => {
          if (recipe.ingredients) {
            recipe.ingredients.forEach((ingredient) => {
              if (ingredient.count) {
                extractedItemTotalIngredients += ingredient.count;
              }
            });
          }
        });

        if (githubItemTotalIngredients != extractedItemTotalIngredients) {
          return false;
        }

        if (DATA_TO_COMPARE.crafting_time) {
          let githubItemTotalTime = 0;
          let extractedItemTotalTime = 0;

          githubItem.crafting.forEach((recipe) => {
            if (recipe.time) {
              githubItemTotalTime += recipe.time;
            }
          });

          extractedItem.crafting.forEach((recipe) => {
            if (recipe.time) {
              extractedItemTotalTime += recipe.time;
            }
          });

          if (githubItemTotalTime != extractedItemTotalTime) {
            return false;
          }
        }
      }
    }
  }
  return true;
};

controller.compareCost = (extractedItem, githubItem) => {
  if (githubItem.cost || extractedItem.cost) {
    if (githubItem.cost === undefined || extractedItem.cost === undefined) {
      return false;
    }
    if (
      githubItem.cost.count === undefined ||
      extractedItem.cost.count === undefined ||
      githubItem.cost.count != extractedItem.cost.count
    ) {
      return false;
    } else if (
      githubItem.cost.name === undefined ||
      extractedItem.cost.name === undefined ||
      githubItem.cost.name != extractedItem.cost.name
    ) {
      return false;
    }
  }
  return true;
};

controller.getAllItems = async () => {
  return Axios.get(
    "https://raw.githubusercontent.com/dm94/stiletto-web/master/public/json/items_min.json"
  )
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      logger.error(error);
    });
};

module.exports = controller;
