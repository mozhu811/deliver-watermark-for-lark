import React, {useEffect, useState} from 'react'
import ReactDOM from 'react-dom/client'
import {bitable} from '@lark-base-open/js-sdk';
import {Tabs, TabsProps} from 'antd';
import EmbedTab from "./components/EmbedTab";
import {TabProps} from "./lib/types";
import ExtractTab from "./components/ExtractTab";

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LoadApp/>
  </React.StrictMode>
)

function LoadApp() {
  const [tabProps, setTabProps] = useState<TabProps>()
  useEffect(() => {
    const fn = async () => {
      const baseUserId = await bitable.bridge.getBaseUserId()
      const tenantKey = await bitable.bridge.getTenantKey();
      const pluginId = await bitable.bridge.getInstanceId();
      setTabProps({baseUserId, tenantKey, pluginId})
    };
    fn();
  }, []);

  const items: TabsProps['items'] = [
    {
      key: 'embed',
      label: '嵌入水印',
      children: <EmbedTab tenantKey={tabProps?.tenantKey}
                          baseUserId={tabProps?.baseUserId}
                          pluginId={tabProps?.pluginId}/>
    },
    {
      key: 'extract',
      label: '提取水印',
      children: <ExtractTab />
    }
  ]

  return (
    <>
      <Tabs items={items}/>
    </>
  )
}