import {Alert, Button, Form, Input, message, Switch} from "antd";
import {TabProps, Watermark} from "../lib/types";
import {bitable, ToastType, ViewType} from "@lark-base-open/js-sdk";
import {useEffect, useState} from "react";
import axios, {AxiosError} from "axios";
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
      try {
        const table = await bitable.base.getActiveTable();
        const tableName = await table.getName();
        setTableName(tableName)
      } catch (error) {
        await ui.showToast({
          toastType: ToastType.error,
          message: t('message.table.name.error')
        })
      }
    }
    fn()
  }, []);

  const onFinish = async (watermark: Watermark) => {
    setLoading(true)
    try {
      await export2Excel(watermark)
      messageApi.open({
        type: 'success',
        content: t('embed.message.success'),
      });
    } catch (err: any) {
      if (err instanceof AxiosError) {
        if (err.response && err.response.data instanceof Blob){
          const reader = new FileReader();
          reader.onload = function () {
            // 解析错误信息
            if (typeof reader.result === 'string'){
              const errorMessage = JSON.parse(reader.result).message;
              messageApi.open({
                type: 'error',
                content: t('message.unknown.error', {errorMsg: errorMessage}),
              });
            }
          };
          reader.readAsText(err.response.data);
        }
      } else {
        messageApi.open({
          type: 'error',
          content: t('message.unknown.error', {errorMsg: err.message}),
        });
      }
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
      messageApi.open({
        type: 'error',
        content: t('unsupported.view.type.error'),
      });
      return Promise.reject()
    }
    const viewName = await activeView.getName();
    // 获取可见字段ID
    const vfIdList = await activeView.getVisibleFieldIdList();

    // 添加header
    const fmList = await activeView.getFieldMetaList();
    const rows: string[][] = []
    const header: string[] = []
    for (const fieldMeta of fmList) {
      if (!vfIdList?.includes(fieldMeta.id)) {
        continue;
      }
      header.push(fieldMeta.name);
    }
    rows.push(header)
    // 获取字段数据
    const recordIdList = (await activeView.getVisibleRecordIdList()).filter((id): id is string => !!id);
    const fieldsPromises = vfIdList.map(fieldId => table.getFieldById(fieldId));
    const fields = await Promise.all(fieldsPromises);

    const rowsPromises = recordIdList.map(async (recordId) => {
      const rowPromises = fields.map(field => field.getCellString(recordId));
      return await Promise.all(rowPromises);
    });
    const dataRows = await Promise.all(rowsPromises);
    dataRows.forEach(row => rows.push(row))

    // 生成 Excel
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

    if (watermark.text) {
      formData.append("text", watermark.text)
    }
    formData.append("document", blob, "tmp.xlsx")


    const resp = await axios.post('https://pro.api.cdyufei.com/lark/watermarks/transferable/embedding', formData, {
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
             type="warning"
             message={t('about.message')}
             description={t('about.description').split('\n').map((line, index) => (<p key={index}>{line}</p>))}
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
        <Form.Item label={t('embed.form.label.textWatermark')} name="text">
          <Input placeholder={t('embed.form.textWatermark.input.placeholder')}/>
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