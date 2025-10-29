import * as dataParser from "../../dataParsers";
import * as utilityFunctions from "../utilityFunctions";
import { readJsonFile } from "../../utils/read-json-file";

export const parsePrices = (filePath: string) => {
	const jsonData = readJsonFile(filePath);
	if (jsonData[1]?.Properties?.OrdersArray) {
		const allOrders = jsonData[1].Properties.OrdersArray;

		for (const order of allOrders) {
			if (order?.ItemClass?.ObjectName && order?.Price) {
				const item = utilityFunctions.extractItemByType(
					dataParser.parseType(order.ItemClass.ObjectName),
				);

				if (item?.trade_price && order.Price > item?.trade_price) {
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
