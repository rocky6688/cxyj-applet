const req = require('../../utils/request.js')
const request = typeof req === 'function' ? req : req.request

Page({
  data: { id: '', tpl: { groups: [] }, newGroupName: '', newItemNames: {}, renameGroupMap: {}, renameItemMap: {}, expanded: {}, itemEdit: {}, units: ['每平','项','米','套','个','方车','面议'], unitMap: {}, priceMap: {}, minQtyMap: {}, renameGroupDialog: false, renameGroupId: '', renameGroupValue: '', itemRenameDialog: false, itemRenameId: '', itemRenameValue: '' },
  onLoad(query) { this.setData({ id: query.id }); this.fetchDetail() },
  fetchDetail() {
    request({ url: `/api/templates/${this.data.id}/detail`, method: 'GET', success: (r) => {
      const tpl = (r.data && r.data.data) || { groups: [] }
      const groups = Array.isArray(tpl.groups) ? tpl.groups.map(g => ({
        ...g,
        items: Array.isArray(g.items) ? [...g.items].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)) : []
      })) : []
      const normalized = { ...tpl, groups }
      const expanded = {}
      const unitMap = {}
      const priceMap = {}
      const minQtyMap = {}
      ;(normalized.groups || []).forEach(g => {
        expanded[g.id] = true
        ;(g.items || []).forEach(it => {
          unitMap[it.id] = it.item && it.item.unit ? it.item.unit : ''
          priceMap[it.id] = typeof (it.item && it.item.price) === 'number' ? it.item.price : 0
          minQtyMap[it.id] = typeof (it.item && it.item.minQuantity) === 'number' ? it.item.minQuantity : 1
        })
      })
      this.setData({ tpl: normalized, expanded, unitMap, priceMap, minQtyMap })
    } })
  },
  openItemRenameDialog(e) {
    const id = e.currentTarget.dataset.id
    const tg = (this.data.tpl.groups || []).find(g => (g.items || []).some(i => i.id === id))
    const it = tg ? (tg.items || []).find(i => i.id === id) : null
    const currentName = it && it.item ? it.item.name : ''
    this.setData({ itemRenameDialog: true, itemRenameId: id, itemRenameValue: currentName })
  },
  onItemRenameInputDialog(e) {
    this.setData({ itemRenameValue: e.detail.value })
  },
  cancelItemRename() {
    this.setData({ itemRenameDialog: false, itemRenameId: '', itemRenameValue: '' })
  },
  confirmItemRename() {
    const id = this.data.itemRenameId
    const name = this.data.itemRenameValue
    if (!name) return wx.showToast({ title: '请输入新名称', icon: 'none' })
    request({ url: `/api/templates/items/${id}`, method: 'PUT', data: { name }, success: () => { wx.showToast({ title: '已重命名', icon: 'success' }); this.setData({ itemRenameDialog: false, itemRenameId: '', itemRenameValue: '' }); this.fetchDetail() } })
  },
  toggleSection(e) {
    const id = e.currentTarget.dataset.id
    const expanded = { ...this.data.expanded }
    expanded[id] = !expanded[id]
    this.setData({ expanded })
  },
  openGroupRenameDialog(e) {
    const id = e.currentTarget.dataset.id
    const g = (this.data.tpl.groups || []).find(x => x.id === id)
    const currentName = g && g.group ? g.group.name : ''
    this.setData({ renameGroupDialog: true, renameGroupId: id, renameGroupValue: currentName })
  },
  onRenameGroupInputDialog(e) {
    this.setData({ renameGroupValue: e.detail.value })
  },
  cancelRenameGroup() {
    this.setData({ renameGroupDialog: false, renameGroupId: '', renameGroupValue: '' })
  },
  confirmRenameGroup() {
    const id = this.data.renameGroupId
    const name = this.data.renameGroupValue
    if (!name) return wx.showToast({ title: '请输入新名称', icon: 'none' })
    request({ url: `/api/templates/groups/${id}`, method: 'PUT', data: { name }, success: () => { wx.showToast({ title: '已重命名', icon: 'success' }); this.setData({ renameGroupDialog: false, renameGroupId: '', renameGroupValue: '' }); this.fetchDetail() } })
  },
  noop() {},
  onGroupName(e) { this.setData({ newGroupName: e.detail.value }) },
  addGroup() {
    if (!this.data.newGroupName) return wx.showToast({ title: '请输入大类名', icon: 'none' })
    request({ url: `/api/templates/${this.data.id}/groups`, method: 'POST', data: { name: this.data.newGroupName }, success: () => { wx.showToast({ title: '已新增', icon: 'success' }); this.setData({ newGroupName: '' }); this.fetchDetail() } })
  },
  onItemName(e) {
    const tgId = e.currentTarget.dataset.tgid
    this.setData({ newItemNames: { ...this.data.newItemNames, [tgId]: e.detail.value } })
  },
  addItem(e) {
    const tgId = e.currentTarget.dataset.tgid
    const name = this.data.newItemNames[tgId]
    if (!name) return wx.showToast({ title: '请输入子类名', icon: 'none' })
    request({ url: `/api/templates/${this.data.id}/items`, method: 'POST', data: { templateGroupId: tgId, name }, success: () => { wx.showToast({ title: '已新增', icon: 'success' }); const nn = { ...this.data.newItemNames }; delete nn[tgId]; this.setData({ newItemNames: nn }); this.fetchDetail() } })
  },
  removeGroup(e) {
    const id = e.currentTarget.dataset.id
    request({ url: `/api/templates/groups/${id}`, method: 'DELETE', success: () => { wx.showToast({ title: '已删除', icon: 'success' }); this.fetchDetail() } })
  },
  removeItem(e) {
    const id = e.currentTarget.dataset.id
    request({ url: `/api/templates/items/${id}`, method: 'DELETE', success: () => { wx.showToast({ title: '已删除', icon: 'success' }); this.fetchDetail() } })
  },
  onRenameGroupInput(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ renameGroupMap: { ...this.data.renameGroupMap, [id]: e.detail.value } })
  },
  renameGroup(e) {
    const id = e.currentTarget.dataset.id
    const name = this.data.renameGroupMap[id]
    if (!name) return wx.showToast({ title: '请输入新名称', icon: 'none' })
    request({ url: `/api/templates/groups/${id}`, method: 'PUT', data: { name }, success: () => { wx.showToast({ title: '已重命名', icon: 'success' }); this.fetchDetail() } })
  },
  onRenameItemInput(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ renameItemMap: { ...this.data.renameItemMap, [id]: e.detail.value } })
  },
  renameItem(e) {
    const id = e.currentTarget.dataset.id
    const name = this.data.renameItemMap[id]
    if (!name) return wx.showToast({ title: '请输入新名称', icon: 'none' })
    request({ url: `/api/templates/items/${id}`, method: 'PUT', data: { name }, success: () => { wx.showToast({ title: '已重命名', icon: 'success' }); this.fetchDetail() } })
  },
  toggleItemEdit(e) {
    const id = e.currentTarget.dataset.id
    const itemEdit = { ...this.data.itemEdit }
    itemEdit[id] = !itemEdit[id]
    this.setData({ itemEdit })
  },
  onUnitChange(e) {
    const id = e.currentTarget.dataset.id
    const idx = e.detail.value
    const unit = this.data.units[idx]
    const unitMap = { ...this.data.unitMap, [id]: unit }
    this.setData({ unitMap })
  },
  onPriceInput(e) {
    const id = e.currentTarget.dataset.id
    const val = e.detail.value
    const price = Number(val || 0)
    const priceMap = { ...this.data.priceMap, [id]: price }
    this.setData({ priceMap })
  },
  onMinQtyInput(e) {
    const id = e.currentTarget.dataset.id
    const raw = String(e.detail.value || '')
    const cleaned = raw.replace(/[^0-9]/g, '')
    const minQtyMap = { ...this.data.minQtyMap }
    if (cleaned === '') {
      minQtyMap[id] = ''
    } else {
      minQtyMap[id] = Number(cleaned)
    }
    this.setData({ minQtyMap })
  },
  saveMeta(e) {
    const id = e.currentTarget.dataset.id
    const unit = this.data.unitMap[id]
    const price = this.data.priceMap[id]
    const raw = this.data.minQtyMap[id]
    const n = Number(raw)
    const minQuantity = !isNaN(n) && n > 0 ? n : 1
    request({ url: `/api/templates/items/${id}/meta`, method: 'PUT', data: { unit, price, minQuantity }, success: () => { wx.showToast({ title: '已保存', icon: 'success' }); this.fetchDetail() } })
  },
  moveGroupUp(e) {
    this.moveGroup(e.currentTarget.dataset.id, -1)
  },
  moveGroupDown(e) {
    this.moveGroup(e.currentTarget.dataset.id, 1)
  },
  moveGroup(id, delta) {
    const groups = [...this.data.tpl.groups]
    const index = groups.findIndex(g => g.id === id)
    if (index < 0) return
    const target = index + delta
    if (target < 0 || target >= groups.length) return
    const tmp = groups[index]
    groups[index] = groups[target]
    groups[target] = tmp
    const payload = groups.map((g, i) => ({ id: g.id, orderIndex: i }))
    request({ url: `/api/templates/${this.data.id}/groups/reorder`, method: 'POST', data: payload, success: () => { this.fetchDetail() } })
  },
  moveItemUp(e) {
    this.moveItem(e.currentTarget.dataset.id, -1)
  },
  moveItemDown(e) {
    this.moveItem(e.currentTarget.dataset.id, 1)
  },
  moveItem(itemId, delta) {
    const tg = this.data.tpl.groups.find(g => (g.items || []).some(i => i.id === itemId))
    if (!tg) return
    const items = [...tg.items]
    const index = items.findIndex(i => i.id === itemId)
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const tmp = items[index]
    items[index] = items[target]
    items[target] = tmp
    const payload = items.map((it, i) => ({ id: it.id, orderIndex: i }))
    request({ url: `/api/templates/${this.data.id}/items/reorder`, method: 'POST', data: payload, success: () => { this.fetchDetail() } })
  }
})