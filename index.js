const profitablePurchase = function (price, special, needs) {
  let ret = {
    cost: price.reduce((acc, e, i) => acc + price[i] * needs[i], 0),
    promotions_applied: [],
    quantities: needs.slice(),
  };

  for (let [idx, s] of special.entries()) {
    let sPrice = [...s].pop();
    let negativeFlag = false;
    let nextNeeds = needs.map((e, i) => {
      let val = e - s[i];
      if (val < 0) negativeFlag = true;
      return val;
    });
    if (!negativeFlag) {
      let subResult = profitablePurchase(price, special, nextNeeds);
      if (sPrice + subResult.cost < ret.cost) {
        ret.cost = sPrice + subResult.cost;
        ret.promotions_applied = [s, ...subResult.promotions_applied];
        ret.quantities = subResult.quantities;
      }
    }
  }

  return ret;
};

const readFileData = async (inputFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target.result;
      resolve(data); // Resolve the Promise with the data
    };
    reader.onerror = (event) => {
      reject(event.target.error); // Reject the Promise with the error
    };
    reader.readAsText(inputFile);
  });
};

const formatData = (fileData) => {
  let rows;
  if (fileData.includes("\t")) {
    rows = fileData.split("\n").map((line) => line.split("\t"));
  }
  if (fileData.includes(" ")) {
    rows = fileData.split("\r\n");
  }
  return rows;
};

const getInputData = (dataRows) => {
  dataRows = dataRows.slice(1);
  const itemsInfo = sortedItems(
    dataRows.map((el) => {
      const itemObj = {};
      itemObj["id"] = +el.split(" ")[0];
      itemObj["quantity"] = +el.split(" ")[1];
      itemObj["price"] = +el.split(" ")[2];
      return itemObj;
    })
  );
  const prices = itemsInfo.map((el) => el.price);
  const quantity = itemsInfo.map((el) => el.quantity);
  const itemIds = itemsInfo.map((el) => el.id);
  return { prices, quantity, itemIds, itemsInfo };
};

const getPromotionsData = (dataRows) => {
  return dataRows.slice(1);
};

const getItemPromotions = (promotions, itemsInfo, itemIds) => {
  const itemPromotions = [];
  itemsInfo.forEach((item, idx) => {
    promotions.forEach((promotion) => {
      if (+promotion[0] === 1) {
        if (+promotion[1] === item.id) {
          const tempArray = Array(itemsInfo.length).fill(0);
          tempArray[idx] = +promotion[2];
          tempArray[tempArray.length] = +promotion[3];
          itemPromotions.push(tempArray);
        }
      }
      if (+promotion[0] === 2) {
        if (
          itemIds.includes(+promotion[1]) &&
          itemIds.includes(+promotion[3])
        ) {
          const firstItem = +promotion[1];
          const firstItemIdx = itemsInfo.findIndex(
            (item) => item.id === firstItem
          );
          const tempArray = Array(itemsInfo.length).fill(0);
          if (firstItemIdx === 0) {
            tempArray[0] = +promotion[2];
            tempArray[1] = +promotion[4];
          }
          if (firstItemIdx === 1) {
            tempArray[0] = +promotion[4];
            tempArray[1] = +promotion[2];
          }
          tempArray[2] = +promotion[5];
          itemPromotions.push(tempArray);
        }
      }
    });
  });
  return itemPromotions;
};

const processOutput = (output, itemIds, prices, promotions) => {
  // 1. NO PROMOTIONS APPLIED
  const result = [];
  output.quantities.forEach((el, idx) => {
    if (el != 0) {
      const itemID = itemIds[idx];
      const price = prices[idx];
      const quantity = el;
      result.push([itemID, quantity, price]);
    }
  });
  console.log("CHECK");
  console.log(output.promotions_applied);
  // 2. 1 PROMOTION APPLIED
  output.promotions_applied.forEach((promotionSet) => {
    if (promotionSet[0] != 0 && promotionSet[1] != 0) {
      let finalPromotion = promotions.filter(
        (el) =>
          +el[0] === 2 && itemIds.includes(+el[1]) && itemIds.includes(+el[3])
      );
      finalPromotion = finalPromotion.map((el) => {
        let op = [...el].map((num) => +num);
        op = op.slice(1);
        return op;
      });
      result.push(...finalPromotion);
    }
    // GET THE INDEXES OF SINGLE NON ZERO:
    if (promotionSet[0] === 0 || promotionSet[1] === 0) {
      const nonZeroIndexes = [];
      promotionSet.forEach((el, idx) => {
        if (el != 0 && idx != promotionSet.length - 1) {
          nonZeroIndexes.push(idx);
        }
      });
      const itemId = itemIds[nonZeroIndexes[0]];
      let finalPromotion = promotions.filter(
        (el) => +el[0] === 1 && itemId === +el[1]
      );
      finalPromotion = finalPromotion.map((el) => {
        let op = [...el].map((num) => +num);
        op = op.slice(1);
        op = op.slice(0, -2);
        return op;
      });
      result.push(...finalPromotion);
    }
  });

  result.push(output.cost);
  return result;
};

const writeArrayToFile = (array) => {
  const strArr = [];
  array.forEach((subEl) => {
    if (Array.isArray(subEl)) {
      const stArr = subEl.join(",").replaceAll(",", " ");
      strArr.push(stArr);
    } else {
      strArr.push(subEl + "");
    }
  });
  console.log(strArr);
  const data = strArr.join("\n"); // Join array elements with newline character
  return data;
};

const downloadFile = (data, fileName, mimeType) => {
  // Create a Blob from the data
  const blob = new Blob([data], { type: mimeType });

  // Create a download link
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = fileName;

  // Append the download link to the DOM and trigger the click event to download the file
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};

const processData = (inputFileData, promotionsFileData) => {
  const inputDataRows = formatData(inputFileData);
  const promotionDataRows = formatData(promotionsFileData);
  const { prices, quantity, itemIds, itemsInfo } = getInputData(inputDataRows);
  const promotions = getPromotionsData(promotionDataRows);
  const itemPromotions = getItemPromotions(promotions, itemsInfo, itemIds);
  const output = profitablePurchase(
    prices,
    itemPromotions,
    quantity,
    promotions
  );
  console.log(output);
  const result = processOutput(output, itemIds, prices, promotions);
  console.log(result);
  const writeDataStr = writeArrayToFile(result);
  const opEl = document.getElementById("file-output");
  const p = document.createElement("p");
  const outputP = document.createElement("p");
  outputP.className = "content-file-output-header";
  outputP.innerText = "Output";
  opEl.appendChild(outputP);
  p.innerText = writeDataStr;
  p.className = "content-file-output";
  opEl.appendChild(p);
  downloadFile(writeDataStr, "output.txt", "txt");
};

document.getElementById("input").addEventListener("change", async (event) => {
  let inputFile;
  let promotionsFile;
  const fileList = event.target.files;
  for (let i = 0; i < fileList.length; i++) {
    if (fileList[i].name == "input.txt") {
      inputFile = fileList[i];
    }
    if (fileList[i].name == "promotions.txt") {
      promotionsFile = fileList[i];
    }
  }

  const inputFileData = await readFileData(inputFile);
  const promotionsFileData = await readFileData(promotionsFile);
  processData(inputFileData, promotionsFileData);
});

const sortedItems = (items) => items.sort((a, b) => a.price - b.price);
