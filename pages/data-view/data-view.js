const { DBQUERY_FUNCTION } = require('../../utils/config.js')

Page({
  data: {
    role: 'USER',
    storeIds: [],
    storeNames: [],
    storeIndex: 0,
    metrics: { created: 0, measured: 0, inStore: 0, signed: 0 },
    staffStats: [],
    dateOptions: ['本周','本月','自定义'],
    dateIndex: 1,
    startDate: '',
    endDate: '',
    rawEntries: []
  },
  onShow() {
    /**
     * 页面显示：根据角色加载可见门店
     * - 管理员：可见全部门店
     * - 店长：仅可见自己管理的门店
     * - 其他：不可查看
     */
    const u = wx.getStorageSync('current_user') || {}
    const role = u.role || 'USER'
    const uid = u.id || u._id || ''
    this.setData({ role })
    const today = new Date()
    const s = this.formatDate(this.getStartOfMonth(today))
    const e = this.formatDate(this.getEndOfMonth(today))
    this.setData({ startDate: s, endDate: e })
    if (role === 'ADMIN') {
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'stores', orderBy: [{ field: 'updatedAt', order: 'desc' }], limit: 200 } })
        .then((res) => {
          const r = res && res.result ? res.result : {}
          const list = (r && r.data) || []
          const ids = list.map((s) => s.id || s._id)
          const names = list.map((s) => s.name)
          this.setData({ storeIds: ids, storeNames: names, storeIndex: 0 })
          if (ids.length > 0) this.fetchStats(ids[0])
        })
      return
    }
    if (role === 'MANAGER') {
      // 先取全部门店，再根据当前用户的店长成员关系过滤
      let allStores = []
      wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'stores', orderBy: [{ field: 'updatedAt', order: 'desc' }], limit: 200 } })
        .then((res) => {
          const r = res && res.result ? res.result : {}
          allStores = (r && r.data) || []
          return wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'storeMembers', where: [{ field: 'userId', op: 'eq', value: uid }, { field: 'role', op: 'eq', value: 'MANAGER' }], limit: 200 } })
        })
        .then((res2) => {
          const rr = res2 && res2.result ? res2.result : {}
          const mems = (rr && rr.data) || []
          const allowed = mems.map((m) => m.storeId)
          const filtered = allStores.filter((s) => allowed.indexOf((s.id || s._id)) >= 0)
          const ids = filtered.map((s) => s.id || s._id)
          const names = filtered.map((s) => s.name)
          this.setData({ storeIds: ids, storeNames: names, storeIndex: 0 })
          if (ids.length > 0) this.fetchStats(ids[0])
        })
      return
    }
    // 其他角色无权限
    return
  },
  onStoreChange(e) {
    const i = Number(e.detail.value)
    const sid = this.data.storeIds[i]
    this.setData({ storeIndex: i })
    if (sid) this.fetchStats(sid)
  },
  onDateOptionChange(e) {
    const i = Number(e.detail.value)
    const today = new Date()
    let s = this.data.startDate
    let en = this.data.endDate
    const opt = this.data.dateOptions[i]
    if (opt === '本周') { s = this.formatDate(this.getStartOfWeek(today)); en = this.formatDate(this.getEndOfWeek(today)) }
    if (opt === '本月') { s = this.formatDate(this.getStartOfMonth(today)); en = this.formatDate(this.getEndOfMonth(today)) }
    this.setData({ dateIndex: i, startDate: s, endDate: en })
    const sid = this.data.storeIds[this.data.storeIndex]
    if (sid) this.fetchStats(sid)
  },
  onStartDateChange(e) {
    const v = String(e.detail.value || '')
    this.setData({ startDate: v })
    const sid = this.data.storeIds[this.data.storeIndex]
    if (sid) this.fetchStats(sid)
  },
  onEndDateChange(e) {
    const v = String(e.detail.value || '')
    this.setData({ endDate: v })
    const sid = this.data.storeIds[this.data.storeIndex]
    if (sid) this.fetchStats(sid)
  },
  fetchStats(storeId) {
    const sdt = this.data.startDate ? `${this.data.startDate} 00:00:00.000` : ''
    const edt = this.data.endDate ? `${this.data.endDate} 23:59:59.999` : ''
    const where = [{ field: 'storeId', op: 'eq', value: storeId }]
    if (sdt) where.push({ field: 'createdAt', op: 'gte', value: sdt })
    if (edt) where.push({ field: 'createdAt', op: 'lte', value: edt })
    wx.cloud.callFunction({ name: DBQUERY_FUNCTION, data: { collection: 'customerEntries', where, limit: 2000 } })
      .then((res) => {
        const r = res && res.result ? res.result : {}
        const list = (r && r.data) || []
        const metrics = { created: list.length, measured: 0, inStore: 0, signed: 0 }
        const byStaff = {}
        list.forEach((it) => {
          const name = it.createdByName || '未知'
          if (!byStaff[name]) byStaff[name] = { name, created: 0, measured: 0, inStore: 0, signed: 0 }
          byStaff[name].created += 1
          if (it.followStatus === '已经量房') { metrics.measured += 1; byStaff[name].measured += 1 }
          if (it.followStatus === '已经进店') { metrics.inStore += 1; byStaff[name].inStore += 1 }
          if (it.followStatus === '已经签约') { metrics.signed += 1; byStaff[name].signed += 1 }
        })
        const staffStats = Object.values(byStaff)
        this.setData({ metrics, staffStats, rawEntries: list })
        this.drawChart(metrics)
      })
  },
  formatDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const da = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${da}`
  },
  getStartOfWeek(today) {
    const t = new Date(today)
    const day = t.getDay() || 7
    t.setDate(t.getDate() - (day - 1))
    t.setHours(0, 0, 0, 0)
    return t
  },
  getEndOfWeek(today) {
    const s = this.getStartOfWeek(today)
    const e = new Date(s)
    e.setDate(s.getDate() + 6)
    e.setHours(23, 59, 59, 999)
    return e
  },
  getStartOfMonth(today) {
    const t = new Date(today.getFullYear(), today.getMonth(), 1)
    t.setHours(0, 0, 0, 0)
    return t
  },
  getEndOfMonth(today) {
    const t = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    t.setHours(23, 59, 59, 999)
    return t
  },
  drawChart(metrics) {
    const ctx = wx.createCanvasContext('metricsChart', this)
    const labels = ['新增','量房','进店','签约']
    const values = [metrics.created, metrics.measured, metrics.inStore, metrics.signed]
    const max = Math.max(1, ...values)
    const w = 320
    const h = 200
    const left = 24
    const right = 24
    const bottom = 24
    const top = 24
    const usableW = w - left - right
    const segment = usableW / 4
    const baseY = h - bottom
    const barW = Math.max(20, Math.floor(segment * 0.5))
    ctx.setFillStyle('#ffffff')
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < values.length; i++) {
      const cx = left + segment * i + segment / 2
      const barH = Math.round((values[i] / max) * (h - top - bottom))
      const x = Math.round(cx - barW / 2)
      const y = Math.round(baseY - barH)
      ctx.setFillStyle('#ff6b35')
      ctx.fillRect(x, y, barW, barH)
      ctx.setTextAlign('center')
      ctx.setFillStyle('#ff6b35')
      ctx.setFontSize(12)
      ctx.fillText(String(values[i]), cx, y - 6)
      ctx.setFillStyle('#606266')
      ctx.setFontSize(10)
      ctx.fillText(labels[i], cx, baseY + 14)
    }
    ctx.draw()
  },
  exportExcel() {
    const storeName = this.data.storeNames[this.data.storeIndex] || ''
    const xml = this.buildExcelXml(this.data.metrics, this.data.staffStats, this.data.rawEntries, storeName, this.data.startDate, this.data.endDate)
    const fs = wx.getFileSystemManager()
    const safeStore = String(storeName || '门店').replace(/[\\/:*?\"<>|]/g, '-')
    const safeStart = String(this.data.startDate || '').replace(/[\\/:*?\"<>|]/g, '-')
    const safeEnd = String(this.data.endDate || '').replace(/[\\/:*?\"<>|]/g, '-')
    const fileName = `数据统计_${safeStore}_${safeStart}_${safeEnd}.xls`
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
    try {
      fs.writeFileSync(filePath, xml, 'utf-8')
      if (typeof wx.shareFileMessage === 'function') {
        wx.shareFileMessage({ filePath })
      } else {
        wx.showToast({ title: '当前版本不支持文件转发', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '导出失败', icon: 'none' })
    }
  },
  buildExcelXml(metrics, staffStats, rawEntries, storeName, startDate, endDate) {
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const safeSheet = (s) => esc(String(s || '').replace(/[\\/:*?\"<>|\[\]]/g, '-').slice(0, 28))
    const rowsStats = [
      `<Row><Cell><Data ss:Type="String">门店</Data></Cell><Cell><Data ss:Type="String">${esc(storeName)}</Data></Cell></Row>`,
      `<Row><Cell><Data ss:Type="String">时间</Data></Cell><Cell><Data ss:Type="String">${esc(startDate)} 至 ${esc(endDate)}</Data></Cell></Row>`,
      `<Row/>`,
      `<Row><Cell><Data ss:Type="String">指标</Data></Cell><Cell><Data ss:Type="String">数量</Data></Cell></Row>`,
      `<Row><Cell><Data ss:Type="String">新增</Data></Cell><Cell><Data ss:Type="Number">${metrics.created}</Data></Cell></Row>`,
      `<Row><Cell><Data ss:Type="String">量房</Data></Cell><Cell><Data ss:Type="Number">${metrics.measured}</Data></Cell></Row>`,
      `<Row><Cell><Data ss:Type="String">进店</Data></Cell><Cell><Data ss:Type="Number">${metrics.inStore}</Data></Cell></Row>`,
      `<Row><Cell><Data ss:Type="String">签约</Data></Cell><Cell><Data ss:Type="Number">${metrics.signed}</Data></Cell></Row>`
    ].join('')
    const header = `<Row><Cell><Data ss:Type="String">业务员</Data></Cell><Cell><Data ss:Type="String">新增</Data></Cell><Cell><Data ss:Type="String">量房</Data></Cell><Cell><Data ss:Type="String">进店</Data></Cell><Cell><Data ss:Type="String">签约</Data></Cell></Row>`
    const rowsStaff = (staffStats || []).map(it => `
      <Row>
        <Cell><Data ss:Type="String">${esc(it.name)}</Data></Cell>
        <Cell><Data ss:Type="Number">${Number(it.created || 0)}</Data></Cell>
        <Cell><Data ss:Type="Number">${Number(it.measured || 0)}</Data></Cell>
        <Cell><Data ss:Type="Number">${Number(it.inStore || 0)}</Data></Cell>
        <Cell><Data ss:Type="Number">${Number(it.signed || 0)}</Data></Cell>
      </Row>`).join('')
    const staffSheets = (staffStats || []).map(st => {
      const name = st && st.name ? st.name : '未知'
      const entries = (rawEntries || []).filter(it => (it.createdByName || '未知') === name)
      const head = `<Row><Cell><Data ss:Type="String">小区</Data></Cell><Cell><Data ss:Type="String">姓名</Data></Cell><Cell><Data ss:Type="String">联系电话</Data></Cell><Cell><Data ss:Type="String">跟进状态</Data></Cell><Cell><Data ss:Type="String">创建时间</Data></Cell></Row>`
      const rows = entries.map(it => `
        <Row>
          <Cell><Data ss:Type="String">${esc(it.community)}</Data></Cell>
          <Cell><Data ss:Type="String">${esc(it.name)}</Data></Cell>
          <Cell><Data ss:Type="String">${esc(it.contact)}</Data></Cell>
          <Cell><Data ss:Type="String">${esc(it.followStatus)}</Data></Cell>
          <Cell><Data ss:Type="String">${esc(it.createdAt)}</Data></Cell>
        </Row>`).join('')
      return `
  <Worksheet ss:Name="${safeSheet(name)}">
    <Table>${head}${rows}</Table>
  </Worksheet>`
    }).join('')
    const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="指标总览">
    <Table>${rowsStats}</Table>
  </Worksheet>
  <Worksheet ss:Name="按业务员统计">
    <Table>${header}${rowsStaff}</Table>
  </Worksheet>
  ${staffSheets}
</Workbook>`
    return xml
  }
})