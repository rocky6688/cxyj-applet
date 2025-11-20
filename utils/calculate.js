/** 报价计算工具函数 */

// 计算项目总价
function calculateItemTotal(item, area = 1) {
  if (item.unit === '总价') {
    return 0; // 百分比费用单独计算
  }
  return item.price * area;
}

// 计算分类总价
function calculateCategoryTotal(categoryData, selectedItems) {
  let total = 0;
  categoryData.items.forEach(item => {
    if (selectedItems[item.id]) {
      const area = selectedItems[item.id].area || 1;
      total += calculateItemTotal(item, area);
    }
  });
  return total;
}

// 计算基础总价（不含百分比费用）
function calculateBaseTotal(allData, selectedItems) {
  let total = 0;
  Object.keys(allData).forEach(categoryKey => {
    total += calculateCategoryTotal(allData[categoryKey], selectedItems);
  });
  return total;
}

// 计算百分比费用
function calculatePercentageFees(baseTotal) {
  const designFee = baseTotal * 0.02; // 设计费 2%
  const transportFee = baseTotal * 0.02; // 运输费 2%
  const managementFee = baseTotal * 0.02; // 管理费 2%
  const stairsFee = baseTotal * 0.02; // 楼梯房上楼费 2%
  
  return {
    designFee,
    transportFee,
    managementFee,
    stairsFee,
    total: designFee + transportFee + managementFee + stairsFee
  };
}

// 计算最终总价
function calculateFinalTotal(allData, selectedItems) {
  const baseTotal = calculateBaseTotal(allData, selectedItems);
  const percentageFees = calculatePercentageFees(baseTotal);
  return baseTotal + percentageFees.total;
}

module.exports = {
  calculateItemTotal,
  calculateCategoryTotal,
  calculateBaseTotal,
  calculatePercentageFees,
  calculateFinalTotal
}