const req = require('../../utils/request.js')
const request = typeof req === 'function' ? req : req.request
const { STAIRS_FEE_RATE, PERCENT_FEE_RATE } = require('../../utils/constants.js')

Page({
  data: {
    sections: [],
    expandedSections: {},
    sectionSelectAll: {},
    selectedItems: {},
    manualPrices: {},
    quantities: {},
    prevQuantities: {},
    stairsEnabled: false,
    baseTotal: 0,
    fees: { designFee: 0, transportFee: 0, managementFee: 0, stairsFee: 0 },
    finalTotal: 0,
    baseTotalText: '0.00',
    finalTotalText: '0.00',
    categorySelectAll: { demolition: true, wall: true, ceiling: true, floor: true, comprehensive: true }
  },

  onLoad(query) {
    const qid = query && query.id ? query.id : ''
    let tid = qid
    if (!tid) {
      try { tid = wx.getStorageSync('current_template_id') || '' } catch (e) {}
    }
    this.setData({ templateId: tid })
    this.fetchTemplate()
  },

  fetchTemplate() {
    const id = this.data.templateId
    const url = id ? `/api/templates/${id}/detail` : '/api/templates/default'
    request({ url, method: 'GET', success: (r) => {
      const tpl = (r.data && r.data.data) || { groups: [] }
      const sections = (tpl.groups || []).map(g => ({
        id: g.id,
        name: (g.group && g.group.name) || '',
        slug: (g.group && g.group.slug) || '',
        items: (g.items || []).map(it => {
          const ii = it.item || {}
          return { id: ii.id, name: ii.name, unit: ii.unit || '', price: typeof ii.price === 'number' ? ii.price : 0, slug: ii.slug, minQuantity: typeof ii.minQuantity === 'number' ? ii.minQuantity : 1 }
        })
      }))
      const expandedSections = {}
      const sectionSelectAll = {}
      sections.forEach(s => { expandedSections[s.id] = true; sectionSelectAll[s.id] = true })
      this.setData({ sections, expandedSections, sectionSelectAll })
      this.initializeDefaultSelection()
    } })
  },

  initializeDefaultSelection() {
    const selectedItems = {}
    const quantities = {}
    const manualPrices = {}
    ;(this.data.sections || []).forEach(section => {
      (section.items || []).forEach(item => {
        selectedItems[item.id] = { item, area: 1, areaText: '1.00', checked: true }
        quantities[item.id] = item.minQuantity || 1
        if (item.price === 0 || item.unit === '面议') manualPrices[item.id] = 0
      })
    })
    this.setData({ selectedItems, quantities, manualPrices })
    this.updateTotals()
  },

  getItemsBySectionId(sectionId) {
    const s = (this.data.sections || []).find(x => x.id === sectionId)
    return (s && s.items) || []
  },

  toggleSection(e) {
    const id = e.currentTarget.dataset.sectionId
    const expanded = { ...this.data.expandedSections }
    expanded[id] = !expanded[id]
    this.setData({ expandedSections: expanded })
  },

  onQuantityInput(e) {
    const itemId = e.currentTarget.dataset.itemId
    const quantity = parseFloat(e.detail.value) || 0
    const quantities = { ...this.data.quantities }
    const selectedItems = { ...this.data.selectedItems }
    quantities[itemId] = quantity
    if (quantity <= 0 && selectedItems[itemId]) delete selectedItems[itemId]
    this.setData({ quantities, selectedItems })
    const sectionId = this.getSectionIdByItemId(itemId)
    if (sectionId) {
      const sectionSelectAll = { ...this.data.sectionSelectAll }
      sectionSelectAll[sectionId] = this.computeSectionAllSelected(sectionId, this.data.selectedItems)
      this.setData({ sectionSelectAll })
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
      if ((item.price === 0 || item.unit === '面议') && !manualPrices[item.id]) manualPrices[item.id] = 0
    } else {
      delete selectedItems[item.id]
    }
    this.setData({ selectedItems, quantities, manualPrices })
    const sectionId = this.getSectionIdByItemId(item.id)
    if (sectionId) {
      const sectionSelectAll = { ...this.data.sectionSelectAll }
      sectionSelectAll[sectionId] = this.computeSectionAllSelected(sectionId, this.data.selectedItems)
      this.setData({ sectionSelectAll })
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
        const sectionId = this.getSectionIdByItemId(itemId)
        delete selectedItems[itemId]
        const sectionSelectAll = { ...this.data.sectionSelectAll }
        if (sectionId) sectionSelectAll[sectionId] = false
        this.setData({ selectedItems, sectionSelectAll })
      } else {
        selectedItems[itemId].area = num
        selectedItems[itemId].areaText = num.toFixed(2)
        this.setData({ selectedItems })
      }
      const sectionId = this.getSectionIdByItemId(itemId)
      if (sectionId) {
        const sectionSelectAll = { ...this.data.sectionSelectAll }
        sectionSelectAll[sectionId] = this.computeSectionAllSelected(sectionId, this.data.selectedItems)
        this.setData({ sectionSelectAll })
      }
      this.updateTotals()
    }
  },

  onAreaFocus(e) {},
  onQuantityFocus(e) {
    const itemId = e.currentTarget.dataset.itemId
    const quantities = { ...this.data.quantities }
    const prevQuantities = { ...this.data.prevQuantities }
    prevQuantities[itemId] = quantities[itemId]
    quantities[itemId] = ''
    this.setData({ quantities, prevQuantities })
  },
  onQuantityBlur(e) {
    const itemId = e.currentTarget.dataset.itemId
    const raw = String(e.detail.value || '')
    const prev = this.data.prevQuantities[itemId]
    const quantities = { ...this.data.quantities }
    const sel = this.data.selectedItems[itemId]
    const minQ = sel && sel.item && typeof sel.item.minQuantity === 'number' ? sel.item.minQuantity : 1
    if (raw === '') {
      quantities[itemId] = typeof prev === 'number' ? prev : (minQ || 1)
    } else {
      const num = parseFloat(raw)
      if (isNaN(num) || num < minQ) {
        quantities[itemId] = minQ
      } else {
        quantities[itemId] = num
      }
    }
    const prevQuantities = { ...this.data.prevQuantities }
    delete prevQuantities[itemId]
    this.setData({ quantities, prevQuantities })
    this.updateTotals()
  },
  onManualPriceFocus(e) {
    const itemId = e.currentTarget.dataset.itemId
    const manualPrices = { ...this.data.manualPrices }
    manualPrices[itemId] = ''
    this.setData({ manualPrices })
  },

  onSectionSelectAllChange(e) {
    const sectionId = e.currentTarget.dataset.sectionId
    const checked = Array.isArray(e.detail.value) && e.detail.value.length > 0
    const selectedItems = { ...this.data.selectedItems }
    const quantities = { ...this.data.quantities }
    const manualPrices = { ...this.data.manualPrices }
    const items = this.getItemsBySectionId(sectionId)
    if (checked) {
      items.forEach(item => {
        if (!selectedItems[item.id]) selectedItems[item.id] = { item, area: 1, areaText: '1.00', checked: true }
        if (item.unit === '米' || item.unit === '个' || item.unit === '套' || item.unit === '单扇') {
          if (!quantities[item.id]) quantities[item.id] = 1
        }
        if (item.price === 0 || item.unit === '面议') {
          if (!manualPrices[item.id]) manualPrices[item.id] = 0
        }
      })
    } else {
      items.forEach(item => { if (selectedItems[item.id]) delete selectedItems[item.id] })
    }
    const sectionSelectAll = { ...this.data.sectionSelectAll, [sectionId]: checked }
    this.setData({ selectedItems, quantities, manualPrices, sectionSelectAll })
    this.updateTotals()
  },

  noop() {},

  onStairsRadioChange(e) {
    const v = String(e.detail.value || '')
    const stairsEnabled = v === 'on'
    this.setData({ stairsEnabled })
    this.updateTotals()
  },

  computeSectionAllSelected(sectionId, selectedItems) {
    const items = this.getItemsBySectionId(sectionId)
    return items.every(it => !!selectedItems[it.id])
  },

  getSectionIdByItemId(itemId) {
    const secs = this.data.sections || []
    for (let i = 0; i < secs.length; i++) {
      const items = secs[i].items || []
      for (let j = 0; j < items.length; j++) {
        if (items[j].id === itemId) return secs[i].id
      }
    }
    return ''
  },

  updateTotals() {
    const baseTotal = this.calculateCustomBaseTotal()
    const designFee = baseTotal * PERCENT_FEE_RATE
    const transportFee = baseTotal * PERCENT_FEE_RATE
    const managementFee = baseTotal * PERCENT_FEE_RATE
    const stairsFee = this.data.stairsEnabled ? baseTotal * STAIRS_FEE_RATE : 0
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
        } else if (item.price === 0 || item.unit === '面议') {
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