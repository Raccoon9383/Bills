const items = [];
const people = [];

function formatNumber(num) {
  return num.toLocaleString("ko-KR");
}

function addItem() {
  const name = document.getElementById("itemName").value;
  const count = parseInt(document.getElementById("itemCount").value);
  const price = parseInt(document.getElementById("itemPrice").value);
  if (!name || isNaN(count) || isNaN(price))
    return alert("모든 항목을 입력해주세요.");
  items.push({ name, count, price });
  document.getElementById("itemName").value = "";
  document.getElementById("itemCount").value = "";
  document.getElementById("itemPrice").value = "";
  updateItemList();
  renderSelectionArea();
}

function removeItem(index) {
  items.splice(index, 1);
  updateItemList();
  renderSelectionArea();
}

function updateItemList() {
  const list = document.getElementById("itemList");
  list.innerHTML = items
    .map(
      (item, i) =>
        `<div class="item">${item.name} - ${item.count}개 × ₩${formatNumber(
          item.price
        )} <button class="remove-btn" onclick="removeItem(${i})">×</button></div>`
    )
    .join("");
  updateReceiptTotal();
}

function updateReceiptTotal() {
  const total = items.reduce((sum, item) => sum + item.count * item.price, 0);
  document.getElementById(
    "receiptTotalDisplay"
  ).textContent = `영수증 총액: ₩${formatNumber(total)}`;
}

function addPerson() {
  const name = document.getElementById("personName").value;
  if (!name) return alert("이름을 입력해주세요.");
  people.push({ name, consumed: {} });
  document.getElementById("personName").value = "";
  updatePersonList();
  renderSelectionArea();
}

function removePerson(index) {
  people.splice(index, 1);
  updatePersonList();
  renderSelectionArea();
}

function updatePersonList() {
  const list = document.getElementById("personList");
  list.innerHTML = people
    .map(
      (p, i) =>
        `<div class="person-entry">
       <span class="person-entry-name">• ${p.name}</span>
       <button class="remove-btn" onclick="removePerson(${i})">×</button>
     </div>`
    )
    .join("");
}

function renderSelectionArea() {
  if (people.length === 0 || items.length === 0) return;
  document.getElementById("selectionSection").style.display = "block";
  const area = document.getElementById("selectionArea");
  area.innerHTML = "";
  people.forEach((person, pIdx) => {
    const row = document.createElement("div");
    row.className = "person-row";
    const nameLabel = document.createElement("label");
    nameLabel.textContent = person.name;
    row.appendChild(nameLabel);
    items.forEach((item, iIdx) => {
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.placeholder = item.name;
      input.oninput = (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val > 0) person.consumed[item.name] = val;
        else delete person.consumed[item.name];
      };
      row.appendChild(input);
    });
    area.appendChild(row);
  });
}

function toFraction(numerator, denominator) {
  return numerator + "/" + denominator;
}

function calculate() {
  const itemMap = {};
  items.forEach(
    (item) => (itemMap[item.name] = { ...item, consumerList: [], totalQty: 0 })
  );
  const totals = {};
  const consumedItems = {};
  const itemConsumers = {};
  people.forEach((p) => {
    totals[p.name] = 0;
    consumedItems[p.name] = [];
    for (const [itemName, qty] of Object.entries(p.consumed)) {
      if (!itemMap[itemName]) continue;
      itemMap[itemName].consumerList.push({ name: p.name, qty });
      itemMap[itemName].totalQty += qty;
      if (!itemConsumers[itemName]) itemConsumers[itemName] = [];
      itemConsumers[itemName].push(p.name);
    }
  });
  let calculatedTotal = 0;
  for (const item of Object.values(itemMap)) {
    const totalCost = item.count * item.price;
    const totalConsumedQty = item.totalQty;
    if (totalConsumedQty === 0) continue;
    const unitShare = totalCost / totalConsumedQty;
    for (const consumer of item.consumerList) {
      const personShare = unitShare * consumer.qty;
      totals[consumer.name] += personShare;
      calculatedTotal += personShare;
      const fraction = toFraction(consumer.qty, totalConsumedQty);
      consumedItems[consumer.name].push(`${item.name} x${fraction}`);
    }
  }
  const receiptTotal = items.reduce(
    (sum, item) => sum + item.count * item.price,
    0
  );
  const resultLines = [
    `✅ 정산 결과 (총액: ₩${formatNumber(
      Math.round(calculatedTotal)
    )} / 영수증 총액: ₩${formatNumber(receiptTotal)})\n`,
  ];
  for (const name in totals) {
    const itemsList = consumedItems[name].join(", ");
    resultLines.push(
      `${name}: ₩${formatNumber(Math.round(totals[name]))} (${itemsList})`
    );
  }
  resultLines.push("\n👥 항목별 참여자 목록");
  for (const item in itemConsumers) {
    resultLines.push(`${item}: (${itemConsumers[item].join(", ")})`);
  }
  document.getElementById("results").textContent = resultLines.join("\n");
}
