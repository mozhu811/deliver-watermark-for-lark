import React, {useEffect, useState} from 'react'
import ReactDOM from 'react-dom/client'
import {bitable} from '@lark-base-open/js-sdk';
import {Tabs, TabsProps} from 'antd';
import EmbedTab from "./components/EmbedTab";

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LoadApp/>
  </React.StrictMode>
)

const items: TabsProps['items'] = [
  {
    key: 'embed',
    label: '嵌入水印',
    children: <EmbedTab />
  },
  {
    key: 'extract',
    label: '提取水印',
    children: (
      <p>extract</p>
    )
  }
]

function LoadApp() {
  const [userId, setUserId] = useState<string>()

  useEffect(() => {
    const fn = async () => {
      const userId = await bitable.bridge.getBaseUserId()
      setUserId(userId)
      const table = await bitable.base.getActiveTable();
      const tableName = await table.getName();
    };
    fn();
  }, []);

  return (
    <>
      <p>当前用户：{userId}</p>
      <Tabs items={items}/>
    </>
  )
}