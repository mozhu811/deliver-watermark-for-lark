import React, {useEffect, useState} from 'react'
import ReactDOM from 'react-dom/client'
import {bitable} from '@lark-base-open/js-sdk';
import {Tabs, TabsProps} from 'antd';
import EmbedTab from "./components/EmbedTab";
import {TabProps} from "./lib/types";
import ExtractTab from "./components/ExtractTab";
import {I18nextProvider, useTranslation} from "react-i18next";
import i18n from "./i18n";

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <LoadApp/>
    </I18nextProvider>
  </React.StrictMode>
)

function LoadApp() {
  const [tabProps, setTabProps] = useState<TabProps>()
  const { t } = useTranslation();
  useEffect(() => {
    const fn = async () => {
      // const lang = await bitable.bridge.getLanguage();
      // initI18n(lang as Language);
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
      label: t('tab.label.embed'),
      children: <EmbedTab tenantKey={tabProps?.tenantKey}
                          baseUserId={tabProps?.baseUserId}
                          pluginId={tabProps?.pluginId}/>
    },
    {
      key: 'extract',
      label: t('tab.label.extract'),
      children: <ExtractTab />
    }
  ]

  return (
    <div>
      <main  style={{ minHeight: '95vh'}}>
        <Tabs items={items}/>
      </main>
      <footer style={{ display: 'flex', justifyContent: 'center'}}>
        Powered by <a href="https://github.com/mozhu811" target='_blank' style={{ marginLeft: 8}}>墨竹</a>
      </footer>
    </div>
  )
}