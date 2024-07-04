import {Button, Form, Input} from "antd";
import {Watermark} from "../lib/types";
import {bitable, IField, ToastType, ViewType} from "@lark-base-open/js-sdk";
import {useEffect, useState} from "react";
import axios from "axios";
import ExcelJS from "exceljs";

const EmbedTab = () => {
  const [form] = Form.useForm();
  const [pluginId, setPluginId] = useState<string>('')
  const [tenantKey, setTenantKey] = useState<string>()
  const [tableName, setTableName] = useState<string>()
  useEffect(() => {
    const fn = async () => {
      const pluginId = await bitable.bridge.getInstanceId();
      const tenantKey = await bitable.bridge.getTenantKey();
      const table = await bitable.base.getActiveTable();
      const tableName = await table.getName();
      setTableName(tableName)
      setPluginId(pluginId)
      setTenantKey(tenantKey)
    }
    fn()
  }, []);
  const onFinish = async (watermark: Watermark) => {
    await export2Excel(watermark)
  };

  const export2Excel = async (watermark: Watermark) => {
    const ui = bitable.ui;
    // 获取当前表格
    const table = await bitable.base.getActiveTable();
    const tableName = await table.getName();
    // 获取当前视图
    const activeView = await table.getActiveView();
    const viewType = await activeView.getType();
    if (viewType !== ViewType.Grid) {
      await ui.showToast({
        toastType: ToastType.error,
        message: '仅支持将表格视图导出为Excel'
      });
      return;
    }
    const viewName = await activeView.getName();
    // 获取可见字段ID
    const vfIdList = await activeView.getVisibleFieldIdList();
    const fieldMetaList = await activeView.getFieldMetaList();

    // 保存的数据
    const fields: IField[] = [];
    const rows: any[][] = [[]];

    for (const fieldMeta of fieldMetaList) {
      const field = await table.getFieldById(fieldMeta.id);
      if (!vfIdList?.includes(fieldMeta.id)) {
        continue;
      }
      fields.push(field);
      rows[0].push(fieldMeta.name);
    }

    // 创建一个空的Excel，先添加水印，再填充数据，避免数据流出
    const workbook = new ExcelJS.Workbook();
    if (!watermark.time) {
      watermark.time = new Date()
    }
    workbook.subject = `${tableName}`
    workbook.title = `${tableName}`
    workbook.created = watermark.time
    workbook.modified = watermark.time
    workbook.lastModifiedBy = watermark.from
    workbook.creator = watermark.from

    workbook.addWorksheet()
    let buffer = await workbook.xlsx.writeBuffer({filename: `${tableName}.xlsx`});
    let blob: Blob = new Blob([buffer], {type: 'application/octet-stream'});

    // 创建 FormData 对象
    const formData = new FormData();
    formData.append("fContent", JSON.stringify(watermark))
    formData.append("document", blob, "payload.xlsx")

    const resp = await axios.post('https://pro.api.cdyufei.com/lark/watermark/flowable/embed', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Plugin-Id': pluginId,
        'X-Tenant-Key': tenantKey
      },
      responseType: 'blob'
    });

    const url2 = window.URL.createObjectURL(resp.data);
    const a2 = document.createElement('a');
    a2.href = url2;
    a2.download = `${tableName}222.xlsx`; // 设置下载文件的名称
    document.body.appendChild(a2);
    a2.click();
    document.body.removeChild(a2);
    window.URL.revokeObjectURL(url2);

    const wb2 = new ExcelJS.Workbook()
    const watermarked = await wb2.xlsx.load(resp.data);
    const firstSheet = watermarked.worksheets[0];

    // 获取字段数据
    const recordIdList = await activeView.getVisibleRecordIdList();
    for (const recordId of recordIdList) {
      if (!recordId) {
        continue;
      }

      const row: string[] = [];
      for (const field of fields) {
        const cellString = await field.getCellString(recordId);
        row.push(cellString);
      }
      rows.push(row);
    }

    console.log(rows);
    firstSheet.addRows(rows)

    buffer = await watermarked.xlsx.writeBuffer({filename: `${tableName}.xlsx`});
    // 创建 Blob 对象并触发下载
    blob = new Blob([buffer], {type: 'application/oct-stream'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}.xlsx`; // 设置下载文件的名称
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    // 添加一个工作表
//
//     worksheet.addRows(rows)
//
//     const buffer = await workbook.xlsx.writeBuffer({filename: `${tableName}.xlsx`});
//     // 创建 Blob 对象并触发下载
//     const blob: Blob = new Blob([buffer], {type: 'application/oct-stream'});
//
//     // 创建 FormData 对象
//     const formData = new FormData();
//     formData.append("fContent", JSON.stringify(watermark))
//     formData.append("document", blob, "data.xlsx")
//
//     axios.post('https://pro.api.cdyufei.com/lark/watermark/flowable/embed', formData, {
//       rows: {
//         'Content-Type': 'multipart/form-data',
//         'X-Plugin-Id': pluginId,
//         'X-Tenant-Key': tenantKey
//       }
//     })
//       .then(response => {
//         const url = window.URL.createObjectURL(response.data);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `${tableName}.xlsx`; // 设置下载文件的名称
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         window.URL.revokeObjectURL(url);
//       })
//       .catch(error => {
//         console.error('Error:', error);
//       });
  }
  return (
    <>
      <Form
        form={form}
        onFinish={onFinish}
      >
        <Form.Item label="发送方" name="from" rules={[{required: true, message: '请输入发送方信息'}]}>
          <Input placeholder="请输入发送方信息"/>
        </Form.Item>
        <Form.Item label="接收方" name="to" rules={[{required: true, message: '请输入接收方信息'}]}>
          <Input placeholder="请输入接收方信息"/>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">提交</Button>
        </Form.Item>
      </Form>
    </>
  )
}

export default EmbedTab;