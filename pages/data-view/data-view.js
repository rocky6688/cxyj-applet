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
    rawEntries: [],
    // 日期选择抽屉
    showDatePicker: false,
    pickerTarget: 'start',
    calYear: 0,
    calMonth: 0,
    yearMin: 0,
    yearMax: 0,
    calDays: [],
    weekLabels: ['日', '一', '二', '三', '四', '五', '六']
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
    const today = new Date()
    const s = this.formatDate(this.getStartOfMonth(today))
    const e = this.formatDate(this.getEndOfMonth(today))
    // 每次进入页面都按「本月」重置，同时把区间选择器一起归位，避免显示与实际区间不一致
    this.setData({ role, dateIndex: 1, startDate: s, endDate: e })
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
    else this.drawChartSafe(this.data.metrics)
  },
  /**
   * 打开日期选择抽屉 📅
   * 参数：e:any，data-target = 'start' | 'end'
   * 行为：以该字段当前值为默认展示月份，并生成带禁用状态的日历网格
   */
  openDatePicker(e) {
    const target = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.target) || 'start'
    const baseStr = target === 'start' ? this.data.startDate : this.data.endDate
    let base = new Date()
    if (baseStr) {
      const parts = String(baseStr).split('-').map(Number)
      if (parts.length === 3 && !parts.some((n) => isNaN(n))) base = new Date(parts[0], parts[1] - 1, parts[2])
    }
    const year = base.getFullYear()
    const month = base.getMonth() + 1
    // 年份快捷跳转的可达范围（默认今天前后各 10 年）
    const thisYear = new Date().getFullYear()
    this.setData({
      showDatePicker: true,
      pickerTarget: target,
      calYear: year,
      calMonth: month,
      yearMin: thisYear - 10,
      yearMax: thisYear + 10,
      calDays: this.buildCalendar(target, year, month)
    })
  },
  closeDatePicker() {
    this.setData({ showDatePicker: false }, () => this.drawChartSafe(this.data.metrics))
  },
  noop() {},
  /**
   * 生成日历网格（周日开头）🗓️
   * 参数：target:'start'|'end'，year/month: 展示月份
   * 行为：超出可选范围的日期标记为 disabled —— 开始日期不能晚于结束日期，结束日期不能早于开始日期
   */
  buildCalendar(target, year, month) {
    const firstWeekday = new Date(year, month - 1, 1).getDay()
    const daysInMonth = new Date(year, month, 0).getDate()
    const todayStr = this.formatDate(new Date())
    const cells = []
    for (let i = 0; i < firstWeekday; i++) cells.push({ key: `empty-${i}`, day: '', date: '', disabled: false, selected: false, today: false })
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      let disabled = false
      if (target === 'start' && this.data.endDate) disabled = dateStr > this.data.endDate
      if (target === 'end' && this.data.startDate) disabled = dateStr < this.data.startDate
      const selected = target === 'start' ? dateStr === this.data.startDate : dateStr === this.data.endDate
      cells.push({ key: dateStr, day: d, date: dateStr, disabled, selected, today: dateStr === todayStr })
    }
    return cells
  },
  prevMonth() {
    let year = this.data.calYear
    let month = this.data.calMonth - 1
    if (month < 1) { month = 12; year -= 1 }
    if (year < this.data.yearMin) return
    this.jumpTo(year, month)
  },
  nextMonth() {
    let year = this.data.calYear
    let month = this.data.calMonth + 1
    if (month > 12) { month = 1; year += 1 }
    if (year > this.data.yearMax) return
    this.jumpTo(year, month)
  },
  /** 快速切换年份：一次跳一年 📆 */
  prevYear() {
    const year = this.data.calYear - 1
    if (year < this.data.yearMin) return
    this.jumpTo(year, this.data.calMonth)
  },
  nextYear() {
    const year = this.data.calYear + 1
    if (year > this.data.yearMax) return
    this.jumpTo(year, this.data.calMonth)
  },
  /** 跳到指定年月并重建网格 */
  jumpTo(year, month) {
    this.setData({ calYear: year, calMonth: month, calDays: this.buildCalendar(this.data.pickerTarget, year, month) })
  },
  /**
   * 选择某一天 ✅
   * 参数：e:any，data-date = 'YYYY-MM-DD'，data-disabled = 是否超出可选范围
   */
  pickDay(e) {
    const ds = (e && e.currentTarget && e.currentTarget.dataset) || {}
    const date = ds.date || ''
    if (!date) return
    // dataset 在不同基础库下可能是布尔或字符串，这里两种都兼容
    if (ds.disabled === true || ds.disabled === 'true') {
      wx.showToast({ title: this.data.pickerTarget === 'start' ? '不能晚于结束日期' : '不能早于开始日期', icon: 'none' })
      return
    }
    if (this.data.pickerTarget === 'start') {
      if (this.data.endDate && date > this.data.endDate) {
        wx.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' })
        return
      }
      this.setData({ startDate: date, showDatePicker: false })
    } else {
      if (this.data.startDate && date < this.data.startDate) {
        wx.showToast({ title: '结束日期不能早于开始日期', icon: 'none' })
        return
      }
      this.setData({ endDate: date, showDatePicker: false })
    }
    const sid = this.data.storeIds[this.data.storeIndex]
    if (sid) this.fetchStats(sid)
    else this.drawChartSafe(this.data.metrics)
  },
  /**
   * 快捷选择「今日」⚡
   * 行为：把当前正在选择的字段设为今天；若与另一端的日期冲突，则把另一端一起收敛到今天，保证区间始终合法
   */
  pickToday() {
    const today = this.formatDate(new Date())
    const patch = { showDatePicker: false }
    if (this.data.pickerTarget === 'start') {
      patch.startDate = today
      if (this.data.endDate && this.data.endDate < today) patch.endDate = today
    } else {
      patch.endDate = today
      if (this.data.startDate && this.data.startDate > today) patch.startDate = today
    }
    this.setData(patch)
    const sid = this.data.storeIds[this.data.storeIndex]
    if (sid) this.fetchStats(sid)
    else this.drawChartSafe(this.data.metrics)
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
        // 先让画布挂载完成（弹窗关闭后画布会重新创建），再绘制
        this.setData({ metrics, staffStats, rawEntries: list }, () => this.drawChartSafe(metrics))
      })
  },
  /**
   * 安全重绘图表 🔁
   * 说明：真机上 canvas 是原生组件，日期弹窗打开期间会被移除，
   *      关闭后画布重新挂载需要一点时间，延迟绘制避免画到不存在的画布上
   */
  drawChartSafe(metrics) {
    const run = () => { try { this.drawChart(metrics || this.data.metrics) } catch (e) { /* ignore */ } }
    if (typeof wx.nextTick === 'function') wx.nextTick(() => setTimeout(run, 50))
    else setTimeout(run, 80)
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
