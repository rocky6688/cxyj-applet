const req = require('../../utils/request.js')
const request = typeof req === 'function' ? req : req.request
const { STAIRS_FEE_RATE, PERCENT_FEE_RATE } = require('../../utils/constants.js')

Page({
  data: {
    demolitionItems: [],
    wallItems: [],
    ceilingItems: [],
    floorItems: [],
    comprehensiveItems: [],
    expandedCategories: { demolition: true, wall: true, ceiling: true, floor: true, comprehensive: true },
    selectedItems: {},
    manualPrices: {},
    quantities: {},
    baseTotal: 0,
    fees: { designFee: 0, transportFee: 0, managementFee: 0, stairsFee: 0 },
    finalTotal: 0,
    baseTotalText: '0.00',
    finalTotalText: '0.00',
    categorySelectAll: { demolition: true, wall: true, ceiling: true, floor: true, comprehensive: true }
  },

  onLoad(query) {
    this.setData({ templateId: query && query.id ? query.id : '' })
    this.fetchTemplate()
  },

  fetchTemplate() {
    const id = this.data.templateId
    const url = id ? `/api/templates/${id}/detail` : '/api/templates/default'
    request({ url, method: 'GET', success: (r) => {
      const tpl = (r.data && r.data.data) || { groups: [] }
      const byCat = { demolition: [], wall: [], ceiling: [], floor: [], comprehensive: [] }
      ;(tpl.groups || []).forEach(g => {
        const cat = g && g.group && g.group.slug
        const items = (g.items || []).map(it => {
          const ii = it.item || {}
          return { id: ii.id, name: ii.name, unit: ii.unit || '', price: typeof ii.price === 'number' ? ii.price : 0, category: cat, slug: ii.slug }
        })
        if (byCat[cat]) byCat[cat] = byCat[cat].concat(items)
      })
      this.setData({
        demolitionItems: byCat.demolition,
        wallItems: byCat.wall,
        ceilingItems: byCat.ceiling,
        floorItems: byCat.floor,
        comprehensiveItems: byCat.comprehensive
      })
      this.initializeDefaultSelection()
    } })
  },

  initializeDefaultSelection() {
    const selectedItems = {}
    const quantities = {}
    const manualPrices = {}
    const cats = ['demolition','wall','ceiling','floor','comprehensive']
    cats.forEach(category => {
      const items = this.getItemsByCategory(category)
      items.forEach(item => {
        selectedItems[item.id] = { item, area: 1, areaText: '1.00', checked: true }
        quantities[item.id] = 1
        if (item.price === 0) manualPrices[item.id] = 0
      })
    })
    this.setData({ selectedItems, quantities, manualPrices })
    this.updateTotals()
  },

  getItemsByCategory(category) {
    if (category === 'demolition') return this.data.demolitionItems || []
    if (category === 'wall') return this.data.wallItems || []
    if (category === 'ceiling') return this.data.ceilingItems || []
    if (category === 'floor') return this.data.floorItems || []
    if (category === 'comprehensive') return this.data.comprehensiveItems || []
    return []
  },

  toggleCategory(e) {
    const category = e.currentTarget.dataset.category
    const expanded = { ...this.data.expandedCategories }
    expanded[category] = !expanded[category]
    this.setData({ expandedCategories: expanded })
  },

  onQuantityInput(e) {
    const itemId = e.currentTarget.dataset.itemId
    const quantity = parseFloat(e.detail.value) || 0
    const quantities = { ...this.data.quantities }
    const selectedItems = { ...this.data.selectedItems }
    quantities[itemId] = quantity
    if (quantity <= 0 && selectedItems[itemId]) delete selectedItems[itemId]
    this.setData({ quantities, selectedItems })
    const category = this.getCategoryByItemId(itemId)
    if (category) {
      const categorySelectAll = { ...this.data.categorySelectAll }
      categorySelectAll[category] = this.computeCategoryAllSelected(category, this.data.selectedItems)
      this.setData({ categorySelectAll })
    }
    this.updateTotals()
  },

  onManualPriceInput(e) {
    const itemId = e.currentTarget.dataset.itemId
    const price = parseFloat(e.detail.value) || 0
    const manualPrices = { ...this.data.manualPrices }
    manualPrices[itemId] = price
    this.setData({ manualPrices })
    this.updateTotals()
  },

  onItemSelect(e) {
    const item = e.currentTarget.dataset.item
    const val = e.detail.value
    const isChecked = Array.isArray(val) ? (val.indexOf(item.id) >= 0 || val.length > 0) : (typeof val === 'string' ? val.length > 0 : !!val)
    const selectedItems = { ...this.data.selectedItems }
    const quantities = { ...this.data.quantities }
    const manualPrices = { ...this.data.manualPrices }
    if (isChecked) {
      selectedItems[item.id] = { item, area: 1, areaText: '1.00', checked: true }
      if (!quantities[item.id]) quantities[item.id] = 1
      if (item.price === 0 && !manualPrices[item.id]) manualPrices[item.id] = 0
    } else {
      delete selectedItems[item.id]
    }
    this.setData({ selectedItems, quantities, manualPrices })
    const category = item.category
    if (category) {
      const categorySelectAll = { ...this.data.categorySelectAll }
      categorySelectAll[category] = this.computeCategoryAllSelected(category, this.data.selectedItems)
      this.setData({ categorySelectAll })
    }
    this.updateTotals()
  },

  onAreaInput(e) {
    const itemId = e.currentTarget.dataset.itemId
    const raw = String(e.detail.value || '')
    let cleaned = raw.replace(/[^0-9.]/g, '')
    const firstDot = cleaned.indexOf('.')
    if (firstDot >= 0) {
      const before = cleaned.slice(0, firstDot)
      const afterRaw = cleaned.slice(firstDot + 1).replace(/\./g, '')
      const after = afterRaw.slice(0, 2)
      cleaned = before + '.' + after
    }
    if (cleaned.startsWith('.')) cleaned = '0' + cleaned
    const num = parseFloat(cleaned)
    const area = isNaN(num) ? 0 : num
    const areaText = cleaned
    const selectedItems = { ...this.data.selectedItems }
    if (selectedItems[itemId]) {
      selectedItems[itemId].area = area
      selectedItems[itemId].areaText = areaText
      this.setData({ selectedItems })
      this.updateTotals()
    }
  },

  onAreaBlur(e) {
    const itemId = e.currentTarget.dataset.itemId
    const selectedItems = { ...this.data.selectedItems }
    if (selectedItems[itemId]) {
      const area = parseFloat(selectedItems[itemId].area)
      const num = isNaN(area) ? 0 : area
      if (num === 0) {
        const category = selectedItems[itemId].item && selectedItems[itemId].item.category
        delete selectedItems[itemId]
        const categorySelectAll = { ...this.data.categorySelectAll }
        if (category) categorySelectAll[category] = false
        this.setData({ selectedItems, categorySelectAll })
      } else {
        selectedItems[itemId].area = num
        selectedItems[itemId].areaText = num.toFixed(2)
        this.setData({ selectedItems })
      }
      const category = this.getCategoryByItemId(itemId)
      if (category) {
        const categorySelectAll = { ...this.data.categorySelectAll }
        categorySelectAll[category] = this.computeCategoryAllSelected(category, this.data.selectedItems)
        this.setData({ categorySelectAll })
      }
      this.updateTotals()
    }
  },

  onAreaFocus(e) {},
  onQuantityFocus(e) {
    const itemId = e.currentTarget.dataset.itemId
    const quantities = { ...this.data.quantities }
    quantities[itemId] = ''
    this.setData({ quantities })
  },
  onManualPriceFocus(e) {
    const itemId = e.currentTarget.dataset.itemId
    const manualPrices = { ...this.data.manualPrices }
    manualPrices[itemId] = ''
    this.setData({ manualPrices })
  },

  onCategorySelectAllChange(e) {
    const category = e.currentTarget.dataset.category
    const checked = Array.isArray(e.detail.value) && e.detail.value.length > 0
    const selectedItems = { ...this.data.selectedItems }
    const quantities = { ...this.data.quantities }
    const manualPrices = { ...this.data.manualPrices }
    const items = this.getItemsByCategory(category)
    if (checked) {
      items.forEach(item => {
        if (!selectedItems[item.id]) selectedItems[item.id] = { item, area: 1, areaText: '1.00', checked: true }
        if (item.unit === '米' || item.unit === '个' || item.unit === '套' || item.unit === '单扇') {
          if (!quantities[item.id]) quantities[item.id] = 1
        }
        if (item.price === 0) {
          if (!manualPrices[item.id]) manualPrices[item.id] = 0
        }
      })
    } else {
      items.forEach(item => { if (selectedItems[item.id]) delete selectedItems[item.id] })
    }
    const categorySelectAll = { ...this.data.categorySelectAll, [category]: checked }
    this.setData({ selectedItems, quantities, manualPrices, categorySelectAll })
    this.updateTotals()
  },

  noop() {},

  computeCategoryAllSelected(category, selectedItems) {
    const items = this.getItemsByCategory(category)
    return items.every(it => !!selectedItems[it.id])
  },

  getCategoryByItemId(itemId) {
    const cats = ['demolition','wall','ceiling','floor','comprehensive']
    for (let i = 0; i < cats.length; i++) {
      const items = this.getItemsByCategory(cats[i])
      for (let j = 0; j < items.length; j++) {
        if (items[j].id === itemId) return cats[i]
      }
    }
    return ''
  },

  updateTotals() {
    const baseTotal = this.calculateCustomBaseTotal()
    const designFee = baseTotal * PERCENT_FEE_RATE
    const transportFee = baseTotal * PERCENT_FEE_RATE
    const managementFee = baseTotal * PERCENT_FEE_RATE
    const stairsFee = this.data.selectedItems['stairs_fee'] ? baseTotal * STAIRS_FEE_RATE : 0
    const fees = {
      designFee,
      transportFee,
      managementFee,
      stairsFee,
      total: designFee + transportFee + managementFee + stairsFee,
      designFeeText: designFee.toFixed(2),
      transportFeeText: transportFee.toFixed(2),
      managementFeeText: managementFee.toFixed(2),
      stairsFeeText: stairsFee.toFixed(2)
    }
    const finalTotal = baseTotal + fees.total
    const baseTotalText = baseTotal.toFixed(2)
    const finalTotalText = finalTotal.toFixed(2)
    this.setData({ baseTotal, fees, finalTotal, baseTotalText, finalTotalText })
  },

  calculateCustomBaseTotal() {
    let total = 0
    const selectedItems = this.data.selectedItems
    const quantities = this.data.quantities
    const manualPrices = this.data.manualPrices
    Object.keys(selectedItems).forEach(itemId => {
      const sel = selectedItems[itemId]
      if (sel) {
        const item = sel.item
        const area = sel.area || 1
        const quantity = quantities[itemId] || 1
        let itemTotal = 0
        if ((item.slug || '') === 'garbage_transport') {
          const baseArea = 4
          const basePrice = 260
          const additionalPrice = 65
          if (area <= baseArea) itemTotal = basePrice
          else itemTotal = basePrice + ((area - baseArea) * additionalPrice)
        } else if (item.price === 0) {
          itemTotal = manualPrices[itemId] || 0
        } else if (item.unit === '每平') {
          itemTotal = item.price * area
        } else if (item.unit === '米') {
          itemTotal = item.price * quantity
        } else {
          itemTotal = item.price * quantity
        }
        total += itemTotal
      }
    })
    return total
  }
})