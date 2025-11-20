const { renovationData } = require('../../utils/data.js');
const { calculateBaseTotal, calculatePercentageFees, calculateFinalTotal } = require('../../utils/calculate.js');

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
          area: 1, // 默认面积为1
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
      manualPrices: manualPrices
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
    quantities[itemId] = quantity;
    
    this.setData({
      quantities: quantities
    });
    
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
    const checked = e.detail.value;
    
    let selectedItems = this.data.selectedItems;
    let quantities = this.data.quantities;
    let manualPrices = this.data.manualPrices;
    
    if (checked) {
      // 选中项目
      selectedItems[item.id] = {
        item: item,
        area: 1, // 默认面积1
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
    
    this.updateTotals();
  },

  // 面积输入事件
  onAreaInput(e) {
    const itemId = e.currentTarget.dataset.itemId;
    const area = parseFloat(e.detail.value) || 0;
    
    let selectedItems = this.data.selectedItems;
    
    if (selectedItems[itemId]) {
      selectedItems[itemId].area = area;
      
      this.setData({
        selectedItems: selectedItems
      });
      
      this.updateTotals();
    }
  },

  // 更新总价计算
  updateTotals() {
    const baseTotal = this.calculateCustomBaseTotal();
    
    // 计算各项费用
    const designFee = baseTotal * 0.02; // 设计费 2%
    const transportFee = baseTotal * 0.02; // 运输费 2%
    const managementFee = baseTotal * 0.02; // 管理费 2%
    
    // 楼梯房上楼费只有在选中时才计算
    const stairsFee = this.data.selectedItems['stairs_fee'] ? baseTotal * 0.02 : 0;
    
    const fees = {
      designFee: designFee,
      transportFee: transportFee,
      managementFee: managementFee,
      stairsFee: stairsFee,
      total: designFee + transportFee + managementFee + stairsFee
    };
    
    const finalTotal = baseTotal + fees.total;
    
    this.setData({
      baseTotal: baseTotal,
      fees: fees,
      finalTotal: finalTotal
    });
  },

  // 自定义基础总价计算（支持手动价格和数量）
  calculateCustomBaseTotal() {
    let total = 0;
    const selectedItems = this.data.selectedItems;
    const quantities = this.data.quantities;
    const manualPrices = this.data.manualPrices;
    
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
    
    return total;
  }
});