const { renovationData } = require('../../utils/data.js');
const { calculateBaseTotal, calculatePercentageFees, calculateFinalTotal } = require('../../utils/calculate.js');
const { STAIRS_FEE_RATE, PERCENT_FEE_RATE } = require('../../utils/constants.js');

Page({
  data: {
    // 分类数据
    demolitionItems: renovationData.demolition.items,
    wallItems: renovationData.wall.items,
    ceilingItems: renovationData.ceiling.items,
    floorItems: renovationData.floor.items,
    comprehensiveItems: renovationData.comprehensive.items,
    
    // 分类展开状态
    expandedCategories: {
      demolition: true,
      wall: true,
      ceiling: true,
      floor: true,
      comprehensive: true
    },
    
    // 选中的项目
    selectedItems: {},
    
    // 手动输入的金额（面议项目）
    manualPrices: {},
    
    // 数量输入（个、米、套等）
    quantities: {},
    
    // 总价相关
    baseTotal: 0,
    fees: {
      designFee: 0,
      transportFee: 0,
      managementFee: 0,
      stairsFee: 0
    },
    finalTotal: 0
    ,
    categorySelectAll: {
      demolition: true,
      wall: true,
      ceiling: true,
      floor: true,
      comprehensive: true
    }
  },

  onLoad() {
    // 初始化选中状态 - 默认勾选所有项目
    this.initializeDefaultSelection();
  },

  // 初始化默认选中所有项目
  initializeDefaultSelection() {
    const selectedItems = {};
    const quantities = {};
    const manualPrices = {};
    
    // 遍历所有分类的项目
    const allCategories = ['demolition', 'wall', 'ceiling', 'floor', 'comprehensive'];
    allCategories.forEach(category => {
      renovationData[category].items.forEach(item => {
        selectedItems[item.id] = {
          item: item,
          area: 1,
          areaText: '1.00',
          checked: true
        };
        
        // 初始化数量（默认为1）
        quantities[item.id] = 1;
        
        // 初始化手动价格（面议项目）
        if (item.price === 0) {
          manualPrices[item.id] = 0;
        }
      });
    });
    
    this.setData({
      selectedItems: selectedItems,
      quantities: quantities,
      manualPrices: manualPrices,
      categorySelectAll: {
        demolition: true,
        wall: true,
        ceiling: true,
        floor: true,
        comprehensive: true
      }
    });
    
    this.updateTotals();
  },

  // 分类展开/收缩
  toggleCategory(e) {
    const category = e.currentTarget.dataset.category;
    const expandedCategories = this.data.expandedCategories;
    expandedCategories[category] = !expandedCategories[category];
    
    this.setData({
      expandedCategories: expandedCategories
    });
  },

  // 数量输入事件
  onQuantityInput(e) {
    const itemId = e.currentTarget.dataset.itemId;
    const quantity = parseFloat(e.detail.value) || 0;
    let quantities = this.data.quantities;
    let selectedItems = this.data.selectedItems;
    quantities[itemId] = quantity;
    if (quantity <= 0 && selectedItems[itemId]) {
      delete selectedItems[itemId];
    }
    this.setData({
      quantities: quantities,
      selectedItems: selectedItems
    });
    const category = this.getCategoryByItemId(itemId);
    if (category) {
      const categorySelectAll = { ...this.data.categorySelectAll };
      categorySelectAll[category] = this.computeCategoryAllSelected(category, this.data.selectedItems);
      this.setData({ categorySelectAll });
    }
    console.log('[onQuantityInput] itemId=', itemId, 'quantity=', quantity, 'selected has=', !!this.data.selectedItems[itemId]);
    this.updateTotals();
  },

  // 手动价格输入事件（面议项目）
  onManualPriceInput(e) {
    const itemId = e.currentTarget.dataset.itemId;
    const price = parseFloat(e.detail.value) || 0;
    
    let manualPrices = this.data.manualPrices;
    manualPrices[itemId] = price;
    
    this.setData({
      manualPrices: manualPrices
    });
    
    this.updateTotals();
  },

  // 项目选择事件
  onItemSelect(e) {
    const item = e.currentTarget.dataset.item;
    const val = e.detail.value;
    const isChecked = Array.isArray(val)
      ? (val.indexOf(item.id) >= 0 || val.length > 0)
      : (typeof val === 'string' ? val.length > 0 : !!val);
    console.log('[onItemSelect] id=', item.id, 'isChecked=', isChecked, 'raw=', val);
    
    let selectedItems = this.data.selectedItems;
    let quantities = this.data.quantities;
    let manualPrices = this.data.manualPrices;
    
    if (isChecked) {
      // 选中项目
      selectedItems[item.id] = {
        item: item,
        area: 1,
        areaText: '1.00',
        checked: true
      };
      
      // 初始化数量
      if (!quantities[item.id]) {
        quantities[item.id] = 1;
      }
      
      // 初始化手动价格（面议项目）
      if (item.price === 0 && !manualPrices[item.id]) {
        manualPrices[item.id] = 0;
      }
    } else {
      // 取消选中
      delete selectedItems[item.id];
    }
    
    this.setData({
      selectedItems: selectedItems,
      quantities: quantities,
      manualPrices: manualPrices
    });
    const category = item.category;
    if (category) {
      const categorySelectAll = { ...this.data.categorySelectAll };
      categorySelectAll[category] = this.computeCategoryAllSelected(category, this.data.selectedItems);
      this.setData({ categorySelectAll });
    }
    
    this.updateTotals();
  },

  // 面积输入事件
  onAreaInput(e) {
    const itemId = e.currentTarget.dataset.itemId;
    const raw = String(e.detail.value || '');
    let cleaned = raw.replace(/[^0-9.]/g, '');
    const firstDot = cleaned.indexOf('.');
    if (firstDot >= 0) {
      const before = cleaned.slice(0, firstDot);
      const afterRaw = cleaned.slice(firstDot + 1).replace(/\./g, '');
      const after = afterRaw.slice(0, 2);
      cleaned = before + '.' + after;
    }
    if (cleaned.startsWith('.')) cleaned = '0' + cleaned;
    const num = parseFloat(cleaned);
    const area = isNaN(num) ? 0 : num;
    const areaText = cleaned;
    
    let selectedItems = this.data.selectedItems;
    
    if (selectedItems[itemId]) {
      selectedItems[itemId].area = area;
      selectedItems[itemId].areaText = areaText;
      
      this.setData({
        selectedItems: selectedItems
      });
      
      this.updateTotals();
    }
  },

  onAreaBlur(e) {
    const itemId = e.currentTarget.dataset.itemId;
    let selectedItems = this.data.selectedItems;
    if (selectedItems[itemId]) {
      const area = parseFloat(selectedItems[itemId].area);
      const num = isNaN(area) ? 0 : area;
      if (num === 0) {
        const category = selectedItems[itemId].item && selectedItems[itemId].item.category;
        delete selectedItems[itemId];
        const categorySelectAll = { ...this.data.categorySelectAll };
        if (category) categorySelectAll[category] = false;
        this.setData({ selectedItems, categorySelectAll });
      } else {
        selectedItems[itemId].area = num;
        selectedItems[itemId].areaText = num.toFixed(2);
        this.setData({ selectedItems });
      }
      const category = this.getCategoryByItemId(itemId);
      if (category) {
        const categorySelectAll = { ...this.data.categorySelectAll };
        categorySelectAll[category] = this.computeCategoryAllSelected(category, this.data.selectedItems);
        this.setData({ categorySelectAll });
      }
      this.updateTotals();
    }
  },

  // 输入框聚焦时清空显示值
  onAreaFocus(e) {
    // 保留原值，不清空
  },
  onQuantityFocus(e) {
    const itemId = e.currentTarget.dataset.itemId;
    let quantities = this.data.quantities;
    quantities[itemId] = '';
    this.setData({ quantities });
  },
  onManualPriceFocus(e) {
    const itemId = e.currentTarget.dataset.itemId;
    let manualPrices = this.data.manualPrices;
    manualPrices[itemId] = '';
    this.setData({ manualPrices });
  },

  // 分类全选/取消全选
  onCategorySelectAllChange(e) {
    const category = e.currentTarget.dataset.category;
    const checked = Array.isArray(e.detail.value) && e.detail.value.length > 0;
    const selectedItems = { ...this.data.selectedItems };
    const quantities = { ...this.data.quantities };
    const manualPrices = { ...this.data.manualPrices };

    const items = (renovationData[category] && renovationData[category].items) || [];
    if (checked) {
      items.forEach(item => {
        if (!selectedItems[item.id]) {
          selectedItems[item.id] = {
            item,
            area: 1,
            areaText: '1.00',
            checked: true
          };
        }
        if (item.unit === '米' || item.unit === '个' || item.unit === '套' || item.unit === '单扇') {
          if (!quantities[item.id]) quantities[item.id] = 1;
        }
        if (item.price === 0) {
          if (!manualPrices[item.id]) manualPrices[item.id] = 0;
        }
      });
    } else {
      items.forEach(item => {
        if (selectedItems[item.id]) {
          delete selectedItems[item.id];
        }
      });
    }

    const categorySelectAll = { ...this.data.categorySelectAll, [category]: checked };
    this.setData({
      selectedItems,
      quantities,
      manualPrices,
      categorySelectAll
    });
    this.updateTotals();
  },

  // 阻止冒泡的空函数
  noop() {},

  computeCategoryAllSelected(category, selectedItems) {
    const items = (renovationData[category] && renovationData[category].items) || [];
    return items.every(it => !!selectedItems[it.id]);
  },

  getCategoryByItemId(itemId) {
    const cats = ['demolition','wall','ceiling','floor','comprehensive'];
    for (let i = 0; i < cats.length; i++) {
      const cat = cats[i];
      const items = (renovationData[cat] && renovationData[cat].items) || [];
      for (let j = 0; j < items.length; j++) {
        if (items[j].id === itemId) return cat;
      }
    }
    return '';
  },

  // 更新总价计算
  updateTotals() {
    console.log('[updateTotals] start');
    const baseTotal = this.calculateCustomBaseTotal();
    
    // 计算各项费用
    const designFee = baseTotal * PERCENT_FEE_RATE;
    const transportFee = baseTotal * PERCENT_FEE_RATE;
    const managementFee = baseTotal * PERCENT_FEE_RATE;
    
    // 楼梯房上楼费只有在选中时才计算
    const stairsFee = this.data.selectedItems['stairs_fee'] ? baseTotal * STAIRS_FEE_RATE : 0;
    
    const fees = {
      designFee: designFee,
      transportFee: transportFee,
      managementFee: managementFee,
      stairsFee: stairsFee,
      total: designFee + transportFee + managementFee + stairsFee,
      designFeeText: designFee.toFixed(2),
      transportFeeText: transportFee.toFixed(2),
      managementFeeText: managementFee.toFixed(2),
      stairsFeeText: stairsFee.toFixed(2)
    };
    
    const finalTotal = baseTotal + fees.total;
    const baseTotalText = baseTotal.toFixed(2);
    const finalTotalText = finalTotal.toFixed(2);
    
    console.log('[updateTotals] baseTotal=', baseTotal);
    console.log('[updateTotals] fees=', fees);
    console.log('[updateTotals] finalTotal=', finalTotal);
    this.setData({
      baseTotal: baseTotal,
      fees: fees,
      finalTotal: finalTotal,
      baseTotalText: baseTotalText,
      finalTotalText: finalTotalText
    });
  },

  // 计算按钮点击
  // 计算按钮点击（已移除按钮，不再使用）

  // 自定义基础总价计算（支持手动价格和数量）
  calculateCustomBaseTotal() {
    let total = 0;
    const selectedItems = this.data.selectedItems;
    const quantities = this.data.quantities;
    const manualPrices = this.data.manualPrices;
    console.log('[calculateCustomBaseTotal] selected keys=', Object.keys(selectedItems || {}));
    
    Object.keys(selectedItems).forEach(itemId => {
      if (selectedItems[itemId]) {
        const item = selectedItems[itemId].item;
        const area = selectedItems[itemId].area || 1;
        const quantity = quantities[itemId] || 1;
        
        let itemTotal = 0;
        
        // 特殊处理垃圾外运：4平方起步260元，每增1平方65元
        if (itemId === 'garbage_transport') {
          const baseArea = 4; // 起步4平方
          const basePrice = 260; // 起步价
          const additionalPrice = 65; // 每增1平方价格
          
          if (area <= baseArea) {
            itemTotal = basePrice;
          } else {
            const additionalArea = area - baseArea;
            itemTotal = basePrice + (additionalArea * additionalPrice);
          }
        } else if (item.price === 0) {
          // 面议项目，使用手动输入的价格
          itemTotal = manualPrices[itemId] || 0;
        } else if (item.unit === '每平') {
          // 按面积计算
          itemTotal = item.price * area;
        } else if (item.unit === '米') {
          // 按米数计算
          itemTotal = item.price * quantity;
        } else {
          // 按数量计算（个、套、单扇等）
          itemTotal = item.price * quantity;
        }
        
        total += itemTotal;
      }
    });
    console.log('[calculateCustomBaseTotal] total=', total);
    
    return total;
  }
});