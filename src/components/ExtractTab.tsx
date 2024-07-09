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
    name: 'document',
    action: 'https://pro.api.cdyufei.com/lark/watermarks/transferable/extraction',
    accept: '.xlsx,.xls',
    maxCount: 1,
    headers: {
      'X-Plugin-Id': pluginId,
      'X-Tenant-Key': tenantKey,
      'X-Base-User-Id': baseUserId,
    },
    onChange: async (info) => {
      setLoading(true)
      if (info.file.status === 'uploading') {
        return;
      }
      console.log(info.file, info.fileList);
      if (info.file.status === 'done') {
        setWatermarks(info.file.response)
        message.success(t('extract.message.success'));
      } else if (info.file.status === 'error') {
        setWatermarks([])
        message.error(t('extract.message.failed'));
      }
      setLoading(false)
    },
    progress: {
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
                        w.customizeContent ? <div>
                            <div style={{marginTop: 14}}>
                              {w.customizeContent}
                            </div>
                            <p style={{color: 'gray'}}>{`${t('extract.info.time')}：${w.time}`}</p>
                          </div> :
                          <>
                            <p>
                              <span>{t('extract.info.sender')}：</span>{w.from}
                            </p>
                            <p>
                              <span>{t('extract.info.receiver')}：</span>{w.to}
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