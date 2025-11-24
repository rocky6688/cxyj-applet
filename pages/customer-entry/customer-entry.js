const { DBQUERY_FUNCTION } = require('../../utils/config.js')

Page({
  data: {
    role: 'USER',
    storeId: '',
    storeName: '',
    storeIndex: 0,
    storeNames: [],
    storeIds: [],
    entries: [],
    pageSize: 20,
    hasMore: true,
    isLoading: false,
    lastUpdatedAt: '',
    showForm: false,
    editingId: '',
    form: { community: '', name: '', contact: '', ownerStatus: '', followContent: '' },
    decorationTimeOptions: ['3个月内','3个月以上'],
    decorationTimeIndex: 0,
    houseTypeOptions: ['1居','2居','3居','4居及以上'],
    houseTypeIndex: 0,
    renovationTypeOptions: ['局改','全拆改'],
    renovationTypeIndex: 0,
    followStatusOptions: ['维护中','已经量房','已经进店','已经签约'],
    followStatusIndex: 0,
    decorationTimeFilterOptions: ['全部','3个月内','3个月以上'],
    decorationTimeFilterIndex: 0,
    houseTypeFilterOptions: ['全部','1居','2居','3居','4居及以上'],
    houseTypeFilterIndex: 0,
    renovationTypeFilterOptions: ['全部','局改','全拆改'],
    renovationTypeFilterIndex: 0,
    followStatusFilterOptions: ['全部','维护中','已经量房','已经进店','已经签约'],
    followStatusFilterIndex: 0,
    sortOptions: ['最新优先','最早优先'],
    sortIndex: 0,
    currentUserId: '',
    isManagerForCurrentStore: false
  },
  onShow() {
    const u = wx.getStorageSync('current_user') || {}
    const role = u.role || 'USER'
    if (role !== 'ADMIN' && role !== 'STAFF') {
      wx.showToast({ title: '仅员工/管理员可访问', icon: 'none' })
      setTimeout(() => wx.switchTab({ url: '/pages/my/my' }), 600)
      return
    }
    this.setData({ role, currentUserId: u.id || u._id || '' })
    const uid = u.id || u._id
    if (role === 'STAFF') this.initStaffStore(uid)
    else this.initAdminStores()
  },
  initStaffStore(userId) {
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: userId }, { field: 'role', op: 'eq', value: 'STAFF' }], limit: 1 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const m = (r && r.data && r.data[0]) || null
        const sid = (m && m.storeId) || ''
        if (!sid) return
        this.setData({ storeId: sid })
        return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'stores', where: [{ field: 'id', op: 'eq', value: sid }], limit: 1 } })
      })
      .then((res2) => {
        if (!res2) return
        const r2 = res2 && res2.result ? res2.result : {}
        const s = (r2 && r2.data && r2.data[0]) || null
        const name = (s && s.name) || ''
        this.setData({ storeName: name })
        return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: userId }, { field: 'role', op: 'eq', value: 'MANAGER' }, { field: 'storeId', op: 'eq', value: this.data.storeId }], limit: 1 } })
      })
      .then((res3) => {
        if (!res3) { this.setData({ isManagerForCurrentStore: false }); return }
        const r3 = res3 && res3.result ? res3.result : {}
        const mgr = (r3 && r3.data && r3.data[0]) || null
        this.setData({ isManagerForCurrentStore: !!mgr })
        this.resetAndFetch()
      })
  },
  /**
   * 管理员初始化门店列表（保留当前选择）🧭
   * 说明：返回列表页时，保持用户之前选择的门店，不重置为第一个
   */
  initAdminStores() {
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'stores', orderBy: [{ field: 'updatedAt', order: 'desc' }], limit: 200 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const list = (r && r.data) || []
        const ids = list.map((s) => s.id || s._id)
        const names = list.map((s) => s.name)
        // 保留之前选中的 storeId（如果仍在列表中）
        const prevId = this.data.storeId || ''
        const keepIndex = prevId ? ids.indexOf(prevId) : -1
        const useIndex = keepIndex >= 0 ? keepIndex : 0
        this.setData({
          storeIds: ids,
          storeNames: names,
          storeIndex: useIndex,
          storeId: ids[useIndex] || '',
          storeName: names[useIndex] || ''
        })
        this.resetAndFetch()
      })
  },
  onStoreChange(e) {
    const i = Number(e.detail.value)
    const sid = this.data.storeIds[i]
    // 记录用户选择，便于返回页时保持一致
    this.setData({ storeIndex: i, storeId: sid, storeName: this.data.storeNames[i] })
    this.resetAndFetch()
  },
  buildWhere(isLoadMore) {
    const base = [{ field: 'storeId', op: 'eq', value: this.data.storeId }]
    if (!(this.data.role === 'ADMIN' || this.data.isManagerForCurrentStore)) {
      base.push({ field: 'createdBy', op: 'eq', value: this.data.currentUserId })
    }
    const dt = this.data.decorationTimeFilterOptions[this.data.decorationTimeFilterIndex]
    const ht = this.data.houseTypeFilterOptions[this.data.houseTypeFilterIndex]
    const rt = this.data.renovationTypeFilterOptions[this.data.renovationTypeFilterIndex]
    const fs = this.data.followStatusFilterOptions[this.data.followStatusFilterIndex]
    if (dt !== '全部') base.push({ field: 'decorationTime', op: 'eq', value: dt })
    if (ht !== '全部') base.push({ field: 'houseType', op: 'eq', value: ht })
    if (rt !== '全部') base.push({ field: 'renovationType', op: 'eq', value: rt })
    if (fs !== '全部') base.push({ field: 'followStatus', op: 'eq', value: fs })
    const order = this.data.sortIndex === 0 ? 'desc' : 'asc'
    const orderBy = [{ field: 'updatedAt', order }]
    if (isLoadMore && this.data.lastUpdatedAt) {
      base.push({ field: 'updatedAt', op: order === 'desc' ? 'lt' : 'gt', value: this.data.lastUpdatedAt })
    }
    return { where: base, orderBy }
  },
  resetAndFetch() {
    this.setData({ entries: [], lastUpdatedAt: '', hasMore: true })
    this.fetchEntries(false)
  },
  fetchEntries(isLoadMore) {
    if (!this.data.storeId || this.data.isLoading || (!this.data.hasMore && isLoadMore)) return
    this.setData({ isLoading: true })
    const q = this.buildWhere(isLoadMore)
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'customerEntries', where: q.where, orderBy: q.orderBy, limit: this.data.pageSize } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const list = (r && r.data) || []
        const merged = isLoadMore ? this.data.entries.concat(list) : list
        const last = list[list.length - 1]
        this.setData({ entries: merged, lastUpdatedAt: last ? last.updatedAt : this.data.lastUpdatedAt, hasMore: list.length === this.data.pageSize })
      })
      .finally(() => { this.setData({ isLoading: false }) })
  },
  onReachBottom() { this.fetchEntries(true) },
  onDecorationTimeFilterChange(e) { this.setData({ decorationTimeFilterIndex: Number(e.detail.value) }); this.resetAndFetch() },
  onHouseTypeFilterChange(e) { this.setData({ houseTypeFilterIndex: Number(e.detail.value) }); this.resetAndFetch() },
  onRenovationTypeFilterChange(e) { this.setData({ renovationTypeFilterIndex: Number(e.detail.value) }); this.resetAndFetch() },
  onFollowStatusFilterChange(e) { this.setData({ followStatusFilterIndex: Number(e.detail.value) }); this.resetAndFetch() },
  onSortChange(e) { this.setData({ sortIndex: Number(e.detail.value) }); this.resetAndFetch() },
  openCreate() {
    if (!this.data.storeId) return wx.showToast({ title: '请选择门店', icon: 'none' })
    this.setData({ showForm: true, editingId: '', form: { community: '', name: '', contact: '', ownerStatus: '', followContent: '' }, decorationTimeIndex: 0, houseTypeIndex: 0, renovationTypeIndex: 0, followStatusIndex: 0 })
  },
  closeForm() { this.setData({ showForm: false, editingId: '' }) },
  startEdit(e) {
    const id = e.currentTarget.dataset.id
    const it = this.data.entries.find((x) => x._id === id)
    if (!it) return
    const decoI = Math.max(0, this.data.decorationTimeOptions.indexOf(it.decorationTime))
    const houseI = Math.max(0, this.data.houseTypeOptions.indexOf(it.houseType))
    const renoI = Math.max(0, this.data.renovationTypeOptions.indexOf(it.renovationType))
    const followI = Math.max(0, this.data.followStatusOptions.indexOf(it.followStatus))
    this.setData({ showForm: true, editingId: id, form: { community: it.community || '', name: it.name || '', contact: it.contact || '', ownerStatus: it.ownerStatus || '', followContent: it.followContent || '' }, decorationTimeIndex: decoI, houseTypeIndex: houseI, renovationTypeIndex: renoI, followStatusIndex: followI })
  },
  removeEntry(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({ title: '确认删除', content: '删除后不可恢复', success: (r) => {
      if (!r.confirm) return
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'delete', collection: 'customerEntries', docId: id } })
        .then(() => { wx.showToast({ title: '已删除', icon: 'success' }); this.fetchEntries() })
    } })
  },
  onCommunityInput(e) { this.setData({ 'form.community': String(e.detail.value || '').slice(0, 40) }) },
  onNameInput(e) { this.setData({ 'form.name': String(e.detail.value || '').slice(0, 20) }) },
  onContactInput(e) { this.setData({ 'form.contact': String(e.detail.value || '').slice(0, 20) }) },
  onOwnerStatusInput(e) { this.setData({ 'form.ownerStatus': String(e.detail.value || '').slice(0, 60) }) },
  onFollowContentInput(e) { this.setData({ 'form.followContent': String(e.detail.value || '').slice(0, 200) }) },
  onDecorationTimeChange(e) { this.setData({ decorationTimeIndex: Number(e.detail.value) }) },
  onHouseTypeChange(e) { this.setData({ houseTypeIndex: Number(e.detail.value) }) },
  onRenovationTypeChange(e) { this.setData({ renovationTypeIndex: Number(e.detail.value) }) },
  onFollowStatusChange(e) { this.setData({ followStatusIndex: Number(e.detail.value) }) },
  submit() {
    const f = this.data.form
    if (!f.community) return wx.showToast({ title: '请输入小区', icon: 'none' })
    if (!f.name) return wx.showToast({ title: '请输入姓名', icon: 'none' })
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(now.getMilliseconds()).padStart(3,'0')}`
    const payload = {
      storeId: this.data.storeId,
      storeName: this.data.storeName,
      community: f.community,
      name: f.name,
      contact: f.contact,
      decorationTime: this.data.decorationTimeOptions[this.data.decorationTimeIndex],
      houseType: this.data.houseTypeOptions[this.data.houseTypeIndex],
      renovationType: this.data.renovationTypeOptions[this.data.renovationTypeIndex],
      ownerStatus: f.ownerStatus,
      followStatus: this.data.followStatusOptions[this.data.followStatusIndex],
      followContent: f.followContent,
      updatedAt: nowStr
    }
    if (this.data.editingId) {
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'update', collection: 'customerEntries', docId: this.data.editingId, data: payload } })
        .then(() => { wx.showToast({ title: '已保存', icon: 'success' }); this.setData({ showForm: false, editingId: '' }); this.fetchEntries() })
    } else {
      const id = `ce_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
      const u2 = wx.getStorageSync('current_user') || {}
      const creatorId = u2.id || u2._id || ''
      const creatorName = u2.nickName || u2.username || ''
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { action: 'add', collection: 'customerEntries', data: { id, createdAt: nowStr, createdBy: creatorId, createdByName: creatorName, ...payload } } })
        .then(() => { wx.showToast({ title: '已新增', icon: 'success' }); this.setData({ showForm: false }); this.fetchEntries() })
    }
  },
  /**
   * 列表项点击跳转详情页 🧭
   * 参数：e:any，包含当前项的 `data-id`
   * 行为：根据文档 `_id` 跳转到详情页并在详情页拉取数据
   */
  goToDetail(e) {
    const id = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id) || ''
    if (!id) { wx.showToast({ title: '未找到记录ID', icon: 'none' }); return }
    wx.navigateTo({ url: `/pages/customer-entry-detail/customer-entry-detail?id=${id}` })
  },
  noop() {}
})