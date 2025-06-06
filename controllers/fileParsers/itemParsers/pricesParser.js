const fs = require("node:fs");

const dataParser = require("../../dataParsers");
const utilityFunctions = require("../utilityFunctions");

const parsePrices = (filePath) => {
	const rawdata = fs.readFileSync(filePath);
	const jsonData = JSON.parse(rawdata);
	if (jsonData[1]?.Properties?.OrdersArray) {
		const allOrders = jsonData[1].Properties.OrdersArray;

		for (const order of allOrders) {
			if (order?.ItemClass?.ObjectName && order?.Price) {
				const item = utilityFunctions.extractItemByType(
					dataParser.parseType(order.ItemClass.ObjectName),
				);

				if (order.Price > item.trade_price) {
					item.trade_price = order.Price;
				}

				if (!item.category && item.name === "ProxyLicense") {
					item.category = "Resources";
				}

				utilityFunctions.addItem(item);
			}
		}
	}
};

module.exports = {
	parsePrices,
};
