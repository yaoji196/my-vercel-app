exports.parseExcel = (worksheet) => {
  const headers = [];
  const data = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers.push(cell.value?.toString() || `Column_${colNumber}`);
  });
  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const rowData = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber - 1] || `Column_${colNumber}`;
      let value = cell.value;
      if (value === null || value === undefined || value === '') value = null;
      else if (typeof value === 'number' && Number.isInteger(value)) value = parseInt(value);
      else if (typeof value === 'number') value = parseFloat(value);
      else if (value instanceof Date) value = value.toISOString();
      rowData[header] = value;
    });
    data.push(rowData);
  }
  return { headers, data };
};
