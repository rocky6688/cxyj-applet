const { DBQUERY_FUNCTION } = require('../../utils/config.js')

Page({
  data: {
    pageTitle: '新增门店',
    docId: '',
    storeUniqueId: '',
    name: '',
    code: '',
    phone: '',
    address: '',
    statusOptions: ['ACTIVE','INACTIVE'],
    statusIndex: 0,
    showManagerPanel: true,
    users: [],
    managerSelected: [],
    managerSelectedMap: {}
  },
  onLoad(options) {
    const id = options && (options.id || options._id)
    this.fetchUsers()
    if (id) {
      this.setData({ docId: id })
      this.setData({ pageTitle: '编辑门店' })
      try { wx.setNavigationBarTitle({ title: '编辑门店' }) } catch (e) {}
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'stores', docId: id } })
        .then((res) => {
          const r = res && res.result ? res.result : {}
          const s = r && r.data ? r.data : null
          if (!s) return
          const idx = this.data.statusOptions.indexOf(s.status || 'ACTIVE')
          const sel = Array.isArray(s.managerIds) ? s.managerIds : []
          this.setData({
            name: s.name || '',
            code: s.code || '',
            phone: s.phone || '',
            address: s.address || '',
            statusIndex: idx >= 0 ? idx : 0,
            managerSelected: sel,
            managerSelectedMap: buildSelectedMap(sel),
            storeUniqueId: s.id || id
          })
        })
    } else {
      this.setData({ pageTitle: '新增门店' })
      try { wx.setNavigationBarTitle({ title: '新增门店' }) } catch (e) {}
    }
  },
  onNameInput(e) { const v = String(e.detail.value || '').slice(0,20); this.setData({ name: v }) },
  onCodeInput(e) { this.setData({ code: e.detail.value }) },
  onPhoneInput(e) { const digits = String(e.detail.value || '').replace(/\D/g,'').slice(0,11); this.setData({ phone: digits }) },
  onAddressInput(e) { const v = String(e.detail.value || '').slice(0,40); this.setData({ address: v }) },
  onStatusChange(e) { const i = Number(e.detail.value); this.setData({ statusIndex: i }) },
  toggleManagerPanel() { this.setData({ showManagerPanel: !this.data.showManagerPanel }) },
  fetchUsers() {
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'users', field: { _id: true, id: true, username: true, nickName: true, role: true }, limit: 200 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const list = (r && r.data) || []
        const roleMap = { ADMIN: '管理员', STAFF: '员工', USER: '用户', MANAGER: '经理' }
        const mapped = list.map((it) => ({ ...it, uid: it.id || it._id, roleLabel: roleMap[it.role] || it.role }))
        this.setData({ users: mapped })
      })
  },
  onManagerChange(e) {
    const arr = Array.isArray(e.detail.value) ? e.detail.value : []
    this.setData({ managerSelected: arr, managerSelectedMap: buildSelectedMap(arr) })
  },
  submit() {
    if (!this.data.name) return wx.showToast({ title: '请输入门店名称', icon: 'none' })
    if (this.data.name.length > 20) return wx.showToast({ title: '门店名称最多20字符', icon: 'none' })
    if (this.data.address && this.data.address.length > 40) return wx.showToast({ title: '地址最多40字符', icon: 'none' })
    if (this.data.phone && !/^1[3-9]\d{9}$/.test(this.data.phone)) return wx.showToast({ title: '请输入正确手机号', icon: 'none' })
    const status = this.data.statusOptions[this.data.statusIndex]
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
    if (this.data.docId) {
      const data = { name: this.data.name, code: this.data.code, phone: this.data.phone, address: this.data.address, status, managerIds: this.data.managerSelected, updatedAt: nowStr }
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'update', collection: 'stores', docId: this.data.docId, data } })
        .then((res) => {
          const r = res && res.result ? res.result : {}
          if (r && !r.error) {
            return syncStoreManagers(this.data.storeUniqueId || this.data.docId, this.data.managerSelected).then(() => {
              wx.showToast({ title: '已保存', icon: 'success' })
              setTimeout(() => { wx.navigateBack() }, 600)
            })
          } else { const msg = (r && r.message) || '保存失败'; wx.showToast({ title: msg, icon: 'none' }) }
        })
    } else {
      const storeIdStr = `store_${Date.now()}`
      const data = { id: storeIdStr, name: this.data.name, code: this.data.code, phone: this.data.phone, address: this.data.address, status, managerIds: this.data.managerSelected, createdAt: nowStr, updatedAt: nowStr }
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'add', collection: 'stores', data } })
        .then((res) => {
          const r = res && res.result ? res.result : {}
          if (r && !r.error) {
            return syncStoreManagers(storeIdStr, this.data.managerSelected).then(() => {
              wx.showToast({ title: '已新增', icon: 'success' })
              setTimeout(() => { wx.navigateBack() }, 600)
            })
          } else { const msg = (r && r.message) || '新增失败'; wx.showToast({ title: msg, icon: 'none' }) }
        })
    }
  }
})

function buildSelectedMap(arr) {
  const map = {}
  if (Array.isArray(arr)) {
    for (const id of arr) map[id] = true
  }
  return map
}

function syncStoreManagers(storeId, selectedIds) {
  const sel = Array.isArray(selectedIds) ? selectedIds : []
  const now = new Date()
  const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
  return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'storeId', op: 'eq', value: storeId }, { field: 'role', op: 'eq', value: 'MANAGER' }], limit: 200 } })
    .then((res) => {
      const r = res && res.result ? res.result : {}
      const list = (r && r.data) || []
      const existingByUser = {}
      for (const m of list) existingByUser[m.userId] = m
      const toAdd = sel.filter((uid) => !existingByUser[uid])
      const toRemove = list.filter((m) => sel.indexOf(m.userId) < 0)
      const addCalls = toAdd.map((uid) => wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'add', collection: 'storeMembers', data: { id: `sm_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, storeId, userId: uid, role: 'MANAGER', status: 'ACTIVE', createdAt: nowStr, updatedAt: nowStr } } }))
      const delCalls = toRemove.map((m) => wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'delete', collection: 'storeMembers', docId: m._id } }))
      return Promise.all([...addCalls, ...delCalls])
    })
}