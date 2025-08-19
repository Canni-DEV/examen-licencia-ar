import { useEffect, useState } from 'react'
import { StudySection } from '../types'
import { useTranslation } from 'react-i18next'
import { publicPath } from '../utils/paths'
import { TabNav, TabItem } from '../ui'

type Tab = 'manual' | 'senales' | 'material'

export default function StudyPage() {
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState<Tab>('manual')
  const [sections, setSections] = useState<StudySection[]>([])
  const fileMap: Record<Tab, string> = {
    manual: `data/${i18n.language}/estudio_manual.json`,
    senales: `data/${i18n.language}/estudio_senales.json`,
    material: `data/${i18n.language}/estudio_material.json`
  }

  useEffect(() => {
    const url = publicPath('/' + fileMap[tab])
    fetch(url).then(r => r.json()).then(setSections).catch(() => setSections([]))
  }, [tab, i18n.language])

  const tabs: TabItem[] = [
    { id: 'manual', label: t('study.manual') },
    { id: 'senales', label: t('study.signals') },
    { id: 'material', label: t('study.material') }
  ]

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">{t('nav.study')}</h1>
      <TabNav items={tabs} current={tab} onChange={(id) => setTab(id as Tab)} className="mb-4" />

      <div className="prose dark:prose-invert max-w-none">
        {sections.map((s, i) => (
          <section key={i} className="mb-6">
            <h2>{s.titulo}</h2>
            <div dangerouslySetInnerHTML={{ __html: s.html }} />
          </section>
        ))}
      </div>
    </section>
  )
}
