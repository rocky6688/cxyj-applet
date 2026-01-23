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
    pageSize: 10,
    pageIndex: 1,
    jumpInput: '',
    scrollHeight: 600,
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
    renovationTypeOptions: ['局改','全拆改','毛坯'],
    renovationTypeIndex: 0,
    followStatusOptions: ['维护中','已经量房','已经进店','已经签约'],
    followStatusIndex: 0,
    decorationTimeFilterOptions: ['全部','3个月内','3个月以上'],
    decorationTimeFilterIndex: 0,
    houseTypeFilterOptions: ['全部','1居','2居','3居','4居及以上'],
    houseTypeFilterIndex: 0,
    renovationTypeFilterOptions: ['全部','局改','全拆改','毛坯'],
    renovationTypeFilterIndex: 0,
    followStatusFilterOptions: ['全部','维护中','已经量房','已经进店','已经签约'],
    followStatusFilterIndex: 0,
    sortOptions: ['最新优先','最早优先'],
    sortIndex: 0,
    currentUserId: '',
    isManagerForCurrentStore: false,
    creatorFilterOptions: ['全部'],
    creatorFilterIds: [''],
    creatorFilterIndex: 0,
    totalCount: 0,
    totalPages: 1,
    listMarginTop: 0
  },
  /**
   * 页面展示时进行权限与上下文初始化 🛂
   * 入参：无
   * 行为：
   * - 从本地缓存读取当前用户与角色
   * - 仅允许 `ADMIN`、`STAFF`、`MANAGER` 访问
   * - 根据角色初始化门店上下文（员工/店长定向门店，管理员可切换）
   * - 进入页面即显示全局 Loading（数据准备完成后关闭）
   */
  onShow() {
    // 进入页面显示加载中（遮罩防误操作）
    wx.showLoading({ title: '加载中', mask: true })
    const u = wx.getStorageSync('current_user') || {}
    const role = u.role || 'USER'
    if (role !== 'ADMIN' && role !== 'STAFF' && role !== 'MANAGER') {
      wx.showToast({ title: '仅员工/店长/管理员可访问', icon: 'none' })
      // 无权限时关闭 Loading，避免卡住
      wx.hideLoading()
      setTimeout(() => wx.switchTab({ url: '/pages/my/my' }), 600)
      return
    }
    this.setData({ role, currentUserId: u.id || u._id || '' })
    const uid = u.id || u._id
    if (role === 'STAFF') this.initStaffStore(uid)
    else if (role === 'MANAGER') this.initManagerStore(uid)
    else this.initAdminStores()
    this.calcScrollHeight()
  },
  calcScrollHeight() {
    try {
      const sys = wx.getSystemInfoSync()
      const wh = sys.windowHeight || 600
      wx.createSelectorQuery().select('#fixedHeader').boundingClientRect((rect) => {
        const hh = (rect && rect.height) || 0
        const h = Math.max(200, Math.floor(wh - hh))
        this.setData({ scrollHeight: h, listMarginTop: hh })
      }).exec()
    } catch (e) { /* ignore */ }
  },
  /**
   * 店长初始化门店（限定为其管理的门店）🏪
   * 入参：userId:any 当前用户标识
   * 行为：
   * - 查询 `storeMembers` 中该用户的店长记录（role='MANAGER'）
   * - 设置 `storeId` 与 `storeName`，并标记 `isManagerForCurrentStore=true`
   * - 拉取该门店的客户录入列表
   */
  initManagerStore(userId) {
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: userId }, { field: 'role', op: 'eq', value: 'MANAGER' }], limit: 1 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const m = (r && r.data && r.data[0]) || null
        const sid = (m && m.storeId) || ''
        if (!sid) { wx.hideLoading(); return }
        this.setData({ storeId: sid, isManagerForCurrentStore: true })
        return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'stores', where: [{ field: 'id', op: 'eq', value: sid }], limit: 1 } })
      })
      .then((res2) => {
        if (!res2) { this.resetAndFetch(); return }
        const r2 = res2 && res2.result ? res2.result : {}
        const s = (r2 && r2.data && r2.data[0]) || null
        const name = (s && s.name) || ''
        this.setData({
          storeName: name,
          storeIds: [this.data.storeId],
          storeNames: [name],
          storeIndex: 0
        })
        this.initCreatorFilter().then(() => this.resetAndFetch())
      })
  },
  initStaffStore(userId) {
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: userId }, { field: 'role', op: 'eq', value: 'STAFF' }], limit: 1 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const m = (r && r.data && r.data[0]) || null
        const sid = (m && m.storeId) || ''
        if (!sid) { wx.hideLoading(); return }
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
        this.initCreatorFilter().then(() => this.resetAndFetch())
      })
  },
  onStoreChange(e) {
    const i = Number(e.detail.value)
    const sid = this.data.storeIds[i]
    // 记录用户选择，便于返回页时保持一致
    this.setData({ storeIndex: i, storeId: sid, storeName: this.data.storeNames[i] })
    this.initCreatorFilter().then(() => this.resetAndFetch())
  },
  /**
   * 初始化录入人筛选项（管理员：当前门店的所有录入人；店长：当前门店的员工）
   */
  initCreatorFilter() {
    if (!(this.data.role === 'ADMIN' || this.data.isManagerForCurrentStore)) {
      this.setData({ creatorFilterOptions: ['全部'], creatorFilterIds: [''], creatorFilterIndex: 0 })
      return Promise.resolve()
    }
    const sid = this.data.storeId
    if (!sid) {
      this.setData({ creatorFilterOptions: ['全部'], creatorFilterIds: [''], creatorFilterIndex: 0 })
      return Promise.resolve()
    }
    if (this.data.role === 'ADMIN') {
      // 管理员：从当前门店的录入记录中提取录入人去重
      return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'customerEntries', where: [{ field: 'storeId', op: 'eq', value: sid }], field: { createdBy: true, createdByName: true }, limit: 2000 } })
        .then((res) => {
          const r = res && res.result ? res.result : {}
          const list = (r && r.data) || []
          const map = {}
          list.forEach((it) => { const id = it.createdBy || ''; if (!id) return; if (!map[id]) map[id] = it.createdByName || '未知' })
          const ids = ['']
          const names = ['全部']
          Object.keys(map).forEach((id) => { ids.push(id); names.push(map[id]) })
          this.setData({ creatorFilterOptions: names, creatorFilterIds: ids, creatorFilterIndex: 0 })
        })
    }
    // 店长：当前门店员工列表
    return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'storeId', op: 'eq', value: sid }, { field: 'role', op: 'eq', value: 'STAFF' }], field: { userId: true }, limit: 500 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const mems = (r && r.data) || []
        const ids = mems.map(m => m.userId).filter(Boolean)
        if (!ids.length) { this.setData({ creatorFilterOptions: ['全部'], creatorFilterIds: [''], creatorFilterIndex: 0 }); return }
        // 兼容 users.id 与 users._id 两种存储
        return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'users', where: [{ field: 'id', op: 'in', value: ids }], field: { id: true, _id: true, username: true, nickName: true, status: true }, limit: 500 } })
          .then((res2) => {
            const r2 = res2 && res2.result ? res2.result : {}
            let users = (r2 && r2.data) || []
            // 如果按 id 未取到完整，则尝试 _id
            const gotIds = new Set(users.map(u => u.id || u._id))
            const missing = ids.filter(x => !gotIds.has(x))
            const fetchMore = missing.length ? wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'users', where: [{ field: '_id', op: 'in', value: missing }], field: { id: true, _id: true, username: true, nickName: true, status: true }, limit: 500 } }) : Promise.resolve(null)
            return Promise.resolve(fetchMore).then((res3) => {
              const r3 = res3 && res3.result ? res3.result : {}
              const more = (r3 && r3.data) || []
              users = users.concat(more)
              const opts = ['全部']
              const ids2 = ['']
              users.filter(u => (u.status || 'ACTIVE') === 'ACTIVE').forEach(u => { const id = u.id || u._id; const name = u.nickName || u.username || '微信用户'; ids2.push(id); opts.push(name) })
              this.setData({ creatorFilterOptions: opts, creatorFilterIds: ids2, creatorFilterIndex: 0 })
            })
          })
      })
  },
  buildWhere(isLoadMore) {
    const base = [{ field: 'storeId', op: 'eq', value: this.data.storeId }]
    if (!(this.data.role === 'ADMIN' || this.data.isManagerForCurrentStore)) {
      base.push({ field: 'createdBy', op: 'eq', value: this.data.currentUserId })
    }
    if ((this.data.role === 'ADMIN' || this.data.isManagerForCurrentStore) && this.data.creatorFilterIndex > 0) {
      const id = this.data.creatorFilterIds[this.data.creatorFilterIndex]
      if (id) base.push({ field: 'createdBy', op: 'eq', value: id })
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
  fetchTotalCount() {
    const q = this.buildWhere(false)
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'customerEntries', where: q.where, count: true } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const total = (r && r.data && r.data.total) || 0
        const pages = Math.ceil(total / this.data.pageSize) || 1
        this.setData({ totalCount: total, totalPages: pages })
      })
      .catch(() => this.setData({ totalCount: 0, totalPages: 1 }))
  },
  resetAndFetch() {
    this.setData({ entries: [], lastUpdatedAt: '', hasMore: true, pageIndex: 1 })
    this.fetchTotalCount()
    this.fetchEntries(false)
  },
  /**
   * 拉取客户录入列表（含 Loading 控制）📥
   * 入参：isLoadMore:any 是否为滚动加载
   * 行为：
   * - 设置 `isLoading=true` 与显示全局 Loading
   * - 调用云函数查询数据，合并到列表
   * - 在 finally 中关闭 Loading 并复位 `isLoading=false`
   */
  fetchEntries(isLoadMore) {
    if (!this.data.storeId || this.data.isLoading || (!this.data.hasMore && isLoadMore)) return
    this.setData({ isLoading: true })
    wx.showLoading({ title: '加载中', mask: true })
    const q = this.buildWhere(false)
    const skip = (this.data.pageIndex - 1) * this.data.pageSize
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'customerEntries', where: q.where, orderBy: q.orderBy, skip, limit: this.data.pageSize } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const list = (r && r.data) || []
        const last = list[list.length - 1]
        this.setData({ entries: list, lastUpdatedAt: last ? last.updatedAt : this.data.lastUpdatedAt, hasMore: list.length === this.data.pageSize })
      })
      .finally(() => { this.setData({ isLoading: false }); wx.hideLoading() })
  },
  onReachBottom() {},
  prevPage() {
    if (this.data.pageIndex <= 1) return
    this.setData({ pageIndex: this.data.pageIndex - 1 })
    this.fetchEntries(false)
  },
  nextPage() {
    if (!this.data.hasMore) return
    this.setData({ pageIndex: this.data.pageIndex + 1 })
    this.fetchEntries(false)
  },
  onJumpInput(e) { this.setData({ jumpInput: String(e.detail.value || '') }) },
  jumpPage() {
    const p = Number(this.data.jumpInput)
    if (!p || p < 1) { wx.showToast({ title: '请输入正确页码', icon: 'none' }); return }
    if (p > this.data.totalPages) { wx.showToast({ title: '超过最大页码', icon: 'none' }); return }
    this.setData({ pageIndex: p })
    this.fetchEntries(false)
  },
  onDecorationTimeFilterChange(e) { this.setData({ decorationTimeFilterIndex: Number(e.detail.value) }); this.resetAndFetch() },
  onHouseTypeFilterChange(e) { this.setData({ houseTypeFilterIndex: Number(e.detail.value) }); this.resetAndFetch() },
  onRenovationTypeFilterChange(e) { this.setData({ renovationTypeFilterIndex: Number(e.detail.value) }); this.resetAndFetch() },
  onFollowStatusFilterChange(e) { this.setData({ followStatusFilterIndex: Number(e.detail.value) }); this.resetAndFetch() },
  onSortChange(e) { this.setData({ sortIndex: Number(e.detail.value) }); this.resetAndFetch() },
  onCreatorFilterChange(e) { this.setData({ creatorFilterIndex: Number(e.detail.value) }); this.resetAndFetch() },
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
  /**
   * 拨打联系电话（支持多个号码选择）☎️
   * 入参：e:any，从 data-phone 读取原始联系方式字符串
   * 行为：
   * - 解析出手机/座机号码（按数字序列提取，支持多个）
   * - 若存在多个号码，弹出操作菜单供选择
   * - 选择后调用 wx.makePhoneCall 拨打
   */
  callPhone(e) {
    const raw = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.phone) || ''
    const s = String(raw || '')
    // 提取可能的电话号码（去除非数字，支持 7-13 位，含区号）
    const candidates = []
    const normalized = s.replace(/[^0-9]/g, ' ')
    normalized.split(' ').forEach((seg) => {
      const n = seg.trim()
      if (n && n.length >= 7 && n.length <= 13) candidates.push(n)
    })
    if (!candidates.length) { wx.showToast({ title: '无效的联系方式', icon: 'none' }); return }
    const makeCall = (num) => wx.makePhoneCall({ phoneNumber: num })
    if (candidates.length === 1) { makeCall(candidates[0]); return }
    wx.showActionSheet({ itemList: candidates, success: (r) => {
      if (typeof r.tapIndex === 'number') makeCall(candidates[r.tapIndex])
    } })
  },
  noop() {}
})
