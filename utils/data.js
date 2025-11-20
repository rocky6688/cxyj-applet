/** 装修报价数据配置 */
const renovationData = {
  // 基础拆除类
  demolition: {
    title: '基础拆除类',
    items: [
      { id: 'wall_removal', name: '拆墙', price: 55, unit: '每平', category: 'demolition' },
      { id: 'ceiling_removal', name: '铲天花', price: 9, unit: '每平', category: 'demolition' },
      { id: 'waterproof_grinding', name: '磨防水', price: 38, unit: '每平', category: 'demolition' },
      { id: 'wall_building', name: '砌墙（含粉刷）', price: 198, unit: '每平', category: 'demolition' },
      { id: 'garbage_transport', name: '垃圾外运', price: 260, unit: '4方车', category: 'demolition' },
      { id: 'plumbing_modification', name: '水电局改', price: 0, unit: '项', category: 'demolition' },
      { id: 'protection', name: '成品保护', price: 0, unit: '项', category: 'demolition' }
    ]
  },
  
  // 墙面类
  wall: {
    title: '墙面类',
    items: [
      { id: 'wall_scraping', name: '铲刷', price: 80, unit: '每平', category: 'wall' },
      { id: 'wall_grinding', name: '磨刷', price: 50, unit: '每平', category: 'wall' },
      { id: 'tile_400_800', name: '400*800瓷砖上墙', price: 198, unit: '每平', category: 'wall' },
      { id: 'tile_600_1200', name: '600*1200瓷砖上墙', price: 230, unit: '每平', category: 'wall' }
    ]
  },
  
  // 天花类
  ceiling: {
    title: '天花类',
    items: [
      { id: 'gypsum_ceiling', name: '石膏板吊顶', price: 198, unit: '每平', category: 'ceiling' },
      { id: 'curtain_box', name: '窗帘盒', price: 110, unit: '米', category: 'ceiling' },
      { id: 'aluminum_ceiling', name: '30*60铝扣板吊顶', price: 198, unit: '每平', category: 'ceiling' }
    ]
  },
  
  // 地面类
  floor: {
    title: '地面类',
    items: [
      { id: 'tile_800_800', name: '800*800瓷砖铺贴', price: 188, unit: '每平', category: 'floor' },
      { id: 'tile_600_1200_floor', name: '600*1200瓷砖铺贴', price: 198, unit: '每平', category: 'floor' }
    ]
  },
  
  // 综合类
  comprehensive: {
    title: '综合类',
    items: [
      { id: 'shower', name: '花洒', price: 600, unit: '个', category: 'comprehensive' },
      { id: 'toilet', name: '马桶', price: 800, unit: '个', category: 'comprehensive' },
      { id: 'bathroom_cabinet', name: '浴室柜', price: 1580, unit: '个', category: 'comprehensive' },
      { id: 'hardware', name: '五金挂件', price: 300, unit: '套', category: 'comprehensive' },
      { id: 'shower_partition', name: '淋浴隔断（钢化）', price: 998, unit: '每平', category: 'comprehensive' },
      { id: 'spc_floor', name: 'SPC石塑地板', price: 130, unit: '每平', category: 'comprehensive' },
      { id: 'electric_dryer', name: '电动晾衣架', price: 1480, unit: '个', category: 'comprehensive' },
      { id: 'smart_lock', name: '电子锁', price: 980, unit: '个', category: 'comprehensive' },
      { id: 'aluminum_door_sliding', name: '铝合金推拉门', price: 680, unit: '每平', category: 'comprehensive' },
      { id: 'aluminum_door_single', name: '铝合金单开门', price: 1180, unit: '单扇', category: 'comprehensive' },
      { id: 'wooden_door', name: '实木复合木门', price: 1280, unit: '单扇', category: 'comprehensive' },
      { id: 'kitchen_wall_cabinet', name: '橱柜吊柜', price: 880, unit: '米', category: 'comprehensive' },
      { id: 'kitchen_base_cabinet', name: '橱柜地柜（含石英石台面）', price: 1980, unit: '米', category: 'comprehensive' },
      { id: 'kitchen_sink', name: '橱柜洗菜盆（含龙头+下水）', price: 680, unit: '套', category: 'comprehensive' },
      { id: 'custom_cabinet', name: '定制柜', price: 780, unit: '每平', category: 'comprehensive' },
      { id: 'invisible_security_net', name: '隐形防盗网', price: 180, unit: '每平', category: 'comprehensive' },
      { id: 'grout', name: '美缝（美缝剂）', price: 30, unit: '每平', category: 'comprehensive' },
      { id: 'stairs_fee', name: '楼梯房上楼费', price: 0, unit: '总价*2%', category: 'comprehensive' },
      { id: 'aluminum_window', name: '铝合金封窗', price: 399, unit: '每平', category: 'comprehensive' },
      { id: 'broken_bridge_window', name: '1.4断桥铝封窗（开启扇另计）', price: 499, unit: '每平', category: 'comprehensive' },
      { id: 'bathroom_waterproof', name: '卫生间防水', price: 80, unit: '每平', category: 'comprehensive' }
    ]
  }
}

module.exports = {
  renovationData
}