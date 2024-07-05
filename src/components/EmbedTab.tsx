import {Button, Form, Input, Switch} from "antd";
import {Watermark, TabProps} from "../lib/types";
import {bitable, IField, ToastType, ViewType} from "@lark-base-open/js-sdk";
import {useEffect, useState} from "react";
import axios, {AxiosError} from "axios";
import * as XLSX from '@e965/xlsx'

const EmbedTab = ({pluginId, baseUserId, tenantKey}: TabProps) => {
  const [form] = Form.useForm();
  const [tableName, setTableName] = useState<string>()
  const [loading, setLoading] = useState(false)
  const ui = bitable.ui;
  useEffect(() => {
    const fn = async () => {
      const table = await bitable.base.getActiveTable();
      const tableName = await table.getName();
      setTableName(tableName)
    }
    fn()
  }, []);

  const onFinish = async (watermark: Watermark) => {
    setLoading(true)
    try {
      await export2Excel(watermark)
    } catch (err: any) {
      if (err instanceof AxiosError) {
        console.log(err)
      }
      await ui.showToast({
        toastType: ToastType.error,
        message: err.message
      });
    } finally {
      setLoading(false)
    }
  };

  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 },
    },
  };

  const export2Excel = async (watermark: Watermark) => {
    // 获取当前表格
    const table = await bitable.base.getActiveTable();
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

    const workSheet = XLSX.utils.aoa_to_sheet(rows);
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, viewName);
    let buffer: any = XLSX.write(workBook, {bookType: 'xlsx', type: 'array'});

    let blob: Blob = new Blob([buffer], {type: 'application/octet-stream'});

    // 创建 FormData 对象
    const formData = new FormData();
    formData.append("fContent", JSON.stringify(watermark))
    formData.append("document", blob, "file.xlsx")

    const resp = await axios.post('https://pro.api.cdyufei.com/lark/watermark/flowable/embed', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Plugin-Id': pluginId,
        'X-Tenant-Key': tenantKey,
        'X-Base-User-Id': baseUserId,
      },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(resp.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}.xlsx`; // 设置下载文件的名称
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
  return (
    <>
      <Form
        {...formItemLayout}
        form={form}
        name="watermark"
        onFinish={onFinish}
      >
        <Form.Item label="发送方" name="from" rules={[{required: true, message: '请输入发送方信息'}]}>
          <Input placeholder="请输入发送方信息"/>
        </Form.Item>
        <Form.Item label="接收方" name="to" rules={[{required: true, message: '请输入接收方信息'}]}>
          <Input placeholder="请输入接收方信息"/>
        </Form.Item>
        <Form.Item label="是否添加明文水印" name="needPlain">
          <Switch defaultChecked={true}/>
        </Form.Item>
        <Form.Item>
          <Button loading={loading} type="primary" htmlType="submit">提交</Button>
        </Form.Item>
      </Form>
    </>
  )
}

export default EmbedTab;