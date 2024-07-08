import {Alert, Button, Form, Input, message, Switch} from "antd";
import {TabProps, Watermark} from "../lib/types";
import {bitable, IField, ToastType, ViewType} from "@lark-base-open/js-sdk";
import {useEffect, useState} from "react";
import axios from "axios";
import * as XLSX from '@e965/xlsx'
import TextArea from "antd/es/input/TextArea";
import {useTranslation} from "react-i18next";

const EmbedTab = ({pluginId, baseUserId, tenantKey}: TabProps) => {
  const [form] = Form.useForm();
  const [tableName, setTableName] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [isCustomize, setIsCustomize] = useState(false)
  const {t} = useTranslation();
  const ui = bitable.ui;
  const [messageApi, contextHolder] = message.useMessage();

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
      await messageApi.open({
        type: 'success',
        content: t('embed.message.success'),
      });
    } catch (err: any) {
      await ui.showToast({
        toastType: ToastType.error,
        message: err.message
      });
    } finally {
      setLoading(false)
    }
  };

  const handleSwitchChange = (isCustomize: boolean) => {
    setIsCustomize(isCustomize)
  }

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
    if (watermark.customizeContent) {
      formData.append("customizeContent", watermark.customizeContent)
    } else {
      formData.append("from", watermark.from)
      formData.append("to", watermark.to)
    }

    if (watermark.pContent) {
      formData.append("pContent", watermark.pContent)
    }
    formData.append("document", blob, "tmp.xlsx")

    const resp = await axios.post('https://pro.api.cdyufei.com/lark/watermark/transfer/embed', formData, {
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
      {contextHolder}
      <Alert style={{padding: 10}}
             type="info"
             message={t('about')}
             showIcon/>
      <Form
        form={form}
        name="watermark"
        onFinish={onFinish}
      >
        <Form.Item label={t('embed.form.label.isCustomize')} name="isCustomize"
                   valuePropName="checked">
          <Switch checkedChildren={t('embed.form.isCustomize.switch.yes')}
                  unCheckedChildren={t('embed.form.isCustomize.switch.no')}
                  onChange={handleSwitchChange}/>
        </Form.Item>
        {!isCustomize ? <>
            <Form.Item label={t('embed.form.label.sender')}
                       name="from"
                       rules={[{required: true, message: t('rule.message.required')}]}>
              <Input placeholder={t('embed.form.sender.input.placeholder')}/>
            </Form.Item>
            <Form.Item label={t('embed.form.label.receiver')}
                       name="to"
                       rules={[{required: true, message: t('rule.message.required')}]}>
              <Input placeholder={t('embed.form.receiver.input.placeholder')}/>
            </Form.Item>
          </> :
          <Form.Item label={t('embed.form.label.customize.content')}
                     name="customizeContent"
                     rules={[{required: true, message: t('rule.message.required')}]}>
            <TextArea placeholder={t('embed.form.customize.content')} rows={4}/>
          </Form.Item>}
        <Form.Item label={t('embed.form.label.plainWatermark')} name="pContent">
          <Input placeholder={t('embed.form.plainWatermark.input.placeholder')}/>
        </Form.Item>
        <Form.Item>
          <Button loading={loading} type="primary" htmlType="submit">
            {t('embed.form.submit')}
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}

export default EmbedTab;