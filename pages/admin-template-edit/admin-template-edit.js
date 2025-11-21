const { request } = require('../../utils/request.js')

Page({
  data: { id: '', tpl: { groups: [] }, newGroupName: '', newItemNames: {}, renameGroupMap: {}, renameItemMap: {}, expanded: {}, itemEdit: {} },
  onLoad(query) { this.setData({ id: query.id }); this.fetchDetail() },
  fetchDetail() {
    request({ url: `/api/templates/${this.data.id}/detail`, method: 'GET', success: (r) => { this.setData({ tpl: (r.data && r.data.data) || { groups: [] } }) } })
  },
  toggleSection(e) {
    const id = e.currentTarget.dataset.id
    const expanded = { ...this.data.expanded }
    expanded[id] = !expanded[id]
    this.setData({ expanded })
  },
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