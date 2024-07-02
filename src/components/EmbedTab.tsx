import {Button, Form, Input} from "antd";
import {Watermark} from "../lib/types";
import {bitable, Env, IField} from "@lark-base-open/js-sdk";
import * as XLSX from 'xlsx';
import {useEffect, useState} from "react";
import axios from "axios";

const EmbedTab = () => {
  const [form] = Form.useForm();
  const [watermark, setWatermark] = useState<Watermark>()
  const [pluginId, setPluginId] = useState<string>('')
  const [env, setEnv] = useState<Env>()
  const [tenantKey, setTenantKey] = useState<string>()
  useEffect(() => {
    const fn = async () => {
      const pluginId = await bitable.bridge.getInstanceId();
      const env = await bitable.bridge.getEnv();
      const tenantKey = await bitable.bridge.getTenantKey();
      setPluginId(pluginId)
      setEnv(env)
      setTenantKey(tenantKey)
    }
    fn()
  }, []);
  const onFinish = async (watermark: Watermark) => {
    await export2Excel()
    watermark.time = new Date()
    setWatermark(watermark)
  };

  const export2Excel = async () => {
    // 获取当前表格
    const table = await bitable.base.getActiveTable();
    const tableName = await table.getName();
    // 获取当前视图
    const activeView = await table.getActiveView();
    const viewName = await activeView.getName();
    // 获取可见字段ID
    const vfIdList = await activeView.getVisibleFieldIdList();
    const fieldMetaList = await activeView.getFieldMetaList();

    // 保存的数据
    const fields: IField[] = [];
    const headers: any[][] = [[]];

    for (const fieldMeta of fieldMetaList) {
      const field = await table.getFieldById(fieldMeta.id);
      if (!vfIdList?.includes(fieldMeta.id)) {
        continue;
      }
      fields.push(field);
      headers[0].push(fieldMeta.name);
    }

    console.log(fields);
    console.log(headers);

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
      headers.push(row);
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(headers);

    const workbook: XLSX.WorkBook = {
      SheetNames: [viewName],
      Sheets: {
        viewName: worksheet,
      },
    };

    const excelBuffer: any = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});

    // 创建 Blob 对象并触发下载
    const blob: Blob = new Blob([excelBuffer], {type: 'application/octet-stream'});

    // 创建 FormData 对象
    const formData = new FormData();
    formData.append("contentDeliver", JSON.stringify(watermark))
    formData.append("document", blob, "data.xlsx")

    axios.post('https://123.60.56.112:9001/flow', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Plugin-Id': pluginId
      }
    })
      .then(response => {
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'response-file.xlsx'; // 设置下载文件的名称
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error:', error);
      });
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