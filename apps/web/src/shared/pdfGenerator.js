import jsPDF from 'jspdf'

export function generateMerchantReportPDF(data, reportType = 'overview') {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Colors
  const primaryColor = [59, 130, 246] // Blue
  const successColor = [34, 197, 94] // Green
  const warningColor = [245, 158, 11] // Orange
  const dangerColor = [239, 68, 68] // Red
  
  let yPosition = 20
  
  // Helper function to add text with styling
  const addText = (text, x, y, options = {}) => {
    doc.setFontSize(options.fontSize || 12)
    doc.setTextColor(...(options.color || [0, 0, 0]))
    doc.text(text, x, y)
  }
  
  // Helper function to add line
  const addLine = (x1, y1, x2, y2, color = [0, 0, 0]) => {
    doc.setDrawColor(...color)
    doc.line(x1, y1, x2, y2)
  }
  
  // Helper function to add rectangle
  const addRect = (x, y, width, height, color = [255, 255, 255], fillColor = null) => {
    if (fillColor) {
      doc.setFillColor(...fillColor)
      doc.rect(x, y, width, height, 'F')
    }
    doc.setDrawColor(...color)
    doc.rect(x, y, width, height)
  }
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(...primaryColor)
  doc.text('MERCHANT ANALYTICS REPORT', pageWidth / 2, yPosition, { align: 'center' })
  
  yPosition += 15
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  addText(`Report Type: ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 20, yPosition)
  yPosition += 8
  addText(`Period: ${data.period}`, 20, yPosition)
  yPosition += 8
  addText(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, 20, yPosition)
  
  yPosition += 15
  addLine(20, yPosition, pageWidth - 20, yPosition, primaryColor)
  yPosition += 15
  
  // Overview Section
  doc.setFontSize(16)
  doc.setTextColor(...primaryColor)
  doc.text('OVERVIEW METRICS', 20, yPosition)
  yPosition += 15
  
  const overview = data.overview || data.summary || {}
  const metrics = [
    { label: 'Total Revenue', value: `LKR ${(overview.totalRevenue || 0).toLocaleString()}`, color: successColor },
    { label: 'Total Orders', value: (overview.totalOrders || 0).toString(), color: primaryColor },
    { label: 'Completed Orders', value: (overview.completedOrders || 0).toString(), color: successColor },
    { label: 'Cancelled Orders', value: (overview.cancelledOrders || 0).toString(), color: dangerColor },
    { label: 'Pending Orders', value: (overview.pendingOrders || 0).toString(), color: warningColor },
    { label: 'Average Order Value', value: `LKR ${(overview.averageOrderValue || 0).toLocaleString()}`, color: primaryColor }
  ]
  
  // Create metrics grid
  const colWidth = (pageWidth - 60) / 2
  const rowHeight = 25
  
  metrics.forEach((metric, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = 20 + (col * (colWidth + 20))
    const y = yPosition + (row * rowHeight)
    
    // Check if we need a new page
    if (y + rowHeight > pageHeight - 30) {
      doc.addPage()
      yPosition = 20
      const newY = yPosition + (row * rowHeight)
      drawMetricBox(x, newY, colWidth, rowHeight, metric)
    } else {
      drawMetricBox(x, y, colWidth, rowHeight, metric)
    }
  })
  
  yPosition += (Math.ceil(metrics.length / 2) * rowHeight) + 20
  
  function drawMetricBox(x, y, width, height, metric) {
    // Metric box
    addRect(x, y - 12, width, height, [200, 200, 200], [248, 250, 252])
    
    // Metric label
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(metric.label, x + 5, y - 5)
    
    // Metric value
    doc.setFontSize(12)
    doc.setTextColor(...metric.color)
    doc.text(metric.value, x + 5, y + 5)
  }
  
  // Delivery Metrics (if available)
  if (data.deliveries) {
    doc.setFontSize(16)
    doc.setTextColor(...primaryColor)
    doc.text('DELIVERY METRICS', 20, yPosition)
    yPosition += 15
    
    const deliveryMetrics = [
      { label: 'Total Deliveries', value: (data.deliveries.totalDeliveries || 0).toString() },
      { label: 'Average Delivery Time', value: `${(data.deliveries.averageDeliveryTime || 0).toFixed(1)} minutes` },
      { label: 'Total Distance', value: `${(data.deliveries.totalDistance || 0).toFixed(2)} km` }
    ]
    
    deliveryMetrics.forEach((metric, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = 20 + (col * (colWidth + 20))
      const y = yPosition + (row * rowHeight)
      
      // Check if we need a new page
      if (y + rowHeight > pageHeight - 30) {
        doc.addPage()
        yPosition = 20
        const newY = yPosition + (row * rowHeight)
        drawDeliveryMetricBox(x, newY, colWidth, rowHeight, metric)
      } else {
        drawDeliveryMetricBox(x, y, colWidth, rowHeight, metric)
      }
    })
    
    yPosition += (Math.ceil(deliveryMetrics.length / 2) * rowHeight) + 20
  }
  
  function drawDeliveryMetricBox(x, y, width, height, metric) {
    // Metric box
    addRect(x, y - 12, width, height, [200, 200, 200], [248, 250, 252])
    
    // Metric label
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(metric.label, x + 5, y - 5)
    
    // Metric value
    doc.setFontSize(12)
    doc.setTextColor(...primaryColor)
    doc.text(metric.value, x + 5, y + 5)
  }
  
  // Recent Orders (if available)
  if (data.recentOrders && data.recentOrders.length > 0) {
    doc.setFontSize(16)
    doc.setTextColor(...primaryColor)
    doc.text('RECENT ORDERS', 20, yPosition)
    yPosition += 15
    
    data.recentOrders.slice(0, 5).forEach((order, index) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 20
      }
      
      // Order number
      doc.setFontSize(12)
      doc.setTextColor(...primaryColor)
      doc.text(`${order.orderNumber}`, 20, yPosition)
      
      // Customer name
      doc.setTextColor(0, 0, 0)
      doc.text(`${order.customer?.firstName} ${order.customer?.lastName}`, 80, yPosition)
      
      // Total amount
      doc.text(`LKR ${(order.total || 0).toLocaleString()}`, 140, yPosition)
      
      // Status
      const statusColor = order.status === 'delivered' ? successColor : 
                         order.status === 'cancelled' ? dangerColor : warningColor
      doc.setTextColor(...statusColor)
      doc.text(order.status, 180, yPosition)
      
      yPosition += 12
    })
    
    yPosition += 15
  }
  
  // Top Products (if available)
  if (data.topProducts && data.topProducts.length > 0) {
    doc.setFontSize(16)
    doc.setTextColor(...primaryColor)
    doc.text('TOP PRODUCTS', 20, yPosition)
    yPosition += 15
    
    data.topProducts.slice(0, 5).forEach((product, index) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage()
        yPosition = 20
      }
      
      // Product name
      doc.setFontSize(12)
      doc.setTextColor(...primaryColor)
      doc.text(product.productName || 'Unknown Product', 20, yPosition)
      
      // Quantity sold
      doc.setTextColor(0, 0, 0)
      doc.text(`${product.totalSold || 0} sold`, 120, yPosition)
      
      // Revenue
      doc.setTextColor(...successColor)
      doc.text(`LKR ${(product.totalRevenue || 0).toLocaleString()}`, 160, yPosition)
      
      yPosition += 12
    })
    
    yPosition += 15
  }
  
  // Footer
  const footerY = pageHeight - 20
  addLine(20, footerY - 5, pageWidth - 20, footerY - 5, [200, 200, 200])
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('Generated by Rural Link Merchant Portal', pageWidth / 2, footerY, { align: 'center' })
  
  return doc
}

export function generateFinancialReportPDF(data) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  let yPosition = 20
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(59, 130, 246)
  doc.text('FINANCIAL REPORT', pageWidth / 2, yPosition, { align: 'center' })
  
  yPosition += 15
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Period: ${data.period}`, 20, yPosition)
  yPosition += 8
  doc.text(`Generated: ${new Date(data.generatedAt).toLocaleString()}`, 20, yPosition)
  
  yPosition += 20
  
  // Financial Summary
  doc.setFontSize(16)
  doc.setTextColor(59, 130, 246)
  doc.text('FINANCIAL SUMMARY', 20, yPosition)
  yPosition += 15
  
  const financial = data.financial || {}
  const financialMetrics = [
    { label: 'Total Revenue', value: `LKR ${(financial.totalRevenue || 0).toLocaleString()}` },
    { label: 'Average Order Value', value: `LKR ${(financial.averageOrderValue || 0).toLocaleString()}` },
    { label: 'Total Orders', value: (financial.totalOrders || 0).toString() },
    { label: 'Completed Orders', value: (financial.completedOrders || 0).toString() },
    { label: 'Revenue per Order', value: `LKR ${(financial.revenuePerOrder || 0).toLocaleString()}` }
  ]
  
  financialMetrics.forEach((metric, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = 20 + (col * 90)
    const y = yPosition + (row * 20)
    
    // Check if we need a new page
    if (y + 20 > pageHeight - 30) {
      doc.addPage()
      yPosition = 20
      const newY = yPosition + (row * 20)
      drawFinancialMetric(x, newY, metric)
    } else {
      drawFinancialMetric(x, y, metric)
    }
  })
  
  yPosition += (Math.ceil(financialMetrics.length / 2) * 20) + 20
  
  function drawFinancialMetric(x, y, metric) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(metric.label, x, y)
    doc.setFontSize(12)
    doc.setTextColor(0, 0, 0)
    doc.text(metric.value, x, y + 8)
  }
  
  // Daily Revenue Chart (simplified)
  if (financial.dailyRevenue && financial.dailyRevenue.length > 0) {
    doc.setFontSize(16)
    doc.setTextColor(59, 130, 246)
    doc.text('DAILY REVENUE TREND', 20, yPosition)
    yPosition += 15
    
    doc.setFontSize(10)
    doc.text('Date', 20, yPosition)
    doc.text('Revenue', 80, yPosition)
    doc.text('Orders', 140, yPosition)
    yPosition += 10
    
    financial.dailyRevenue.slice(0, 10).forEach((day) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage()
        yPosition = 20
      }
      
      const date = `${day._id.day}/${day._id.month}/${day._id.year}`
      doc.text(date, 20, yPosition)
      doc.text(`LKR ${(day.revenue || 0).toLocaleString()}`, 80, yPosition)
      doc.text((day.orders || 0).toString(), 140, yPosition)
      yPosition += 10
    })
  }
  
  return doc
}
