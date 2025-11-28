const ExcelJS = require('exceljs');
const File = require('../models/File');
const { parseExcel } = require('../services/excelService');
const fs = require('fs');
const path = require('path');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    let originalName = req.file.originalname || '';
    if (isEncodingCorrupted(originalName)) {
      originalName = fixEncoding(originalName);
    }

    if (Buffer.isBuffer(originalName)) originalName = originalName.toString('utf8');

    let filePath = req.file.path;
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), filePath);
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    if (!workbook.worksheets || workbook.worksheets.length === 0) {
      throw new Error('Excel 文件没有包含任何工作表');
    }

    const worksheet = workbook.worksheets[0];
    const parsedData = parseExcel(worksheet);

    const file = await File.create({
      originalName: originalName,
      fileName: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      data: parsedData
    });

    try {
      fs.unlinkSync(filePath);
    } catch (e) {}

    res.status(201).json({
      message: '文件上传成功',
      file: {
        id: file.id,
        originalName: file.originalName,
        size: file.size
      }
    });
  } catch (error) {
    res.status(500).json({ error: '文件上传失败: ' + error.message });
  }
};

function isEncodingCorrupted(str) {
  if (typeof str !== 'string') return false;
  return /Ã|Â|æ|¤|\u008b|¸|\u000f|¦/.test(str);
}

function fixEncoding(str) {
  try {
    return Buffer.from(str, 'latin1').toString('utf8');
  } catch (e) {
    return str;
  }
}

exports.getFile = async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);
    if (!file) {
      return res.status(404).json({ error: '文件不存在' });
    }

    res.json({
      id: file.id,
      originalName: file.originalName,
      size: file.size,
      data: file.data
    });
  } catch (error) {
    res.status(500).json({ error: '获取文件失败: ' + error.message });
  }
};

exports.getFileDataForPreview = async (req, res) => {
  try {
    const file = await File.findByPk(req.params.id);
    if (!file) return res.status(404).json({ error: '文件不存在' });
    if (!file.data || !file.data.headers || !file.data.data) {
      return res.status(400).json({ error: '文件数据格式错误' });
    }
    res.json({
      headers: file.data.headers,
      previewData: file.data.data.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: '获取文件预览数据失败: ' + error.message });
  }
};
