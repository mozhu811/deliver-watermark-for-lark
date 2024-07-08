import {TabProps, Watermark} from "../lib/types";
import {Button, Empty, message, Upload, UploadProps} from "antd";
import React, {useState} from "react";
import {UploadOutlined} from '@ant-design/icons'
import {useTranslation} from "react-i18next";
import moment from "moment/moment";

const ExtractTab = ({pluginId, tenantKey, baseUserId}: TabProps) => {
  const [loading, setLoading] = useState(false)
  const [watermarks, setWatermarks] = useState<Watermark[]>(
    [])
  const {t} = useTranslation();
  const props: UploadProps = {
    name: 'file',
    action: 'https://pro.api.cdyufei.com/lark/watermark/flowable/extract',
    accept: '.xlsx,.xls',
    showUploadList: false,
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info) {
      setLoading(true)
      if (info.file.status === 'uploading') {
        return;
      }
      console.log(info.file, info.fileList);
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
      setLoading(false)
    },
    progress: {
      strokeColor: {
        '0%': '#108ee9',
        '100%': '#87d068',
      },
      strokeWidth: 3,
      format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
    },
  };

  return (
    <div>
      <Upload {...props}>
        <Button loading={loading} type="primary" icon={<UploadOutlined/>}>
          {t('extract.upload.btn')}
        </Button>
      </Upload>
      <h3>{t('extract.header')}</h3>
      <div style={{backgroundColor: '#f5f6f7', borderRadius: 10}}>
        <div style={{padding: 10}}>
          {
            watermarks.length > 0 ?
              <>
                {watermarks.map((w, index) => {
                  return (
                    <div key={`${w.from}-${w.to}-${index}`}>
                      {
                        w.isCustomize ? <div>
                            <div style={{marginTop: 14}}>
                              {w.customizeContent}
                            </div>
                            <p style={{color: 'gray'}}>{t('extract.info.time')}：2024/07/07 19:22:22</p>
                          </div> :
                          <>
                            <p>
                              <span style={{fontSize: 16}}>{t('extract.info.sender')}：</span>admin
                            </p>
                            <p>
                              <span style={{fontSize: 16}}>{t('extract.info.receiver')}：</span>admin
                            </p>
                            <p>
                              <span style={{color: 'gray'}}>
                                {`${t('extract.info.time')}: ${moment(w.time).format('YYYY-MM-DD HH:mm:ss')}`}
                              </span>
                            </p>
                          </>
                      }
                    </div>
                  )
                })}
              </> :
              <Empty description={t('extract.empty')}/>
          }
        </div>
      </div>
    </div>
  )
}

export default ExtractTab